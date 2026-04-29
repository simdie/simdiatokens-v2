"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TokenFilters as TokenFiltersType } from "@/types/token";

interface TokenFiltersProps {
  filters: TokenFiltersType;
  onFiltersChange: (filters: TokenFiltersType) => void;
  sources: string[];
  autoRefresh: boolean;
  onAutoRefreshChange: (value: boolean) => void;
}

export function TokenFilters({
  filters,
  onFiltersChange,
  sources,
  autoRefresh,
  onAutoRefreshChange,
}: TokenFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="pl-9 w-full sm:w-72 bg-secondary/50 border-white/5"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              status: (v || "all") as TokenFiltersType["status"],
            })
          }
        >
          <SelectTrigger className="w-full sm:w-36 bg-secondary/50 border-white/5">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.source}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              source: (v as string) || "all",
            })
          }
        >
          <SelectTrigger className="w-full sm:w-44 bg-secondary/50 border-white/5">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="glass-strong border-white/10">
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source === "all" ? "All Sources" : source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-white/5">
        <span className="text-[10px] font-medium text-muted-foreground">
          Auto-refresh
        </span>
        <Switch
          checked={autoRefresh}
          onCheckedChange={onAutoRefreshChange}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    </motion.div>
  );
}
