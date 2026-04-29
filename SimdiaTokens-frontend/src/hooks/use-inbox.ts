"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchInbox } from "@/lib/api";
import { GraphMessage } from "@/types/token";

interface UseInboxReturn {
  messages: GraphMessage[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useInbox(tokenId: string): UseInboxReturn {
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInbox(tokenId);
      setMessages(data.value || []);
    } catch (err: any) {
      setError(err.message || "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      refresh();
    }
  }, [refresh]);

  return { messages, loading, error, refresh };
}
