import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, requireAdmin } from "@/lib/auth";
import { logSecurityAudit } from "@/lib/audit";
import { writeFile } from "fs/promises";
import { mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

// GET /api/halls/[id]/vault
// Returns all vault documents for the hall
// Owners and admins only
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: hallId } = await params;
    const user = await getSessionUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership or admin
    const ownership = await prisma.ownership.findFirst({
      where: { hallId, userId: user.id, status: "active" },
      select: { ownershipPercent: true },
    });

    const isAdmin = user.role === "admin";
    if (!ownership && !isAdmin) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const hall = await prisma.hall.findUnique({
      where: { id: hallId },
      select: {
        id: true,
        name: true,
        hallClass: true,
        deedUrl: true,
        insuranceCertificateUrl: true,
        spvAgreementUrl: true,
        constitutionUrl: true,
        pool: { select: { documents: true } },
      },
    });

    if (!hall) {
      return NextResponse.json({ error: "Hall not found" }, { status: 404 });
    }

    // Parse additional documents from pool.documents JSON if present
    let extraDocs: Array<{
      type: string;
      url: string;
      uploadedAt: string;
      fileSize?: string;
    }> = [];
    if (hall.pool?.documents) {
      try {
        const parsed = JSON.parse(hall.pool.documents);
        if (Array.isArray(parsed)) extraDocs = parsed;
      } catch {
        // ignore parse errors
      }
    }

    // Build canonical document list from Hall fields
    const documents: Array<{
      id: string;
      type: string;
      title: string;
      url: string;
      uploadedAt: string;
      status: "present" | "missing" | "pending" | "expired";
      fileSize?: string;
      description?: string;
    }> = [];

    const docFieldMap: Record<
      string,
      { field: keyof typeof hall; title: string; required: boolean }
    > = {
      deed: { field: "deedUrl", title: "Property Deed", required: true },
      insurance_certificate: {
        field: "insuranceCertificateUrl",
        title: "Insurance Certificate",
        required: true,
      },
      spv_agreement: { field: "spvAgreementUrl", title: "SPV Agreement", required: true },
      constitution: { field: "constitutionUrl", title: "Hall Constitution", required: true },
    };

    for (const [type, cfg] of Object.entries(docFieldMap)) {
      const url = hall[cfg.field] as string | null;
      if (url) {
        documents.push({
          id: `vault-${hallId}-${type}`,
          type,
          title: cfg.title,
          url,
          uploadedAt: hall.id ? new Date().toISOString() : "", // fallback
          status: "present",
        });
      } else {
        documents.push({
          id: `vault-${hallId}-${type}-missing`,
          type,
          title: cfg.title,
          url: "",
          uploadedAt: "",
          status: cfg.required ? "missing" : "pending",
        });
      }
    }

    // Merge extra docs (tax_records, audit_report, etc.)
    for (const extra of extraDocs) {
      const existing = documents.find((d) => d.type === extra.type);
      if (existing) {
        existing.url = extra.url;
        existing.status = "present";
        existing.uploadedAt = extra.uploadedAt;
        existing.fileSize = extra.fileSize;
      } else {
        documents.push({
          id: `vault-${hallId}-${extra.type}`,
          type: extra.type,
          title: extra.type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
          url: extra.url,
          uploadedAt: extra.uploadedAt,
          status: "present",
          fileSize: extra.fileSize,
        });
      }
    }

    return NextResponse.json({
      hallId: hall.id,
      hallName: hall.name,
      hallClass: hall.hallClass,
      documents,
      isOwner: !!ownership,
      ownershipPercent: ownership?.ownershipPercent ?? 0,
      isAdmin,
    });
  } catch (err) {
    console.error("[VAULT] GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/halls/[id]/vault
// Upload a new document to the vault. Admin only.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id: hallId } = await params;
    const admin = await requireAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    const validTypes = [
      "deed",
      "insurance_certificate",
      "spv_agreement",
      "constitution",
      "tax_records",
      "audit_report",
    ];

    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid document type", validTypes },
        { status: 400 }
      );
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF, PNG, JPG, DOC allowed." },
        { status: 400 }
      );
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 20MB." }, { status: 400 });
    }

    // Save to disk: public/uploads/vault/{hallId}/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "vault", hallId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext = path.extname(file.name) || ".pdf";
    const filename = `${type}_${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/vault/${hallId}/${filename}`;

    // Update Hall field
    const updateData: Record<string, string> = {};
    const fieldMap: Record<string, keyof typeof updateData> = {
      deed: "deedUrl",
      insurance_certificate: "insuranceCertificateUrl",
      spv_agreement: "spvAgreementUrl",
      constitution: "constitutionUrl",
    };

    if (fieldMap[type]) {
      await prisma.hall.update({
        where: { id: hallId },
        data: { [fieldMap[type]]: fileUrl },
      });
    } else {
      // For extra docs, store in pool.documents JSON array
      const hall = await prisma.hall.findUnique({
        where: { id: hallId },
        select: { poolId: true },
      });
      if (hall?.poolId) {
        const pool = await prisma.pool.findUnique({
          where: { id: hall.poolId },
          select: { documents: true },
        });
        let docs: Array<{
          type: string;
          url: string;
          uploadedAt: string;
          fileSize: string;
        }> = [];
        if (pool?.documents) {
          try {
            docs = JSON.parse(pool.documents);
            if (!Array.isArray(docs)) docs = [];
          } catch {
            docs = [];
          }
        }
        docs = docs.filter((d) => d.type !== type);
        docs.push({
          type,
          url: fileUrl,
          uploadedAt: new Date().toISOString(),
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        });
        await prisma.pool.update({
          where: { id: hall.poolId },
          data: { documents: JSON.stringify(docs) },
        });
      }
    }

    await logSecurityAudit({
      action: "VAULT_DOCUMENT_UPLOADED",
      actorId: admin.ledgerId,
      targetId: hallId,
      metadata: { type, filename, size: file.size },
      ip: req.headers.get("x-forwarded-for") || "unknown",
    });

    return NextResponse.json({
      message: "Document uploaded to vault",
      document: {
        type,
        url: fileUrl,
        uploadedAt: new Date().toISOString(),
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      },
    });
  } catch (err) {
    console.error("[VAULT] POST error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}