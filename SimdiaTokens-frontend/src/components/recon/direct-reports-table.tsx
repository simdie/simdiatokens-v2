"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DirectReport } from "@/types/token";
import {
  Users,
  ChevronDown,
  ChevronRight,
  Briefcase,
  Building2,
  MapPin,
  Mail,
  Loader2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ReconReportsProps {
  reports: DirectReport[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ReconReports({ reports, loading, error, onRetry }: ReconReportsProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = searchQuery.trim()
    ? reports.filter(
        (r) =>
          r.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.mail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.department?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : reports;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Direct Reports</h3>
            <p className="text-[10px] text-muted-foreground">{reports.length} people</p>
          </div>
        </div>
        {reports.length > 0 && (
          <div className="relative w-40">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-[11px] bg-secondary/50 border-white/5"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-xs text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-2 text-[10px] text-primary hover:underline">
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "No matching reports" : "No direct reports"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            <AnimatePresence>
              {filtered.map((report, i) => {
                const expanded = expandedIds.has(report.id);
                return (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <button
                      onClick={() => toggleExpand(report.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/20 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-full bg-violet-500/10 ring-1 ring-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-violet-400">
                          {(report.displayName || report.mail || "?")[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {report.displayName || "Unknown"}
                        </p>
                        {report.jobTitle && (
                          <p className="text-[10px] text-muted-foreground truncate">{report.jobTitle}</p>
                        )}
                      </div>
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-3 pl-16 space-y-1.5">
                            {report.mail && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[11px] text-muted-foreground font-mono">{report.mail}</span>
                              </div>
                            )}
                            {report.department && (
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[11px] text-muted-foreground">{report.department}</span>
                              </div>
                            )}
                            {report.officeLocation && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                <span className="text-[11px] text-muted-foreground">{report.officeLocation}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-[11px] text-muted-foreground">
                                {report.jobTitle || "No title"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
