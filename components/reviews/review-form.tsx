"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Star, Send, AlertTriangle } from "lucide-react";

interface ReviewFormProps {
  poolId: string;
  propertyName: string;
  verticalId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ poolId, propertyName, verticalId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setMessage("Select a star rating");
      return;
    }
    if (text.length < 10) {
      setMessage("Review must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch(`/api/pools/${poolId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text, propertyName, verticalId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage("Review submitted");
        setRating(0);
        setText("");
        onSuccess?.();
      } else {
        setMessage(data.error || "Failed to submit review");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/5 bg-surface-800 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Star className="h-4 w-4 text-amber-400" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">Leave a Review</span>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="rounded p-0.5 transition-colors"
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-white/20"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs text-white/30">{rating > 0 ? `${rating}/5` : "Tap to rate"}</span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 resize-none"
        placeholder="Describe your experience with this asset..."
      />

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-white/20">{text.length} characters</p>
        <Button type="submit" variant="amber" size="sm" disabled={submitting}>
          <Send className="h-3.5 w-3.5" />
          {submitting ? "Posting..." : "Post Review"}
        </Button>
      </div>

      {message && (
        <div className={`flex items-center gap-2 rounded-lg p-2 text-xs ${message.includes("submitted") ? "bg-emerald-500/10 text-emerald-400" : "bg-crimson/10 text-crimson"}`}>
          <AlertTriangle className="h-3 w-3" />
          {message}
        </div>
      )}
    </form>
  );
}