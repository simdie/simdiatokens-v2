"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TokenTable } from "@/components/dashboard/token-table";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { fetchTokens } from "@/lib/api";
import { useCallback } from "react";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export default function TokensPage() {
  const {
    data: tokens = [],
    isLoading: loading,
    dataUpdatedAt,
    refetch,
  } = useQuery({
    queryKey: ["tokens"],
    queryFn: fetchTokens,
    refetchInterval: 15_000,
    retry: 2,
  });

  const loadTokens = useCallback(() => {
    refetch();
  }, [refetch]);

  useKeyboardShortcuts({
    "ctrl+r": loadTokens,
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DashboardTopBar title="Tokens" subtitle="Browse and manage all harvested tokens" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <TokenTable
              tokens={tokens}
              loading={loading}
              onRefresh={loadTokens}
              lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
            />
          </motion.div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/50">
              <kbd className="px-1 py-0.5 rounded bg-secondary/40 text-[9px] font-mono">Ctrl+R</kbd> Refresh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
