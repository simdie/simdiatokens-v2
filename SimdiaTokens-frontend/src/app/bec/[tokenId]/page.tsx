"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Token, BECScanReport } from "@/types/token";
import { fetchTokens, fetchBECScan } from "@/lib/api";
import { AlertCircle, ArrowLeft, ShieldAlert, Search, Loader2, FileText, Paperclip } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function RiskBadge({ score }: { score: number }) {
  if (score >= 70) {
    return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px]">High Risk</Badge>;
  }
  if (score >= 40) {
    return <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">Medium Risk</Badge>;
  }
  return <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Low Risk</Badge>;
}

function KeywordPill({ keyword }: { keyword: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
      {keyword}
    </span>
  );
}

export default function BECScanPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;
  const router = useRouter();

  const [token, setToken] = useState<Token | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [report, setReport] = useState<BECScanReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const mounted = useRef(false);

  const loadToken = useCallback(async () => {
    if (!tokenId) return;
    setTokenLoading(true);
    try {
      const data = await fetchTokens();
      const found = data?.find((t: Token) => t.id === tokenId) || null;
      setToken(found);
    } catch (err: any) {
      setTokenError(err.message || "Failed to load token");
    } finally {
      setTokenLoading(false);
    }
  }, [tokenId]);

  const runScan = useCallback(async () => {
    if (!tokenId) return;
    setReportLoading(true);
    setReport(null);
    try {
      const result = await fetchBECScan(tokenId);
      setReport(result);
    } catch (err: any) {
      toast.error(err.message || "BEC scan failed");
    } finally {
      setReportLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      loadToken();
    }
  }, [loadToken]);

  useEffect(() => {
    if (tokenId && token) runScan();
  }, [tokenId, token, runScan]);

  if (tokenLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
          <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-32 animate-pulse rounded-xl bg-white/5" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
          <button onClick={() => router.push("/")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive/80">{tokenError}</p>
            <Button variant="outline" size="sm" onClick={loadToken}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
          <button onClick={() => router.push("/")} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Search className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">Token not found</h3>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground truncate">
            BEC Scan: {token.email}
          </h2>
          <p className="text-[10px] text-muted-foreground truncate">
            Keyword-based Business Email Compromise detection
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={runScan}
            disabled={reportLoading}
            className="gap-1.5 border-white/10 bg-secondary/50 hover:bg-secondary"
          >
            {reportLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="h-3.5 w-3.5" />}
            Re-scan
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
          {reportLoading && !report && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Scanning inbox for BEC indicators...</p>
            </div>
          )}

          {report && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-white/5 bg-secondary/10 p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Messages</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{report.total_messages}</p>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-secondary/10 p-4">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Flagged</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{report.flagged_messages}</p>
                  </div>
                  <div className="rounded-xl border border-rose-500/10 bg-rose-500/5 p-4">
                    <p className="text-[11px] text-rose-400 uppercase tracking-wider">High Risk</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{report.high_risk_count}</p>
                  </div>
                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                    <p className="text-[11px] text-amber-400 uppercase tracking-wider">Medium Risk</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{report.medium_risk_count}</p>
                  </div>
                </div>

                {/* Findings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Flagged Messages ({report.findings.length})
                  </h3>
                  {report.findings.length === 0 ? (
                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-6 text-center">
                      <ShieldAlert className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                      <p className="text-sm text-emerald-400 font-medium">No BEC indicators found</p>
                      <p className="text-xs text-muted-foreground mt-1">This inbox appears clean based on keyword scanning.</p>
                    </div>
                  ) : (
                    report.findings.map((finding, i) => (
                      <motion.div
                        key={finding.message_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "rounded-xl border p-4 space-y-3",
                          finding.risk_score >= 70
                            ? "border-rose-500/10 bg-rose-500/5"
                            : finding.risk_score >= 40
                            ? "border-amber-500/10 bg-amber-500/5"
                            : "border-emerald-500/10 bg-emerald-500/5"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{finding.subject || "(No subject)"}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{finding.sender}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <RiskBadge score={finding.risk_score} />
                            {finding.has_attachments && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>Has attachments</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground line-clamp-2">{finding.snippet}</p>

                        <div className="flex flex-wrap gap-1.5">
                          {finding.keywords_found.map((kw) => (
                            <KeywordPill key={kw} keyword={kw} />
                          ))}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <span>Score: {finding.risk_score}/100</span>
                          <span>{new Date(finding.received_date).toLocaleString()}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
