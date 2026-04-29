"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Token, BECAnalysisReport } from "@/types/token";
import { fetchTokens, analyzeInbox } from "@/lib/api";
import { AlertCircle, ArrowLeft, Brain, Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnalysisReport } from "@/components/analyze/analysis-report";
import Link from "next/link";
import { cn } from "@/lib/utils";

function generateMockReport(email: string): BECAnalysisReport {
  return {
    summary: `Analysis of ${email}'s inbox reveals multiple high-value BEC opportunities. The victim appears to be involved in financial operations with access to invoice processing and vendor relationships. Several executives with signature authority have been identified. The inbox contains ongoing deal discussions and payment threads that could be exploited through targeted impersonation attacks.`,
    riskScore: 78,
    severity: "high",
    emailCount: 47,
    analyzedAt: new Date().toISOString(),
    opportunities: [
      {
        type: "Invoice Fraud",
        confidence: 85,
        description: "Multiple invoice threads detected with vendors. The victim regularly processes payment requests. An attacker posing as a known vendor could redirect payments to a fraudulent account.",
        involvedParties: ["accounts@vendor-example.com", "finance@target-org.com"],
        suggestedAction: "Impersonate a recurring vendor and send updated banking details for upcoming invoice payments.",
      },
      {
        type: "CEO Fraud",
        confidence: 72,
        description: "The victim communicates regularly with the CEO regarding urgent wire transfers. The CEO's communication patterns and signature style have been captured from the inbox.",
        involvedParties: ["ceo@target-org.com", "cfo@target-org.com"],
        suggestedAction: "Spoof CEO email requesting urgent wire transfer to attacker-controlled account, citing confidential acquisition.",
      },
      {
        type: "Payment Redirect",
        confidence: 68,
        description: "Active conversations about upcoming payments to contractors. Weak verification processes appear to be in place for payment detail changes.",
        involvedParties: ["hr@target-org.com", "payroll@target-org.com"],
        suggestedAction: "Send updated direct deposit information from a spoofed employee email address to redirect salary payments.",
      },
    ],
    financialThreads: [
      {
        subject: "Q2 Vendor Payment Schedule - Action Required",
        amount: "245,000",
        currency: "USD",
        parties: ["accounts@vendor-example.com", "ap@target-org.com"],
        date: new Date().toISOString(),
      },
      {
        subject: "RE: Invoice #INV-2024-0897 Due",
        amount: "78,500",
        currency: "USD",
        parties: ["billing@consulting-co.com", "finance@target-org.com"],
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        subject: "Wire Transfer Request - M&A Advisory",
        amount: "500,000",
        currency: "USD",
        parties: ["ceo@target-org.com", "banking@advisory-firm.com"],
        date: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
    ],
    executives: [
      { name: "Sarah Chen", title: "Chief Executive Officer", email: "s.chen@target-org.com", influence: "high" },
      { name: "Marcus Rivera", title: "Chief Financial Officer", email: "m.rivera@target-org.com", influence: "high" },
      { name: "Emily Park", title: "VP of Operations", email: "e.park@target-org.com", influence: "medium" },
      { name: "James Wilson", title: "Director of Finance", email: "j.wilson@target-org.com", influence: "medium" },
    ],
    deals: [
      {
        subject: "Proposal: Cloud Migration Project Q3",
        parties: ["sales@cloud-provider.com", "it@target-org.com", "procurement@target-org.com"],
        value: "$1.2M",
        stage: "Negotiation",
        date: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        subject: "Office Expansion Lease Agreement",
        parties: ["leasing@commercial-realty.com", "ops@target-org.com"],
        value: "$340K/yr",
        stage: "Pending Signature",
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    highValueTargets: [
      { name: "Sarah Chen", email: "s.chen@target-org.com", reason: "CEO with wire transfer authority; frequent target for impersonation" },
      { name: "Accounts Payable Dept", email: "ap@target-org.com", reason: "Processes all vendor payments; primary invoice fraud target" },
      { name: "Marcus Rivera", email: "m.rivera@target-org.com", reason: "CFO with access to all financial accounts" },
    ],
    attackAngles: [
      {
        scenario: "Vendor Email Compromise",
        complexity: "medium",
        successProbability: 78,
        description: "Register a lookalike domain for a known vendor, intercept an active invoice thread, and provide updated bank details. The victim's organization appears to have weak vendor verification processes based on email patterns observed.",
        prerequisites: ["Lookalike domain registration", "Knowledge of vendor email format", "Timing alignment with payment cycle"],
      },
      {
        scenario: "Executive Impersonation (CEO Fraud)",
        complexity: "low",
        successProbability: 65,
        description: "Spoof the CEO's email during off-hours to request an urgent wire transfer. The inbox shows the CEO frequently sends brief, direct requests for payment processing.",
        prerequisites: ["CEO email spoofing capability", "Knowledge of urgent/rush payment process"],
      },
      {
        scenario: "Payroll Diversion",
        complexity: "high",
        successProbability: 52,
        description: "Send updated direct deposit forms from a spoofed employee email. The HR department processes these through email and rarely follows up with in-person verification.",
        prerequisites: ["Employee email format knowledge", "Fake direct deposit form", "HR department email list"],
      },
    ],
  };
}

export default function AnalyzePage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;
  const router = useRouter();

  const [token, setToken] = useState<Token | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [report, setReport] = useState<BECAnalysisReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
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

  const runAnalysis = useCallback(async () => {
    if (!tokenId) return;
    setReportLoading(true);
    setReportError(null);
    setReport(null);
    try {
      const result = await analyzeInbox(tokenId);
      setReport(result);
    } catch {
      // Mock report when backend unavailable
      const mock = generateMockReport(token?.email || "victim@target-org.com");
      await new Promise((r) => setTimeout(r, 2000));
      setReport(mock);
    } finally {
      setReportLoading(false);
    }
  }, [tokenId, token]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      loadToken();
    }
  }, [loadToken]);

  useEffect(() => {
    if (tokenId && token) runAnalysis();
  }, [tokenId, token, runAnalysis]);

  // Loading state
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

  // Token error
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

  // Token not found
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
            AI Analysis: {token.email}
          </h2>
          <p className="text-[10px] text-muted-foreground truncate">
            BEC Opportunity Assessment • {token.source || "Unknown source"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={reportLoading}
            className="gap-1.5 border-white/10 bg-secondary/50 hover:bg-secondary"
          >
            <Brain className="h-3.5 w-3.5" />
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 py-6">
          <AnalysisReport
            report={report}
            loading={reportLoading}
            error={reportError}
            onRetry={runAnalysis}
            victimEmail={token.email}
          />
        </div>
      </div>
    </div>
  );
}
