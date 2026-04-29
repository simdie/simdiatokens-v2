"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BECAnalysisReport, Severity, Complexity, Influence } from "@/types/token";
import {
  Shield,
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  Crosshair,
  Brain,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  AlertOctagon,
  Info,
  Clock,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Mail,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";

const severityConfig: Record<Severity, { color: string; bg: string; border: string; icon: React.ElementType; label: string }> = {
  critical: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", icon: AlertOctagon, label: "Critical" },
  high: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: AlertTriangle, label: "High" },
  medium: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", icon: Info, label: "Medium" },
  low: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: CheckCircle2, label: "Low" },
};

const complexityColors: Record<Complexity, string> = {
  high: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
};

const influenceColors: Record<Influence, string> = {
  high: "text-rose-400 border-rose-500/30 bg-rose-500/10",
  medium: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  low: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
};

function ConfidenceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden flex-shrink-0">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className={cn("h-full rounded-full", color)}
      />
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const rotation = (score / 100) * 180;
  const color = score >= 75 ? "#f43f5e" : score >= 50 ? "#f59e0b" : score >= 25 ? "#06b6d4" : "#10b981";

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg viewBox="0 0 100 60" className="w-full h-full -rotate-90">
        <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        <motion.path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(rotation / 180) * 125.6} 125.6`}
          initial={{ strokeDashoffset: 125.6 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-bold"
            style={{ color }}
          >
            {score}
          </motion.p>
          <p className="text-[9px] text-muted-foreground -mt-0.5">/100</p>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  colorClass,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ElementType;
  count: number;
  colorClass: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-secondary/10 transition-colors"
      >
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 text-left">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-[10px] text-muted-foreground">{count} items</p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface AnalysisReportProps {
  report: BECAnalysisReport | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  victimEmail?: string;
}

export function AnalysisReport({ report, loading, error, onRetry, victimEmail }: AnalysisReportProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="relative h-20 w-20 mx-auto">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-2 rounded-full border-2 border-transparent border-t-violet-400"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">AI Analysis in Progress</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing {victimEmail || "inbox"} for BEC opportunities...
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
            <span>Scanning emails</span>
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ...
            </motion.span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive/50" />
          <h3 className="text-sm font-semibold text-destructive">Analysis Failed</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-1.5 rounded-lg text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const sev = severityConfig[report.severity];
  const SevIcon = sev.icon;

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/5 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <RiskGauge score={report.riskScore} />
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border", sev.color, sev.bg, sev.border)}>
                  <SevIcon className="h-3 w-3" />
                  {sev.label} Risk
                </div>
                <Badge variant="outline" className="text-[10px] border-white/10">
                  <Mail className="h-3 w-3 mr-1" />
                  {report.emailCount} emails analyzed
                </Badge>
                <Badge variant="outline" className="text-[10px] border-white/10">
                  <Clock className="h-3 w-3 mr-1" />
                  {new Date(report.analyzedAt).toLocaleString()}
                </Badge>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{report.summary}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* BEC Opportunities */}
      <CollapsibleSection
        title="BEC Opportunities"
        icon={Crosshair}
        count={report.opportunities.length}
        colorClass="bg-rose-500/10 ring-1 ring-rose-500/20"
        defaultOpen
      >
        {report.opportunities.map((opp, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-4 p-3 rounded-xl bg-secondary/20 border border-white/5"
          >
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1", sev.bg)}>
              <Crosshair className="h-4 w-4 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-foreground">{opp.type}</h4>
                <ConfidenceBar value={opp.confidence} color="bg-rose-400" />
                <span className="text-[10px] text-rose-400 font-medium">{opp.confidence}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{opp.description}</p>
              {opp.involvedParties.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {opp.involvedParties.map((p) => (
                    <span key={p} className="text-[9px] text-muted-foreground bg-secondary/40 px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-1.5 pt-1">
                <ArrowRight className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-primary/80">{opp.suggestedAction}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </CollapsibleSection>

      {/* Financial Threads */}
      <CollapsibleSection
        title="Financial Conversation Threads"
        icon={DollarSign}
        count={report.financialThreads.length}
        colorClass="bg-emerald-500/10 ring-1 ring-emerald-500/20"
      >
        {report.financialThreads.map((thread, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 border border-white/5"
          >
            <DollarSign className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <h4 className="text-xs font-medium text-foreground truncate">{thread.subject}</h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                {thread.amount && (
                  <span className="font-semibold text-emerald-400">
                    {thread.currency || "$"}{thread.amount}
                  </span>
                )}
                <span>{new Date(thread.date).toLocaleDateString()}</span>
                <span className="text-muted-foreground/50">|</span>
                <span>{thread.parties.join(", ")}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {report.financialThreads.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No financial threads detected.</p>
        )}
      </CollapsibleSection>

      {/* Row: Executives + Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Executives */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
              <Users className="h-3.5 w-3.5 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Executives Identified</h3>
              <p className="text-[10px] text-muted-foreground">{report.executives.length} found</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {report.executives.map((exec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/20 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-violet-400">
                    {exec.name[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{exec.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{exec.title}</p>
                </div>
                <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full border", influenceColors[exec.influence])}>
                  {exec.influence.toUpperCase()}
                </span>
              </motion.div>
            ))}
            {report.executives.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No executives identified.</p>
            )}
          </div>
        </motion.div>

        {/* Deals & Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-white/5 overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Deals &amp; Invoices</h3>
              <p className="text-[10px] text-muted-foreground">{report.deals.length} ongoing</p>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {report.deals.map((deal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="p-2.5 rounded-lg bg-secondary/20 border border-white/5"
              >
                <h4 className="text-xs font-medium text-foreground truncate">{deal.subject}</h4>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-muted-foreground">
                  {deal.value && <span className="font-semibold text-cyan-400">{deal.value}</span>}
                  <span className="text-muted-foreground/40">•</span>
                  <span>{deal.stage}</span>
                  <span className="text-muted-foreground/40">•</span>
                  <span>{new Date(deal.date).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {deal.parties.map((p) => (
                    <span key={p} className="text-[9px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
            {report.deals.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No deals detected.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* High-Value Targets */}
      <CollapsibleSection
        title="High-Value Targets"
        icon={Target}
        count={report.highValueTargets.length}
        colorClass="bg-amber-500/10 ring-1 ring-amber-500/20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {report.highValueTargets.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-secondary/20 border border-white/5"
            >
              <Building2 className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono truncate">{t.email}</p>
                <p className="text-[10px] text-amber-400/80">{t.reason}</p>
              </div>
            </motion.div>
          ))}
        </div>
        {report.highValueTargets.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No high-value targets identified.</p>
        )}
      </CollapsibleSection>

      {/* Attack Angles */}
      <CollapsibleSection
        title="Suggested Attack Angles"
        icon={Zap}
        count={report.attackAngles.length}
        colorClass="bg-primary/10 ring-1 ring-primary/20"
        defaultOpen
      >
        {report.attackAngles.map((angle, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-xl bg-secondary/20 border border-white/5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-foreground">{angle.scenario}</h4>
                  <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full border", complexityColors[angle.complexity])}>
                    {angle.complexity.toUpperCase()} complexity
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div className="w-12 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${angle.successProbability}%` }}
                    transition={{ duration: 0.6, delay: i * 0.1 + 0.3 }}
                    className={cn("h-full rounded-full", angle.successProbability >= 70 ? "bg-emerald-400" : angle.successProbability >= 40 ? "bg-amber-400" : "bg-rose-400")}
                  />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{angle.successProbability}%</span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{angle.description}</p>
            {angle.prerequisites.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-foreground/70 uppercase tracking-wider">Prerequisites</p>
                <div className="flex flex-wrap gap-1">
                  {angle.prerequisites.map((p) => (
                    <span key={p} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </CollapsibleSection>
    </div>
  );
}
