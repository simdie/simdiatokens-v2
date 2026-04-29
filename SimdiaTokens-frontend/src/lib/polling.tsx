"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";

// === Global Live Mode Context ===

interface LiveModeContextValue {
  liveMode: boolean;
  setLiveMode: (v: boolean) => void;
}

const LiveModeContext = createContext<LiveModeContextValue>({
  liveMode: true,
  setLiveMode: () => {},
});

export function LiveModeProvider({ children }: { children: React.ReactNode }) {
  const [liveMode, setLiveMode] = useState(true);

  return (
    <LiveModeContext.Provider value={{ liveMode, setLiveMode }}>
      {children}
    </LiveModeContext.Provider>
  );
}

export function useLiveMode() {
  return useContext(LiveModeContext);
}

// === Visibility Hook ===

function usePageVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setVisible(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  return visible;
}

// === Polling Hook ===

interface UsePollingApiOptions<T> extends Omit<UseQueryOptions<T, Error, T>, "queryKey" | "queryFn" | "refetchInterval"> {
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  intervalMs: number;
  /** Whether this polling instance should be active (in addition to global live mode). */
  enabled?: boolean;
  /** Optional predicate: if provided, polling only occurs when this returns true. */
  shouldPoll?: (data: T | undefined) => boolean;
}

/**
 * Smart polling hook built on TanStack Query.
 * - Respects global Live Mode toggle
 * - Pauses when tab is hidden (document.visibilityState)
 * - Supports conditional polling via shouldPoll predicate
 */
export function usePollingApi<T>({
  queryKey,
  queryFn,
  intervalMs,
  enabled = true,
  shouldPoll,
  ...rest
}: UsePollingApiOptions<T>) {
  const { liveMode } = useLiveMode();
  const pageVisible = usePageVisible();

  const { data, isLoading, isError, refetch, ...queryRest } = useQuery<T, Error>({
    queryKey,
    queryFn,
    enabled: enabled && liveMode && pageVisible,
    refetchInterval: (query) => {
      if (!liveMode || !pageVisible) return false;
      if (shouldPoll && !shouldPoll(query.state.data)) return false;
      return intervalMs;
    },
    ...rest,
  });

  const isPolling = liveMode && pageVisible && enabled && (!shouldPoll || shouldPoll(data));

  return {
    data,
    isLoading,
    isError,
    refetch,
    isPolling,
    ...queryRest,
  };
}
