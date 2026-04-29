"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraphGroup } from "@/types/token";
import {
  FolderKanban,
  Folders,
  ChevronDown,
  ChevronRight,
  Mail,
  Globe,
  Lock,
  Eye,
  Layers,
  Loader2,
  Search,
  Info,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReconGroupsProps {
  memberOf: GraphGroup[];
  transitiveMemberOf: GraphGroup[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function GroupCard({
  group,
  variant,
}: {
  group: GraphGroup;
  variant: "direct" | "transitive";
}) {
  const [expanded, setExpanded] = useState(false);
  const isTransitive = variant === "transitive";
  const isUnified = group.groupTypes?.includes("Unified");
  const isSecurity = group.groupTypes?.includes("Unified") === false || group.groupTypes?.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/[0.04] bg-secondary/20 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/30 transition-colors text-left"
      >
        <div className={cn(
          "h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0",
          isTransitive ? "bg-amber-500/10 ring-1 ring-amber-500/20" : "bg-cyan-500/10 ring-1 ring-cyan-500/20"
        )}>
          <Folders className={cn("h-3.5 w-3.5", isTransitive ? "text-amber-400" : "text-cyan-400")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-foreground truncate">{group.displayName || "Unknown"}</p>
          {group.mail && (
            <p className="text-[10px] text-muted-foreground truncate font-mono">{group.mail}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {isUnified && (
            <Badge variant="outline" className="text-[9px] py-0 h-4 border-violet-500/30 text-violet-400">
              M365
            </Badge>
          )}
          {isSecurity && (
            <Badge variant="outline" className="text-[9px] py-0 h-4 border-cyan-500/30 text-cyan-400">
              Security
            </Badge>
          )}
          {isTransitive && (
            <Badge variant="outline" className="text-[9px] py-0 h-4 border-amber-500/30 text-amber-400">
              Nested
            </Badge>
          )}
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pl-12 space-y-1.5">
              {group.description && (
                <div className="flex items-start gap-1.5">
                  <Info className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground">{group.description}</p>
                </div>
              )}
              {group.mail && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono">{group.mail}</span>
                </div>
              )}
              {group.visibility && (
                <div className="flex items-center gap-1.5">
                  {group.visibility === "Private" ? (
                    <Lock className="h-3 w-3 text-amber-400" />
                  ) : (
                    <Globe className="h-3 w-3 text-emerald-400" />
                  )}
                  <span className="text-[10px] text-muted-foreground capitalize">{group.visibility}</span>
                </div>
              )}
              {group.membershipRule && (
                <div className="flex items-start gap-1.5">
                  <Layers className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground font-mono break-all">{group.membershipRule}</p>
                </div>
              )}
              {group.createdDateTime && (
                <p className="text-[9px] text-muted-foreground/50">
                  Created {new Date(group.createdDateTime).toLocaleDateString()}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ReconGroups({ memberOf, transitiveMemberOf, loading, error, onRetry }: ReconGroupsProps) {
  const [activeTab, setActiveTab] = useState<"direct" | "transitive">("direct");
  const [searchQuery, setSearchQuery] = useState("");

  const currentGroups = activeTab === "direct" ? memberOf : transitiveMemberOf;
  const filtered = searchQuery.trim()
    ? currentGroups.filter(
        (g) =>
          g.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.mail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentGroups;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 flex items-center justify-center">
              <FolderKanban className="h-3.5 w-3.5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Group Memberships</h3>
              <p className="text-[10px] text-muted-foreground">
                {memberOf.length} direct · {transitiveMemberOf.length} transitive
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-2">
          <button
            onClick={() => setActiveTab("direct")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
              activeTab === "direct"
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Direct ({memberOf.length})
          </button>
          <button
            onClick={() => setActiveTab("transitive")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors",
              activeTab === "transitive"
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Transitive ({transitiveMemberOf.length})
          </button>
        </div>

        {/* Search */}
        {currentGroups.length > 0 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab} groups...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 h-7 text-[11px] bg-secondary/50 border-white/5 w-full"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 max-h-[400px] overflow-y-auto space-y-1.5">
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
            <Folders className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "No matching groups" : `No ${activeTab} groups`}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((group, i) => (
              <GroupCard
                key={group.id}
                group={group}
                variant={activeTab === "direct" ? "direct" : "transitive"}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
