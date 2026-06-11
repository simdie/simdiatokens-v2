"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  parseISO,
} from "date-fns";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Globe,
  Loader2,
  Search,
  Shield,
  X,
} from "lucide-react";

import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getAuditLogs, AuditLogsQuery } from "@/lib/utils";
import { AuditLog } from "@/types/token";

type DateRange = "24h" | "7d" | "30d" | "custom" | "all";

const ACTION_OPTIONS = [
  { label: "All Actions", value: "" },
  { label: "Token Harvested", value: "token_harvested" },
  { label: "Token Refreshed", value: "token_refreshed" },
  { label: "Token Revoked", value: "token_revoked" },
  { label: "Campaign Created", value: "campaign_created" },
  { label: "Campaign Deleted", value: "campaign_deleted" },
  { label: "BEC Analyzed", value: "bec_analyzed" },
  { label: "Recon Run", value: "recon_run" },
  { label: "Inbox Rule Created", value: "inbox_rule_created" },
  { label: "Mail Sent", value: "mail_sent" },
  { label: "Mail Read Sync", value: "mail_read_sync" },
  { label: "Login", value: "login" },
  { label: "Logout", value: "logout" },
  { label: "Webhook Alert", value: "webhook_alert" },
];

function StatusBadge({ success }: { success: boolean }) {
  return success ? (
    <Badge
      variant="secondary"
      className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
    >
      <CheckCircle2 className="h-3 w-3 mr-1" />
      Success
    </Badge>
  ) : (
    <Badge
      variant="secondary"
      className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20"
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      Failed
    </Badge>
  );
}

function ActionBadge({ action }: { action: string }) {
  const colors: Record<string, string> = {
    token_harvested: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    token_refreshed: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    token_revoked: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    campaign_created: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    campaign_deleted: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    bec_analyzed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    recon_run: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    inbox_rule_created: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    mail_sent: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    mail_read_sync: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    login: "bg-green-500/10 text-green-400 border-green-500/20",
    logout: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    webhook_alert: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const color = colors[action] || "bg-muted/30 text-muted-foreground border-border";
  return (
    <Badge variant="secondary" className={cn("text-[10px] border", color)}>
      {action}
    </Badge>
  );
}

export default function ActivityPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const queryParams = useMemo<AuditLogsQuery>(() => {
    const params: AuditLogsQuery = { page, per_page: perPage };

    if (actionFilter) params.action = actionFilter;
    if (campaignFilter) params.campaign_id = campaignFilter;

    const now = new Date();
    switch (dateRange) {
      case "24h":
        params.from = startOfDay(subDays(now, 1)).toISOString();
        params.to = endOfDay(now).toISOString();
        break;
      case "7d":
        params.from = startOfDay(subDays(now, 7)).toISOString();
        params.to = endOfDay(now).toISOString();
        break;
      case "30d":
        params.from = startOfDay(subDays(now, 30)).toISOString();
        params.to = endOfDay(now).toISOString();
        break;
      case "custom":
        if (customFrom) params.from = startOfDay(parseISO(customFrom)).toISOString();
        if (customTo) params.to = endOfDay(parseISO(customTo)).toISOString();
        break;
      case "all":
      default:
        break;
    }
    return params;
  }, [dateRange, customFrom, customTo, actionFilter, campaignFilter, page, perPage]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["audit-logs", queryParams],
    queryFn: () => getAuditLogs(queryParams),
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / perPage)) : 1;

  const dateRangeButtons: { label: string; value: DateRange }[] = [
    { label: "24h", value: "24h" },
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "Custom", value: "custom" },
    { label: "All", value: "all" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DashboardTopBar title="Activity Log" subtitle="Audit trail and system events" />

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold">{data?.total ?? 0}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Success</p>
              <p className="text-xl font-bold">
                {data?.logs.filter((l) => l.success).length ?? 0}
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Failed</p>
              <p className="text-xl font-bold">
                {data?.logs.filter((l) => !l.success).length ?? 0}
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-xl border border-white/5 bg-secondary/10 p-4 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Page</p>
              <p className="text-xl font-bold">
                {page} / {totalPages}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-white/5 bg-secondary/10 p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Date range</span>
            {dateRangeButtons.map((btn) => (
              <Button
                key={btn.value}
                size="sm"
                variant={dateRange === btn.value ? "default" : "outline"}
                className={cn(
                  "h-7 text-[11px]",
                  dateRange === btn.value
                    ? "bg-primary text-primary-foreground"
                    : "border-white/10 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => {
                  setDateRange(btn.value);
                  setPage(1);
                }}
              >
                {btn.label}
              </Button>
            ))}
          </div>

          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => {
                  setCustomFrom(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs bg-background border-white/10"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => {
                  setCustomTo(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs bg-background border-white/10"
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded-md border border-white/10 bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              placeholder="Filter by campaign ID"
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                setPage(1);
              }}
              className="h-8 w-48 text-xs bg-background border-white/10"
            />
            {(actionFilter || campaignFilter || dateRange !== "30d") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[11px] text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setActionFilter("");
                  setCampaignFilter("");
                  setDateRange("30d");
                  setPage(1);
                }}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/5 bg-secondary/10 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-destructive">Failed to load audit logs.</p>
            </div>
          ) : data?.logs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No audit logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground w-[180px]">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Timestamp
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Action
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                      Campaign
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      Token
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground hidden lg:table-cell">
                      User
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground hidden xl:table-cell">
                      <Globe className="h-3 w-3 inline mr-1" />
                      IP
                    </TableHead>
                    <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="border-white/5 cursor-pointer hover:bg-white/5"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(parseISO(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <ActionBadge action={log.action} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[140px] truncate">
                        {log.campaign_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-[140px] truncate">
                        {log.token_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden lg:table-cell max-w-[160px] truncate">
                        {log.user_email ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden xl:table-cell font-mono">
                        {log.ip_address ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge success={log.success} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data && data.total > perPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <p className="text-[11px] text-muted-foreground">
                Showing {(page - 1) * perPage + 1}–
                {Math.min(page * perPage, data.total)} of {data.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 border-white/10"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 border-white/10"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg bg-background border-white/10">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Audit Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">ID</span>
                <span className="font-mono">{selectedLog.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Timestamp</span>
                <span>{format(parseISO(selectedLog.timestamp), "PPpp")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Action</span>
                <ActionBadge action={selectedLog.action} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge success={selectedLog.success} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Campaign</span>
                <span className="font-mono">{selectedLog.campaign_id ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Token</span>
                <span className="font-mono">{selectedLog.token_id ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User</span>
                <span>{selectedLog.user_email ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono">{selectedLog.ip_address ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User Agent</span>
                <span className="max-w-[240px] truncate text-muted-foreground">
                  {selectedLog.user_agent ?? "—"}
                </span>
              </div>
              {selectedLog.details && (
                <div className="rounded-lg border border-white/5 bg-secondary/10 p-3">
                  <p className="text-muted-foreground mb-1">Details</p>
                  <p className="text-foreground whitespace-pre-wrap">{selectedLog.details}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
