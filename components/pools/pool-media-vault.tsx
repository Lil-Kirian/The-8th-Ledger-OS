"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Play, X, FileText, Globe, Video } from "lucide-react";

interface PoolMediaVaultProps {
  images?: string | null;
  videos?: string | null;
  tour360Url?: string | null;
  documents?: string | null;
}

export function PoolMediaVault({ images, videos, tour360Url, documents }: PoolMediaVaultProps) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const imageList: string[] = images ? JSON.parse(images) : [];
  const videoList: Array<{ url: string; thumbnail?: string; type?: string }> = videos ? JSON.parse(videos) : [];
  const docList: Array<{ name: string; url: string; type?: string; category?: string }> = documents ? JSON.parse(documents) : [];

  const allMedia = [
    ...imageList.map((url) => ({ type: "image" as const, url })),
    ...videoList.map((v) => ({ type: "video" as const, url: v.url, thumbnail: v.thumbnail })),
  ];

  return (
    <div className="space-y-4">
      {allMedia.length > 0 && (
        <Card className="p-5 border-white/5 bg-[#0a0a0a]">
          <h3 className="text-sm font-semibold text-white mb-4">Media Vault</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {allMedia.map((media, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLightbox(media.url)}
                className="relative aspect-square rounded-lg overflow-hidden border border-white/5 cursor-pointer group bg-white/[0.02]"
              >
                {media.type === "image" ? (
                  <img src={media.url} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <>
                    {media.thumbnail ? (
                      <img src={media.thumbnail} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Video className="h-8 w-8 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {tour360Url && (
        <Card className="p-5 border-white/5 bg-[#0a0a0a]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            360° Tour
          </h3>
          <div className="aspect-video rounded-lg overflow-hidden border border-white/5 bg-black">
            <iframe src={tour360Url} className="w-full h-full" allowFullScreen />
          </div>
        </Card>
      )}

      {docList.length > 0 && (
        <Card className="p-5 border-white/5 bg-[#0a0a0a]">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Document Vault
          </h3>
          <div className="space-y-2">
            {docList.map((doc, i) => (
              <a
                key={i}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-cyan-500/20 transition-colors"
              >
                <FileText className="h-4 w-4 text-white/20" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white/60 truncate">{doc.name}</p>
                  <p className="text-[10px] text-white/20 uppercase">{doc.category || "Document"}</p>
                </div>
              </a>
            ))}
          </div>
        </Card>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white/60 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={lightbox} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}