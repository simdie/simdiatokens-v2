"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchTokens } from "@/lib/api";
import { Token } from "@/types/token";

interface UseTokensReturn {
  tokens: Token[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useTokens(): UseTokensReturn {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTokens();
      setTokens(data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      setError(err.message || "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      refresh();
    }
  }, [refresh]);

  return { tokens, loading, error, lastUpdated, refresh };
}
