"use client";

import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import {
  Shield,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Brain,
  Mail,
  ArrowRight,
} from "lucide-react";
import { StoredAnalysis } from "@/types/token";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AnalysisCardProps {
  analysis: StoredAnalysis;
  index: number;
  onCreateRule: (analysis: StoredAnalysis, findingIndex: number) => void;
}

function RiskScore({ score }: { score: number }) {
  const color =
    score < 0.3
      ? "text-emerald-400"
      : score <= 0.7
      ? "text-amber-400"
      : "text-rose-400";
  const bg =
    score < 0.3
      ? "bg-emerald-500/10 border-emerald-500/20"
      : score <= 0.7
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-rose-500/10 border-rose-500/20";
  const Icon =
    score < 0.3 ? CheckCircle2 : score <= 0.7 ? AlertTriangle : AlertCircle;

  return (
    <div className={cn("rounded-xl border p-4 flex flex-col items-center justify-center min-w-[100px]", bg)}>
      <Icon className={cn("h-5 w-5 mb-1", color)} />
      <span className={cn("text-2xl font-bold", color)}>{(score * 100).toFixed(0)}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Score</span>
    </div>
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value > 0.8 ? "bg-rose-400" : value > 0.5 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    invoice: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    wire_transfer: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    travel: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    sensitive: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    other: "bg-muted/30 text-muted-foreground border-border",
  };
  return (
    <Badge variant="secondary" className={cn("text-[10px] capitalize", colors[category] || colors.other)}>
      {category.replace(/_/g, " ")}
    </Badge>
  );
}

export function AnalysisCard({ analysis, index, onCreateRule }: AnalysisCardProps) {
  const { report, token_email, created_at } = analysis;
  const score = report.overall_risk_score;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-xl border border-white/5 bg-secondary/10 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-start gap-4">
        <RiskScore score={score} />
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{token_email}</span>
            <span className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {format(new Date(created_at), "MMM d, yyyy 'at' h:mm a")} • {report.findings.length} findings
          </p>
        </div>
      </div>

      {/* Findings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Category
              </th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground w-[120px]">
                Confidence
              </th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Summary
              </th>
              <th className="text-left px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Action
              </th>
              <th className="px-5 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {report.findings.map((finding, i) => (
              <tr key={i} className="hover:bg-secondary/20 transition-colors">
                <td className="px-5 py-3">
                  <CategoryBadge category={finding.category} />
                </td>
                <td className="px-5 py-3">
                  <ConfidenceBar value={finding.confidence} />
                </td>
                <td className="px-5 py-3">
                  <p className="text-xs text-foreground/80">{finding.summary}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[11px] text-muted-foreground capitalize">
                    {finding.recommended_action.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {finding.recommended_action === "create_rule" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                      onClick={() => onCreateRule(analysis, i)}
                    >
                      <Shield className="h-3.5 w-3.5" />
                      Create Rule
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
