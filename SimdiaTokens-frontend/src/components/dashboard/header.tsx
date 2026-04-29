"use client";

import { motion } from "framer-motion";
import { Shield, Activity } from "lucide-react";

export function DashboardHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 glass-strong border-b border-white/5"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Shield className="h-5 w-5 text-primary" />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0a0f]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                SimdiaTokens
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Token Management Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">System Online</span>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
