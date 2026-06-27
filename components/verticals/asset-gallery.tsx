"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Image,
  Video,
  Globe,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  ExternalLink,
  Maximize2,
  Minimize2,
  Play,
  Volume2,
  VolumeX,
  RotateCcw,
  Link2,
  Camera,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MediaItem =
  | { type: "image"; url: string; caption?: string; alt?: string }
  | { type: "video"; url: string; caption?: string; provider?: "youtube" | "vimeo" | "direct"; thumbnail?: string }
  | { type: "tour"; url: string; caption?: string; provider?: "matterport" | "kuula" | "custom" }
  | { type: "link"; url: string; title: string; description?: string; favicon?: string };

interface AssetGalleryProps {
  items: MediaItem[];
  assetName: string;
  hallId: string;
  vertical: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

export default function AssetGallery({
  items,
  assetName,
  hallId,
  vertical,
  autoPlay = false,
  autoPlayInterval = 5000,
}: AssetGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % totalItems);
    setImageLoaded(false);
  }, [totalItems]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + totalItems) % totalItems);
    setImageLoaded(false);
  }, [totalItems]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setImageLoaded(false);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowRight") setLightboxIndex((i) => (i + 1) % totalItems);
      if (e.key === "ArrowLeft") setLightboxIndex((i) => (i - 1 + totalItems) % totalItems);
      if (e.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, totalItems]);

  // Autoplay
  useEffect(() => {
    if (!autoPlay || lightboxOpen || currentItem?.type === "video") return;
    const interval = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, lightboxOpen, currentItem, goNext]);

  const renderMedia = (item: MediaItem, index: number, isLightbox = false) => {
    const sizeClass = isLightbox ? "max-w-full max-h-[85vh]" : "w-full h-full";

    if (item.type === "image") {
      return (
        <div className={cn("relative flex items-center justify-center", sizeClass)}>
          {!imageLoaded && !isLightbox && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-slate-400 rounded-full animate-spin" />
            </div>
          )}
          <img
            src={item.url}
            alt={item.alt || item.caption || assetName}
            className={cn(
              "object-contain transition-opacity duration-300",
              sizeClass,
              imageLoaded || isLightbox ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setImageLoaded(true)}
            onClick={() => !isLightbox && openLightbox(index)}
          />
          {item.caption && isLightbox && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <span className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-xs text-white">
                {item.caption}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "video") {
      const ytId = item.provider === "youtube" ? getYouTubeId(item.url) : null;
      const vimeoId = item.provider === "vimeo" ? getVimeoId(item.url) : null;

      if (ytId) {
        return (
          <div className={cn("relative aspect-video", sizeClass)}>
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=${isLightbox ? 1 : 0}&mute=${isMuted ? 1 : 0}`}
              className="w-full h-full rounded-xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      if (vimeoId) {
        return (
          <div className={cn("relative aspect-video", sizeClass)}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}?autoplay=${isLightbox ? 1 : 0}&muted=${isMuted ? 1 : 0}`}
              className="w-full h-full rounded-xl"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <div className={cn("relative aspect-video bg-slate-900 rounded-xl overflow-hidden", sizeClass)}>
          <video
            src={item.url}
            className="w-full h-full"
            controls={isLightbox}
            muted={isMuted}
            autoPlay={isLightbox}
            loop
            playsInline
            poster={item.thumbnail}
          />
          {!isLightbox && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
              <button
                onClick={() => openLightbox(index)}
                className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <Play size={24} className="ml-1" />
              </button>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "tour") {
      return (
        <div className={cn("relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden", sizeClass)}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-600">
              <Layers size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">360° Tour</p>
              <p className="text-xs text-slate-700 mt-1">{item.provider || "Virtual Tour"}</p>
            </div>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 transition-colors group"
          >
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white mb-2 group-hover:bg-white/30 transition-all">
                <RotateCcw size={24} />
              </div>
              <span className="text-xs text-white font-medium">Launch 360° Tour</span>
            </div>
          </a>
          {item.caption && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] text-white">
                {item.caption}
              </span>
            </div>
          )}
        </div>
      );
    }

    if (item.type === "link") {
      return (
        <div className={cn("relative p-5 rounded-xl bg-slate-800/20 border border-slate-700/30 flex items-center gap-4", sizeClass)}>
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center shrink-0">
            {item.favicon ? (
              <img src={item.favicon} alt="" className="w-6 h-6 rounded" />
            ) : (
              <Link2 size={20} className="text-slate-500" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-slate-200 truncate">{item.title}</div>
            {item.description && (
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.description}</p>
            )}
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-600">
              <Globe size={10} />
              <span className="truncate">{item.url}</span>
            </div>
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      );
    }

    return null;
  };

  if (items.length === 0) {
    return (
      <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl p-10 text-center text-slate-600">
        <Camera size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No media available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d1a] border border-slate-800/60 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-center">
            <Layers size={18} className="text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Asset Gallery</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {totalItems} item{totalItems !== 1 ? "s" : ""} • {vertical}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={cn(
              "p-2 rounded-lg border transition-all",
              showThumbnails ? "bg-slate-800/60 border-slate-600/40 text-slate-200" : "bg-slate-800/20 border-slate-700/30 text-slate-500"
            )}
          >
            <Image size={16} />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border border-slate-700/30 bg-slate-800/20 text-slate-500 hover:text-slate-200 transition-all"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className={cn("p-5 space-y-4", isFullscreen && "fixed inset-0 z-50 bg-[#0a0a14] p-4")}>
        {/* Main Viewer */}
        <div className="relative group">
          <div className={cn(
            "rounded-xl overflow-hidden bg-slate-900/50 border border-slate-700/30",
            currentItem.type === "image" ? "aspect-[16/10]" : "aspect-video"
          )}>
            {renderMedia(currentItem, currentIndex)}
          </div>

          {/* Navigation Arrows */}
          {totalItems > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Top-right actions */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {currentItem.type === "image" && (
              <button
                onClick={() => openLightbox(currentIndex)}
                className="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all"
              >
                <ZoomIn size={16} />
              </button>
            )}
            {currentItem.type === "video" && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-white hover:bg-black/60 transition-all"
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            <div className="px-2.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 text-[10px] text-white font-mono">
              {currentIndex + 1} / {totalItems}
            </div>
          </div>

          {/* Caption overlay */}
          {currentItem.caption && currentItem.type !== "tour" && currentItem.type !== "link" && (
            <div className="absolute bottom-3 left-3 right-3">
              <span className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white">
                {currentItem.caption}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {showThumbnails && totalItems > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin" }}>
            {items.map((item, i) => {
              const isActive = i === currentIndex;
              let thumbUrl = "";
              let thumbIcon = <Image size={14} />;

              if (item.type === "image") {
                thumbUrl = item.url;
              } else if (item.type === "video") {
                thumbUrl = item.thumbnail || "";
                thumbIcon = <Video size={14} />;
              } else if (item.type === "tour") {
                thumbIcon = <RotateCcw size={14} />;
              } else if (item.type === "link") {
                thumbIcon = <Link2 size={14} />;
              }

              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={cn(
                    "relative shrink-0 w-20 h-14 rounded-lg border overflow-hidden transition-all",
                    isActive
                      ? "border-emerald-500/60 ring-2 ring-emerald-500/20"
                      : "border-slate-700/30 hover:border-slate-600/40"
                  )}
                >
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800/40 flex items-center justify-center text-slate-500">
                      {thumbIcon}
                    </div>
                  )}
                  {isActive && (
                    <div className="absolute inset-0 bg-emerald-500/10" />
                  )}
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                        <Play size={8} className="text-white ml-0.5" />
                      </div>
                    </div>
                  )}
                  {item.type === "tour" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                        <RotateCcw size={8} className="text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* External Links Row */}
        {items.some((i) => i.type === "link") && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">External Resources</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.filter((i): i is MediaItem & { type: "link" } => i.type === "link").map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-slate-600/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                    <Globe size={14} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">{item.title}</div>
                    <div className="text-[10px] text-slate-600 truncate">{item.url}</div>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 360 Tours Row */}
        {items.some((i) => i.type === "tour") && (
          <div className="space-y-2">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Virtual Tours</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.filter((i): i is MediaItem & { type: "tour" } => i.type === "tour").map((item, i) => (
                <a
                  key={i}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/20 border border-slate-700/30 hover:border-slate-600/40 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800/60 flex items-center justify-center shrink-0">
                    <RotateCcw size={14} className="text-slate-400 group-hover:text-slate-200 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-200 truncate">{item.caption || "360° Tour"}</div>
                    <div className="text-[10px] text-slate-600">{item.provider || "Virtual Tour"}</div>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
            onClick={() => setLightboxOpen(false)}
          >
            <X size={20} />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i - 1 + totalItems) % totalItems);
            }}
          >
            <ChevronLeft size={24} />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex((i) => (i + 1) % totalItems);
            }}
          >
            <ChevronRight size={24} />
          </button>

          <div className="max-w-5xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {renderMedia(items[lightboxIndex], lightboxIndex, true)}
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs text-slate-300 font-mono">
              {lightboxIndex + 1} / {totalItems}
            </span>
            {items[lightboxIndex].caption && (
              <span className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-xs text-slate-300">
                {items[lightboxIndex].caption}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}