"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";

/* ============================================================
   TYPES — 8th Ledger Sovereign Stream
   ============================================================ */
export type StreamPostType = "PROPOSAL" | "REPORT" | "APPEAL" | "8TH_LEDGER_UPDATE";

export interface StreamPost {
  id: string;
  hallId: string;
  type: StreamPostType;
  title: string;
  content: string;
  authorId: string;
  author: {
    ledgerId: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  proposalId: string | null;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  isSystem?: boolean;
}

export interface StreamReply {
  id: string;
  postId: string;
  content: string;
  author: {
    ledgerId: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  createdAt: string;
}

export interface CreateStreamPostInput {
  type: StreamPostType;
  title: string;
  content: string;
  proposalId?: string;
}

export interface CreateStreamReplyInput {
  postId: string;
  content: string;
}

interface SendPostResponse {
  success: boolean;
  post?: StreamPost;
  error?: string;
}

interface SendReplyResponse {
  success: boolean;
  reply?: StreamReply;
  error?: string;
}

/* ============================================================
   FETCHER
   ============================================================ */
const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
};

/* ============================================================
   CONFIG
   ============================================================ */
const SSE_RETRY_MAX = 3;
const SSE_RETRY_BASE_MS = 2000;
const POLL_INTERVAL_MS = 5000;

/* ============================================================
   HELPERS
   ============================================================ */
function enrichPost(raw: Record<string, unknown>): StreamPost {
  const authorRaw = raw.author as Record<string, unknown> | undefined;

  return {
    id: String(raw.id),
    hallId: String(raw.hallId || raw.hall_id),
    type: String(raw.type || "PROPOSAL") as StreamPostType,
    title: String(raw.title || ""),
    content: String(raw.content || ""),
    authorId: String(raw.authorId || raw.author_id || ""),
    author: authorRaw
      ? {
          ledgerId: String(authorRaw.ledgerId || ""),
          displayName: String(
            authorRaw.displayName || authorRaw.display_name || "",
          ),
          avatarUrl: (authorRaw.avatarUrl || authorRaw.avatar_url) as
            | string
            | null,
        }
      : null,
    proposalId:
      (raw.proposalId as string) || (raw.proposal_id as string) || null,
    replyCount: Number(raw.replyCount || raw.reply_count || 0),
    createdAt: String(
      raw.createdAt || raw.created_at || new Date().toISOString(),
    ),
    updatedAt: String(
      raw.updatedAt || raw.updated_at || new Date().toISOString(),
    ),
    isSystem: Boolean(raw.isSystem || raw.is_system || false),
  };
}

function enrichReply(raw: Record<string, unknown>): StreamReply {
  const authorRaw = raw.author as Record<string, unknown> | undefined;

  return {
    id: String(raw.id),
    postId: String(raw.postId || raw.post_id),
    content: String(raw.content || ""),
    author: authorRaw
      ? {
          ledgerId: String(authorRaw.ledgerId || ""),
          displayName: String(
            authorRaw.displayName || authorRaw.display_name || "",
          ),
          avatarUrl: (authorRaw.avatarUrl || authorRaw.avatar_url) as
            | string
            | null,
        }
      : null,
    createdAt: String(
      raw.createdAt || raw.created_at || new Date().toISOString(),
    ),
  };
}

/* ============================================================
   HOOK: useSovereignStream
   ============================================================ */
export function useSovereignStream(hallId: string | null | undefined) {
  const [posts, setPosts] = useState<StreamPost[]>([]);
  const [replies, setReplies] = useState<Map<string, StreamReply[]>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"sse" | "polling" | "idle">("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const sseRetries = useRef(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingIds = useRef<Set<string>>(new Set());
  const postMapRef = useRef<Map<string, StreamPost>>(new Map());

  // ── Initial history fetch via SWR ──
  const {
    data: historyData,
    error: historyError,
    isLoading,
    mutate,
  } = useSWR(
    hallId ? `/api/halls/${hallId}/stream?page=1&limit=100` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  // Seed posts from SWR initial load
  useEffect(() => {
    if (historyData?.posts && Array.isArray(historyData.posts)) {
      const incoming: StreamPost[] = historyData.posts.map(enrichPost);
      const map = new Map<string, StreamPost>();
      incoming.forEach((p) => map.set(p.id, p));
      postMapRef.current = map;
      setPosts(
        Array.from(map.values()).sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      );
    }
  }, [historyData]);

  // ── Helper: merge new posts immutably ──
  const mergePosts = useCallback((incoming: StreamPost[]) => {
    const map = new Map(postMapRef.current);
    let changed = false;

    for (const p of incoming) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
        changed = true;
      }
    }

    if (!changed) return;

    postMapRef.current = map;
    setPosts(
      Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    );
  }, []);

  // ── SSE Setup ──
  useEffect(() => {
    if (!hallId) return;

    const connectSSE = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const url = `/api/halls/${hallId}/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setIsConnected(true);
        setConnectionMode("sse");
        sseRetries.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "heartbeat") return;

          if (payload.posts && Array.isArray(payload.posts)) {
            mergePosts(payload.posts.map(enrichPost));
          } else if (payload.post) {
            mergePosts([enrichPost(payload.post as Record<string, unknown>)]);
          }

          if (payload.replies && Array.isArray(payload.replies)) {
            const postId = String(payload.postId || payload.post_id);
            setReplies((prev) => {
              const next = new Map(prev);
              const existing = next.get(postId) || [];
              const incoming = payload.replies.map(enrichReply);
              const merged = [...existing, ...incoming.filter((r: StreamReply) => !existing.some((e) => e.id === r.id))];
              next.set(postId, merged);
              return next;
            });
          }
        } catch {
          // Ignore malformed SSE frames
        }
      };

      es.onerror = () => {
        setIsConnected(false);
        es.close();
        eventSourceRef.current = null;

        sseRetries.current += 1;
        if (sseRetries.current >= SSE_RETRY_MAX) {
          setConnectionMode("polling");
          startPolling();
        } else {
          const delay = SSE_RETRY_BASE_MS * Math.pow(2, sseRetries.current - 1);
          setTimeout(connectSSE, Math.min(delay, 30000));
        }
      };
    };

    const startPolling = () => {
      if (pollTimerRef.current) return;

      const poll = async () => {
        try {
          const res = await fetch(`/api/halls/${hallId}/stream?page=1&limit=50`, {
            credentials: "include",
          });
          if (!res.ok) return;
          const json = await res.json();
          if (json.success && json.posts) {
            mergePosts(json.posts.map(enrichPost));
          }
        } catch {
          // Silent fail on poll error
        }
      };

      poll();
      pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS);
      setConnectionMode("polling");
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      setIsConnected(false);
      setConnectionMode("idle");
    };
  }, [hallId, mergePosts]);

  // ── Create post ──
  const createPost = useCallback(
    async (input: CreateStreamPostInput): Promise<boolean> => {
      if (!hallId || !input.title.trim() || !input.content.trim()) return false;

      setSendError(null);

      const tempId = `temp-${Date.now()}`;
      const optimistic: StreamPost = {
        id: tempId,
        hallId,
        type: input.type,
        title: input.title.trim(),
        content: input.content.trim(),
        authorId: "",
        author: null,
        proposalId: input.proposalId || null,
        replyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      pendingIds.current.add(tempId);
      mergePosts([optimistic]);

      try {
        const res = await fetch(`/api/halls/${hallId}/stream`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(input),
        });

        const json: SendPostResponse = await res.json();

        if (!res.ok || !json.success) {
          const map = new Map(postMapRef.current);
          map.delete(tempId);
          postMapRef.current = map;
          setPosts(
            Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          );
          setSendError(json.error || "Failed to create post");
          return false;
        }

        if (json.post) {
          const map = new Map(postMapRef.current);
          map.delete(tempId);
          map.set(json.post.id, json.post);
          postMapRef.current = map;
          setPosts(
            Array.from(map.values()).sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            )
          );
        }

        pendingIds.current.delete(tempId);
        return true;
      } catch (err) {
        const map = new Map(postMapRef.current);
        map.delete(tempId);
        postMapRef.current = map;
        setPosts(
          Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        );
        setSendError(err instanceof Error ? err.message : "Network error");
        return false;
      }
    },
    [hallId, mergePosts]
  );

  // ── Reply to post ──
  const replyToPost = useCallback(
    async (input: CreateStreamReplyInput): Promise<boolean> => {
      if (!hallId || !input.content.trim()) return false;

      setSendError(null);

      try {
        const res = await fetch(`/api/halls/${hallId}/stream/${input.postId}/reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: input.content.trim() }),
        });

        const json: SendReplyResponse = await res.json();

        if (!res.ok || !json.success) {
          setSendError(json.error || "Failed to reply");
          return false;
        }

        if (json.reply) {
          setReplies((prev) => {
            const next = new Map(prev);
            const existing = next.get(input.postId) || [];
            next.set(input.postId, [...existing, json.reply!]);
            return next;
          });

          // Increment reply count on the post
          const map = new Map(postMapRef.current);
          const post = map.get(input.postId);
          if (post) {
            map.set(input.postId, { ...post, replyCount: post.replyCount + 1 });
            postMapRef.current = map;
            setPosts(
              Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              )
            );
          }
        }

        return true;
      } catch (err) {
        setSendError(err instanceof Error ? err.message : "Network error");
        return false;
      }
    },
    [hallId]
  );

  // ── Load replies for a post ──
  const loadReplies = useCallback(
    async (postId: string) => {
      if (!hallId) return;
      try {
        const res = await fetch(
          `/api/halls/${hallId}/stream/${postId}/reply`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success && json.replies) {
          setReplies((prev) => {
            const next = new Map(prev);
            next.set(postId, json.replies.map(enrichReply));
            return next;
          });
        }
      } catch {
        // Silent fail
      }
    },
    [hallId]
  );

  // ── Load more history ──
  const loadMore = useCallback(
    async (page: number, limit: number = 50) => {
      if (!hallId) return;
      try {
        const res = await fetch(
          `/api/halls/${hallId}/stream?page=${page}&limit=${limit}`,
          { credentials: "include" }
        );
        const json = await res.json();
        if (json.success && json.posts) {
          mergePosts(json.posts.map(enrichPost));
        }
      } catch {
        // Silent fail
      }
    },
    [hallId, mergePosts]
  );

  // ── Filter posts by type ──
  const postsByType = useCallback(
    (type: StreamPostType) => posts.filter((p) => p.type === type),
    [posts]
  );

  return {
    posts,
    replies,
    postsByType,
    isLoading,
    isConnected,
    connectionMode,
    isError: !!historyError,
    error: historyError?.message || sendError,
    createPost,
    replyToPost,
    loadReplies,
    loadMore,
    refresh: mutate,
  };
}