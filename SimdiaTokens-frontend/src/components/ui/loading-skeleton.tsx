"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-md bg-secondary/30", className)}>
      <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
    </div>
  );
}

export function TokenTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-0">
      {Array.from({ length: rows }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-4 px-4 py-3 border-b border-white/5"
        >
          <Shimmer className="h-4 w-4 rounded" />
          <div className="flex items-center gap-2 flex-1">
            <Shimmer className="h-2 w-2 rounded-full" />
            <Shimmer className="h-4 w-32 rounded" />
          </div>
          <Shimmer className="h-4 w-28 rounded hidden sm:block" />
          <Shimmer className="h-4 w-40 rounded hidden lg:block" />
          <Shimmer className="h-4 w-24 rounded hidden md:block" />
          <Shimmer className="h-5 w-16 rounded-full hidden sm:block" />
          <div className="flex items-center gap-1">
            <Shimmer className="h-7 w-16 rounded-lg" />
            <Shimmer className="h-7 w-16 rounded-lg" />
            <Shimmer className="h-7 w-16 rounded-lg" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function EmailListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/[0.03]">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="px-4 py-3 space-y-2"
        >
          <div className="flex items-center gap-2.5">
            <Shimmer className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Shimmer className="h-3 w-3/5 rounded" />
              <Shimmer className="h-3 w-2/5 rounded" />
            </div>
            <Shimmer className="h-3 w-10 rounded" />
          </div>
          <Shimmer className="h-2 w-full rounded" />
        </motion.div>
      ))}
    </div>
  );
}

export function EmailDetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Shimmer className="h-9 w-9 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Shimmer className="h-4 w-3/4 rounded" />
          <Shimmer className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-11/12 rounded" />
      <Shimmer className="h-3 w-4/5 rounded" />
      <Shimmer className="h-20 w-full rounded-lg mt-4" />
      <Shimmer className="h-3 w-full rounded" />
      <Shimmer className="h-3 w-5/6 rounded" />
      <Shimmer className="h-3 w-3/4 rounded" />
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <Shimmer className="h-12 w-12 rounded-xl" />
        <div className="space-y-1.5">
          <Shimmer className="h-5 w-40 rounded" />
          <Shimmer className="h-3 w-56 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Shimmer className="h-2.5 w-16 rounded" />
            <Shimmer className="h-3.5 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-white/[0.03]">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3">
          <Shimmer className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1">
            <Shimmer className="h-3 w-36 rounded" />
            <Shimmer className="h-2.5 w-24 rounded" />
          </div>
          <Shimmer className="h-4 w-4 rounded" />
        </div>
      ))}
    </div>
  );
}

export function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="p-6 glass rounded-2xl border border-white/5">
        <div className="flex gap-6 items-center">
          <Shimmer className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-5 w-32 rounded-full" />
            <Shimmer className="h-5 w-full rounded" />
            <Shimmer className="h-5 w-4/5 rounded" />
          </div>
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="p-5 glass rounded-2xl border border-white/5 space-y-3">
          <Shimmer className="h-5 w-48 rounded" />
          <Shimmer className="h-3 w-full rounded" />
          <Shimmer className="h-3 w-3/4 rounded" />
          <Shimmer className="h-16 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <Shimmer className="h-3 w-20 rounded" />
          <Shimmer className="h-8 w-12 rounded mt-3" />
          <Shimmer className="h-3 w-16 rounded mt-2" />
        </motion.div>
      ))}
    </div>
  );
}
