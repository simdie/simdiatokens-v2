"use client";

import { motion } from "framer-motion";
import { Users, KeyRound, AlertTriangle, CheckCircle2, TrendingUp, PieChart } from "lucide-react";
import { Token } from "@/types/token";
import { formatDistanceToNow } from "date-fns";

interface StatsCardsProps {
  tokens: Token[];
  isLoading: boolean;
}

export function StatsCards({ tokens, isLoading }: StatsCardsProps) {
  const activeTokens = tokens.filter((t) => new Date(t.expires_at) > new Date());
  const expiredTokens = tokens.filter((t) => new Date(t.expires_at) <= new Date());
  const uniqueSources = new Set(tokens.map((t) => t.source)).size;
  const totalTokens = tokens.length;
  const activePercentage = totalTokens > 0 ? Math.round((activeTokens.length / totalTokens) * 100) : 0;

  const stats = [
    {
      label: "Total Tokens",
      value: totalTokens,
      icon: KeyRound,
      color: "text-primary",
      bg: "bg-primary/10",
      ring: "ring-primary/20",
      trend: activePercentage,
      trendLabel: "Active Rate",
      trendIcon: TrendingUp,
    },
    {
      label: "Active",
      value: activeTokens.length,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      ring: "ring-emerald-400/20",
    },
    {
      label: "Expired",
      value: expiredTokens.length,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      ring: "ring-rose-400/20",
    },
    {
      label: "Sources",
      value: uniqueSources,
      icon: Users,
      color: "text-violet-400",
      bg: "bg-violet-400/10",
      ring: "ring-violet-400/20",
      trend: tokens.length > 0 ? Math.round((uniqueSources / totalTokens) * 100) : 0,
      trendLabel: "Avg per Source",
      trendIcon: PieChart,
    },
  ];

  if (isLoading) {
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
            <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
            <div className="mt-3 h-8 w-12 animate-pulse rounded bg-white/5" />
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08, duration: 0.4 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
          className="glass rounded-2xl p-5 glow-cyan transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              {stat.trend !== undefined && (
                <div className="mt-2 flex items-center gap-2 text-[11px]">
                  <stat.trendIcon className="h-3 w-3" />
                  <span className="font-medium">{stat.trendLabel}: {stat.trend}%</span>
                </div>
              )}
            </div>
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ring-1 ${stat.ring}`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </div>
          {stat.label === "Total Tokens" && tokens.length > 0 && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              Last capture{" "}
              {formatDistanceToNow(
                new Date(
                  Math.max(...tokens.map((t) => new Date(t.created_at || t.expires_at).getTime()))
                ),
                { addSuffix: true }
              )}
            </p>
          )}
        </motion.div>
      ))}
    </div>
  );
}
