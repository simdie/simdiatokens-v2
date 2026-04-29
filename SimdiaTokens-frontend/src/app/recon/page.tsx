"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  Radar,
  Loader2,
  AlertTriangle,
  InboxIcon,
  ChevronRight,
  Building2,
  Globe,
  Users,
  FolderKanban,
  Download,
  RefreshCw,
  ArrowUpDown,
  Play,
  FileJson,
} from "lucide-react";
import { format } from "date-fns";

import { Token, ReconReport, GraphGroup } from "@/types/token";
import { fetchTokens, runRecon, getRecon } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDecryptedData } from "@/hooks/use-decrypted-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { OrgTree } from "@/components/recon/org-tree";

function TokenAvatar({ email, size = 32 }: { email: string; size?: number }) {
  const initial = (email?.[0] || "?").toUpperCase();
  const hue = email.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-[10px]"
      style={{
        width: size,
        height: size,
        backgroundColor: `hsl(${hue} 60% 20%)`,
        color: `hsl(${hue} 70% 70%)`,
        border: `1px solid hsl(${hue} 50% 30%)`,
      }}
    >
      {initial}
    </div>
  );
}

const groupColumnHelper = createColumnHelper<GraphGroup>();

export default function ReconPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [tokenSearch, setTokenSearch] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

  const [report, setReport] = useState<ReconReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [hasNoReport, setHasNoReport] = useState(false);

  const [groupSorting, setGroupSorting] = useState<SortingState>([]);

  const mounted = useRef(false);

  // Decrypt sensitive fields
  const { data: decryptedReport } = useDecryptedData(report);
  const { data: decryptedTokens } = useDecryptedData(tokens);

  const displayReport = decryptedReport ?? report;
  const displayTokens = decryptedTokens ?? tokens;
  const selectedToken = displayTokens.find((t) => t.id === selectedTokenId) || null;

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);
    setTokensError(null);
    try {
      const data = await fetchTokens();
      setTokens(data || []);
    } catch (err: any) {
      setTokensError(err.message || "Failed to load tokens");
    } finally {
      setTokensLoading(false);
    }
  }, []);

  const loadReport = useCallback(async () => {
    if (!selectedTokenId) return;
    setReportLoading(true);
    setReportError(null);
    setHasNoReport(false);
    try {
      const data = await getRecon(selectedTokenId);
      setReport(data);
      setHasNoReport(false);
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("404") || msg.includes("Not Found") || msg.includes("no_report")) {
        setHasNoReport(true);
        setReport(null);
      } else {
        setReportError(msg || "Failed to load recon report");
      }
    } finally {
      setReportLoading(false);
    }
  }, [selectedTokenId]);

  const handleStartRecon = async () => {
    if (!selectedTokenId) return;
    setReportLoading(true);
    setReportError(null);
    setHasNoReport(false);
    try {
      const data = await runRecon(selectedTokenId);
      setReport(data);
    } catch (err: any) {
      setReportError(err.message || "Recon failed");
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recon-report-${selectedToken?.email || "unknown"}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      loadTokens();
    }
  }, [loadTokens]);

  useEffect(() => {
    if (selectedTokenId) {
      loadReport();
    } else {
      setReport(null);
      setHasNoReport(false);
      setReportError(null);
    }
  }, [selectedTokenId, loadReport]);

  const filteredTokens = displayTokens.filter((t) => {
    if (!tokenSearch.trim()) return true;
    const q = tokenSearch.toLowerCase();
    return t.email.toLowerCase().includes(q) || t.source?.toLowerCase().includes(q);
  });

  // Groups table
  const groupColumns = useMemo(
    () => [
      groupColumnHelper.accessor("displayName", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-[11px] uppercase tracking-wider"
          >
            Name
            <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: (info) => (
          <span className="text-xs font-medium text-foreground">{info.getValue() || "—"}</span>
        ),
      }),
      groupColumnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <span className="text-xs text-muted-foreground truncate max-w-[300px] block">
            {info.getValue() || "—"}
          </span>
        ),
      }),
      groupColumnHelper.accessor("mail", {
        header: "Email",
        cell: (info) => (
          <span className="text-[11px] text-muted-foreground font-mono">{info.getValue() || "—"}</span>
        ),
      }),
      groupColumnHelper.accessor("visibility", {
        header: "Visibility",
        cell: (info) => {
          const val = info.getValue();
          return val ? (
            <Badge
              variant="secondary"
              className={cn(
                "text-[10px]",
                val === "Private"
                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              )}
            >
              {val}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          );
        },
      }),
      groupColumnHelper.accessor("groupTypes", {
        header: "Type",
        cell: (info) => {
          const types = info.getValue() || [];
          const isUnified = types.includes("Unified");
          return (
            <Badge variant="secondary" className="text-[10px]">
              {isUnified ? "M365 Group" : "Security"}
            </Badge>
          );
        },
      }),
    ],
    []
  );

  const groupTable = useReactTable({
    data: report?.groups || [],
    columns: groupColumns,
    state: { sorting: groupSorting },
    onSortingChange: setGroupSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DashboardTopBar
        title="Organization Reconnaissance"
        subtitle="Enumerate tenant topology, org chart, and group memberships"
      />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Token Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="w-[280px] flex-shrink-0 border-r border-white/5 bg-secondary/10 flex flex-col"
        >
          <div className="px-3 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Radar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Tokens</h3>
              <span className="text-[11px] text-muted-foreground tabular-nums ml-auto">
                {displayTokens.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={tokenSearch}
                onChange={(e) => setTokenSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-secondary/50 border-white/5"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {tokensLoading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Loading tokens...</p>
              </div>
            ) : tokensError ? (
              <div className="px-3 py-4">
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-[11px] text-destructive">{tokensError}</p>
                </div>
              </div>
            ) : filteredTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <InboxIcon className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-[11px] text-muted-foreground">No tokens found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {filteredTokens.map((token) => {
                  const isSelected = token.id === selectedTokenId;
                  return (
                    <button
                      key={token.id}
                      onClick={() => setSelectedTokenId(token.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 transition-all duration-150 flex items-center gap-2.5",
                        isSelected
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "border-l-2 border-transparent hover:bg-secondary/30"
                      )}
                    >
                      <TokenAvatar email={token.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{token.email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {token.source || "Unknown"}
                        </p>
                      </div>
                      <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", isSelected ? "text-primary" : "text-muted-foreground/30")} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </motion.aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          {!selectedToken ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="h-16 w-16 rounded-2xl bg-secondary/30 border border-white/5 flex items-center justify-center mx-auto">
                  <Radar className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Select a Token</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a token to run reconnaissance or view existing reports
                  </p>
                </div>
              </motion.div>
            </div>
          ) : reportLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mx-auto">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Running Reconnaissance</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enumerating user, manager, direct reports, groups, and organization...
                  </p>
                </div>
              </motion.div>
            </div>
          ) : reportError ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-4 max-w-md px-4"
              >
                <div className="h-12 w-12 rounded-xl bg-destructive/10 ring-1 ring-destructive/20 flex items-center justify-center mx-auto">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-destructive">Recon Failed</h3>
                  <p className="text-xs text-destructive/80 mt-1">{reportError}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={loadReport}>
                    Retry Load
                  </Button>
                  <Button size="sm" onClick={handleStartRecon}>
                    <Play className="h-3.5 w-3.5 mr-1" />
                    Run Recon
                  </Button>
                </div>
              </motion.div>
            </div>
          ) : hasNoReport ? (
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-5 max-w-sm px-4"
              >
                <div className="h-20 w-20 rounded-2xl bg-secondary/30 border border-white/5 flex items-center justify-center mx-auto">
                  <Radar className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">No Recon Report</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Reconnaissance hasn&apos;t been run for <strong>{selectedToken.email}</strong> yet.
                    Start a scan to enumerate the tenant topology.
                  </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={handleStartRecon}>
                  <Play className="h-4 w-4" />
                  Start Recon
                </Button>
              </motion.div>
            </div>
          ) : displayReport ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 space-y-6"
            >
              {/* Header actions */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {displayReport.target_user.displayName || selectedToken.email}
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    {displayReport.target_user.userPrincipalName || selectedToken.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/10"
                    onClick={handleDownload}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download Report
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 border-white/10"
                    onClick={handleStartRecon}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Org Tree */}
              <div className="rounded-xl border border-white/5 bg-secondary/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Organization Chart</h3>
                </div>
                <OrgTree
                  target={displayReport.target_user}
                  manager={displayReport.manager}
                  directReports={displayReport.direct_reports}
                />
              </div>

              {/* Organization Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Tenant</p>
                    <p className="text-sm font-semibold text-foreground">
                      {displayReport.organization.tenant_name || "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Verified Domains</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {displayReport.organization.verified_domains.length > 0 ? (
                        displayReport.organization.verified_domains.map((d) => (
                          <Badge key={d} variant="secondary" className="text-[10px]">
                            {d}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm font-semibold text-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
                    <FolderKanban className="h-4 w-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Groups</p>
                    <p className="text-sm font-semibold text-foreground">{displayReport.groups.length}</p>
                  </div>
                </div>
              </div>

              {/* Groups Table */}
              <div className="rounded-xl border border-white/5 bg-secondary/10 overflow-hidden">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <FolderKanban className="h-4 w-4 text-violet-400" />
                  <h3 className="text-sm font-semibold text-foreground">Groups</h3>
                  <span className="text-[11px] text-muted-foreground ml-auto">
                    {displayReport.groups.length} groups
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {groupTable.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="border-white/5 hover:bg-transparent">
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {groupTable.getRowModel().rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={groupColumns.length} className="h-32 text-center text-muted-foreground">
                            No groups found
                          </TableCell>
                        </TableRow>
                      ) : (
                        groupTable.getRowModel().rows.map((row) => (
                          <TableRow key={row.id} className="border-white/5">
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </motion.div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
