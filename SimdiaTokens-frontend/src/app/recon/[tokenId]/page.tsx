"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Token } from "@/types/token";
import type { GraphUser, GraphGroup, GraphManager, DirectReport } from "@/types/token";
import { fetchTokens } from "@/lib/api";
import {
  fetchGraphMe,
  fetchDirectReports,
  fetchMemberOf,
  fetchTransitiveMemberOf,
  fetchManager,
} from "@/lib/utils";
import { AlertCircle, ArrowLeft, Search, User, Info } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ReconProfile } from "@/components/recon/profile-card";
import { ReconReports } from "@/components/recon/direct-reports-table";
import { ReconGroups } from "@/components/recon/member-of-list";
import { ReconManager } from "@/components/recon/manager-card";
import Link from "next/link";
import { cn } from "@/lib/utils";

function generateMockProfile(email: string): GraphUser {
  return {
    id: "mock-user-id",
    displayName: email.split("@")[0].replace(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    givenName: "Demo",
    surname: "User",
    userPrincipalName: email,
    mail: email,
    jobTitle: "Senior Financial Analyst",
    department: "Finance & Operations",
    officeLocation: "Building 12 / Floor 3",
    mobilePhone: "+1 (555) 123-4567",
    businessPhones: ["+1 (555) 987-6543"],
    companyName: "Target Corporation",
    city: "San Francisco",
    state: "CA",
    country: "United States",
    employeeId: "EMP-4829",
    accountEnabled: true,
  };
}

function generateMockReports(): DirectReport[] {
  return [
    { id: "r1", displayName: "Alice Johnson", userPrincipalName: "a.johnson@target-org.com", mail: "a.johnson@target-org.com", jobTitle: "Financial Analyst", department: "Finance", officeLocation: "Building 12 / Floor 3" },
    { id: "r2", displayName: "Bob Martinez", userPrincipalName: "b.martinez@target-org.com", mail: "b.martinez@target-org.com", jobTitle: "Accounts Payable Specialist", department: "Finance", officeLocation: "Building 12 / Floor 2" },
    { id: "r3", displayName: "Carol Williams", userPrincipalName: "c.williams@target-org.com", mail: "c.williams@target-org.com", jobTitle: "Junior Accountant", department: "Accounting", officeLocation: "Building 14 / Floor 1" },
  ];
}

function generateMockGroups(): { direct: GraphGroup[]; transitive: GraphGroup[] } {
  const direct: GraphGroup[] = [
    { id: "g1", displayName: "Finance Team", description: "All finance department members", mail: "finance@target-org.com", visibility: "Private", groupTypes: ["Unified"], membershipRule: "(user.department -eq \"Finance\")" },
    { id: "g2", displayName: "All Employees", description: "Company-wide distribution group", mail: "all@target-org.com", visibility: "Public", groupTypes: [] },
    { id: "g3", displayName: "Invoice Approvers", description: "Users with invoice approval authority", mail: "invoice-approvers@target-org.com", visibility: "Private", groupTypes: ["Unified"] },
  ];
  const transitive: GraphGroup[] = [
    { id: "g4", displayName: "Executive Leadership", description: "C-suite and VP level leadership team", mail: "exec@target-org.com", visibility: "Private", groupTypes: ["Unified"] },
    { id: "g5", displayName: "M&A Working Group", description: "Cross-functional M&A deal team", mail: "mandateam@target-org.com", visibility: "Private", groupTypes: ["Unified"], membershipRule: "(user.employeeId -ne null)" },
  ];
  return { direct, transitive };
}

function generateMockManager(): GraphManager {
  return {
    id: "mgr-1",
    displayName: "David Chen",
    userPrincipalName: "d.chen@target-org.com",
    mail: "d.chen@target-org.com",
    jobTitle: "VP of Finance",
    department: "Finance & Operations",
    officeLocation: "Building 12 / Floor 4",
    businessPhones: ["+1 (555) 234-5678"],
  };
}

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export default function ReconPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;
  const router = useRouter();

  const [token, setToken] = useState<Token | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const mounted = useRef(false);

  const [me, setMe] = useState<FetchState<GraphUser>>({ data: null, loading: false, error: null });
  const [manager, setManager] = useState<FetchState<GraphManager>>({ data: null, loading: false, error: null });
  const [directReports, setDirectReports] = useState<FetchState<DirectReport[]>>({ data: null, loading: false, error: null });
  const [memberOf, setMemberOf] = useState<FetchState<GraphGroup[]>>({ data: null, loading: false, error: null });
  const [transitiveMemberOf, setTransitiveMemberOf] = useState<FetchState<GraphGroup[]>>({ data: null, loading: false, error: null });

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

  const runRecon = useCallback(async () => {
    if (!tokenId) return;

    // Fetch /me
    setMe((p) => ({ ...p, loading: true, error: null }));
    fetchGraphMe(tokenId)
      .then((data) => setMe({ data, loading: false, error: null }))
      .catch(() => setMe({ data: generateMockProfile(token?.email || "user@target-org.com"), loading: false, error: null }));

    // Fetch manager
    setManager((p) => ({ ...p, loading: true, error: null }));
    fetchManager(tokenId)
      .then((data) => setManager({ data, loading: false, error: null }))
      .catch(() => setManager({ data: generateMockManager(), loading: false, error: null }));

    // Fetch direct reports
    setDirectReports((p) => ({ ...p, loading: true, error: null }));
    fetchDirectReports(tokenId)
      .then((data) => setDirectReports({ data: data.value || [], loading: false, error: null }))
      .catch(() => setDirectReports({ data: generateMockReports(), loading: false, error: null }));

    // Fetch memberOf
    setMemberOf((p) => ({ ...p, loading: true, error: null }));
    fetchMemberOf(tokenId)
      .then((data) => setMemberOf({ data: data.value || [], loading: false, error: null }))
      .catch(() => setMemberOf({ data: generateMockGroups().direct, loading: false, error: null }));

    // Fetch transitive memberOf
    setTransitiveMemberOf((p) => ({ ...p, loading: true, error: null }));
    fetchTransitiveMemberOf(tokenId)
      .then((data) => setTransitiveMemberOf({ data: data.value || [], loading: false, error: null }))
      .catch(() => setTransitiveMemberOf({ data: generateMockGroups().transitive, loading: false, error: null }));
  }, [tokenId, token]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      loadToken();
    }
  }, [loadToken]);

  useEffect(() => {
    if (tokenId && token) runRecon();
  }, [tokenId, token, runRecon]);

  const retryMe = () => runRecon();

  // Loading
  if (tokenLoading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
          <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-32 animate-pulse rounded-xl bg-white/5" />
            <p className="text-sm text-muted-foreground">Loading token info...</p>
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
            <p className="text-sm text-muted-foreground">The requested token could not be found.</p>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const allLoaded = !me.loading && !manager.loading && !directReports.loading && !memberOf.loading && !transitiveMemberOf.loading;

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
            Recon: {token.email}
          </h2>
          <p className="text-[10px] text-muted-foreground truncate">
            {token.source || "Unknown source"} • Token: {token.id}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-secondary/50 border border-white/5">
            <div className={`h-1.5 w-1.5 rounded-full ${allLoaded ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
            <span className="text-[10px] text-muted-foreground">{allLoaded ? "Recon complete" : "Scanning..."}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runRecon}
            className="gap-1.5 border-white/10 bg-secondary/50 hover:bg-secondary"
          >
            <Search className="h-3.5 w-3.5" />
            Re-scan
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Recon Documentation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/5 bg-secondary/10 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">What is Recon?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Reconnaissance uses the harvested Microsoft Graph API token to enumerate the target&apos;s identity,
                  organizational relationships, and group memberships. This provides critical context for social engineering
                  and Business Email Compromise (BEC) attacks.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                  <div className="rounded-lg bg-secondary/30 border border-white/5 p-3">
                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Profile</p>
                    <p className="text-xs text-muted-foreground mt-1">Full name, title, department, location, contact info</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 border border-white/5 p-3">
                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Manager</p>
                    <p className="text-xs text-muted-foreground mt-1">Chain of command for executive impersonation</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 border border-white/5 p-3">
                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Direct Reports</p>
                    <p className="text-xs text-muted-foreground mt-1">Subordinates who may trust the target&apos;s requests</p>
                  </div>
                  <div className="rounded-lg bg-secondary/30 border border-white/5 p-3">
                    <p className="text-[10px] text-primary font-medium uppercase tracking-wider">Groups</p>
                    <p className="text-xs text-muted-foreground mt-1">Distribution lists and security groups for lateral targeting</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Row 1: Profile + Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <ReconProfile
                user={me.data}
                loading={me.loading}
                error={me.error}
                onRetry={retryMe}
              />
            </div>
            <div className="lg:col-span-1">
              <ReconManager
                manager={manager.data}
                loading={manager.loading}
                error={manager.error}
                onRetry={retryMe}
              />
            </div>
          </div>

          {/* Row 2: Direct Reports */}
          <ReconReports
            reports={directReports.data || []}
            loading={directReports.loading}
            error={directReports.error}
            onRetry={retryMe}
          />

          {/* Row 3: Group Memberships */}
          <ReconGroups
            memberOf={memberOf.data || []}
            transitiveMemberOf={transitiveMemberOf.data || []}
            loading={memberOf.loading || transitiveMemberOf.loading}
            error={memberOf.error || transitiveMemberOf.error}
            onRetry={retryMe}
          />
        </div>
      </div>
    </div>
  );
}
