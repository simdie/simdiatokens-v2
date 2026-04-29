"use client";

import { cn } from "@/lib/utils";

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <SkeletonPulse className={className} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-border bg-card p-4 space-y-3", className)}>
      <SkeletonPulse className="h-4 w-1/3" />
      <SkeletonPulse className="h-8 w-2/3" />
      <SkeletonPulse className="h-3 w-full" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonPulse
          key={i}
          className={cn("h-4", i === 0 ? "w-12" : i === columns - 1 ? "w-20" : "flex-1")}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-4 py-3 px-4 border-b border-border bg-muted/30">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse
            key={i}
            className={cn("h-4", i === 0 ? "w-12" : i === columns - 1 ? "w-20" : "flex-1")}
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} columns={columns} />
      ))}
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <StatsCardsSkeleton />
          <SkeletonTable rows={6} columns={5} />
        </div>
      </div>
    </div>
  );
}
