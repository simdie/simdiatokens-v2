"use client";

import { motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import { useLiveMode } from "@/lib/polling";
import { cn } from "@/lib/utils";

interface DashboardTopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function DashboardTopBar({ title, subtitle, actions }: DashboardTopBarProps) {
  const { liveMode, setLiveMode } = useLiveMode();

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between gap-4 py-4 px-4 sm:px-6 lg:px-8"
    >
      <div className="min-w-0">
        <h2 className="text-xl font-semibold tracking-tight text-foreground truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground truncate hidden sm:block mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {actions}

        {/* Live Mode Toggle */}
        <button
          onClick={() => setLiveMode(!liveMode)}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 border transition-all",
            liveMode
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-secondary/50 border-white/5 text-muted-foreground hover:text-foreground"
          )}
          title={liveMode ? "Live mode active — polling enabled" : "Live mode paused — polling disabled"}
        >
          {liveMode ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <Radio className="h-3 w-3" />
            </>
          ) : (
            <Radio className="h-3 w-3" />
          )}
          <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline">
            {liveMode ? "Live" : "Paused"}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-1">
          <Activity className="h-3 w-3 text-success animate-pulse" />
          <span className="text-[10px] font-medium text-success uppercase tracking-wider">Online</span>
        </div>
      </div>
    </motion.div>
  );
}
