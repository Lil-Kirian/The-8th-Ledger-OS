import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isPrimaryAdmin } from "@/lib/auth";

/* ============================================================
   CONFIG
   ============================================================ */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"],
  document: ["application/pdf"],
};

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

/* ============================================================
   HELPERS
   ============================================================ */
function handleError(error: any): NextResponse {
  console.error("[UPLOAD ERROR]", error);
  return NextResponse.json(
    { success: false, error: "Upload failed" },
    { status: 500 }
  );
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}

function generateKey(prefix: string, originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.includes(".") ? originalName.split(".").pop() : "bin";
  const safeName = sanitizeFilename(originalName.split(".")[0] || "file");
  return `${prefix}/${timestamp}-${random}-${safeName}.${ext}`;
}

function isAllowedType(mime: string, uploadType: string): boolean {
  if (uploadType === "kyc") {
    return [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document].includes(mime);
  }
  if (uploadType === "asset" || uploadType === "hall" || uploadType === "execution") {
    return ALLOWED_TYPES.image.includes(mime);
  }
  return [...ALLOWED_TYPES.image, ...ALLOWED_TYPES.document].includes(mime);
}

function getMaxFiles(uploadType: string): number {
  if (uploadType === "asset") return 20;
  if (uploadType === "kyc") return 5;
  if (uploadType === "hall") return 10;
  if (uploadType === "execution") return 10;
  return 5;
}

/* ============================================================
   AUTH GATES
   ============================================================ */
async function verifyUploadAccess(
  user: Awaited<ReturnType<typeof getSessionUser>>,
  uploadType: string,
  metadata: Record<string, string>
): Promise<{ allowed: boolean; error?: string; status?: number }> {
  if (!user) {
    return { allowed: false, error: "Authentication required", status: 401 };
  }

  // Asset images: primary admin only
  if (uploadType === "asset") {
    if (!isPrimaryAdmin(user.ledgerId)) {
      return { allowed: false, error: "Primary admin authority required", status: 403 };
    }
    return { allowed: true };
  }

  // KYC docs: any authenticated user, but only their own
  if (uploadType === "kyc") {
    const targetUser = metadata.userId || metadata.ledgerId;
    if (targetUser && targetUser !== user.ledgerId && !isPrimaryAdmin(user.ledgerId)) {
      return { allowed: false, error: "Cannot upload KYC for another user", status: 403 };
    }
    return { allowed: true };
  }

  // Execution proof: primary admin or hall executive
  if (uploadType === "execution") {
    const hallId = metadata.hallId;
    if (!hallId) {
      return { allowed: false, error: "hallId required for execution uploads", status: 400 };
    }
    if (isPrimaryAdmin(user.ledgerId)) return { allowed: true };

    const cabinet = await prisma.executiveCabinet.findUnique({
      where: { hallId },
      select: { speakerId: true, treasurerId: true, wardenId: true, scribeId: true },
    });
    const isExecutive =
      cabinet &&
      (cabinet.speakerId === user.id ||
        cabinet.treasurerId === user.id ||
        cabinet.wardenId === user.id ||
        cabinet.scribeId === user.id);

    if (!isExecutive) {
      return { allowed: false, error: "Hall executive or primary admin required", status: 403 };
    }
    return { allowed: true };
  }

  // Hall photos: primary admin or hall owner
  if (uploadType === "hall") {
    const hallId = metadata.hallId;
    if (!hallId) {
      return { allowed: false, error: "hallId required for hall uploads", status: 400 };
    }
    if (isPrimaryAdmin(user.ledgerId)) return { allowed: true };

    const membership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id },
    });
    if (!membership) {
      return { allowed: false, error: "Hall ownership required", status: 403 };
    }
    return { allowed: true };
  }

  return { allowed: false, error: "Unknown upload type", status: 400 };
}

/* ============================================================
   STORAGE DRIVER (Local filesystem — swap for S3/R2 in prod)
   ============================================================ */
async function saveFile(key: string, buffer: Buffer): Promise<string> {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }

  const fullPath = join(UPLOAD_DIR, key);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(fullPath, buffer);
  return `/uploads/${key}`;
}

/* ============================================================
   POST /api/upload — Multipart file upload
   ============================================================ */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getSessionUser();

    const formData = await request.formData();
    const uploadType = String(formData.get("uploadType") || "general");
    const metadataRaw = String(formData.get("metadata") || "{}");
    let metadata: Record<string, string> = {};
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid metadata JSON" },
        { status: 400 }
      );
    }

    const access = await verifyUploadAccess(user, uploadType, metadata);
    if (!access.allowed) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status || 403 }
      );
    }

    const files: File[] = [];
    const entries = Array.from(formData.entries());
    for (const [, value] of entries) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const maxFiles = getMaxFiles(uploadType);
    if (files.length > maxFiles) {
      return NextResponse.json(
        { success: false, error: `Maximum ${maxFiles} files allowed for ${uploadType} uploads` },
        { status: 400 }
      );
    }

    const uploaded: Array<{
      originalName: string;
      key: string;
      url: string;
      size: number;
      mimeType: string;
    }> = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        );
      }

      if (!isAllowedType(file.type, uploadType)) {
        return NextResponse.json(
          {
            success: false,
            error: `File type ${file.type} not allowed for ${uploadType}. Allowed: ${uploadType === "kyc" ? "images, PDFs" : "images only"}`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const prefix =
        uploadType === "kyc"
          ? `kyc/${metadata.userId || user!.ledgerId}`
          : uploadType === "asset"
          ? `assets/${metadata.poolId || "general"}`
          : uploadType === "hall"
          ? `halls/${metadata.hallId || "general"}`
          : uploadType === "execution"
          ? `execution/${metadata.hallId || "general"}`
          : "general";

      const key = generateKey(prefix, file.name);
      const url = await saveFile(key, buffer);

      uploaded.push({
        originalName: file.name,
        key,
        url,
        size: file.size,
        mimeType: file.type,
      });
    }

    // Audit log for asset/execution uploads
    if (uploadType === "asset" || uploadType === "execution") {
      await prisma.auditLog.create({
        data: {
          eventType: uploadType === "asset" ? "asset_media_uploaded" : "execution_proof_uploaded",
          description: `${uploaded.length} file(s) uploaded. Types: ${uploaded.map((u) => u.mimeType).join(", ")}`,
          txHash: `UPLOAD-${uploadType}-${Date.now()}`,
          poolId: metadata.poolId ? metadata.poolId : undefined,
          ledgerId: user?.ledgerId,
          visibleToPublic: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      files: uploaded,
      count: uploaded.length,
      message: `${uploaded.length} file(s) uploaded successfully.`,
    });
  } catch (error) {
    return handleError(error);
  }
}