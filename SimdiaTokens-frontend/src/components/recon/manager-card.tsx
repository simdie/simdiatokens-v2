"use client";

import { motion } from "framer-motion";
import { GraphManager } from "@/types/token";
import {
  User,
  Briefcase,
  Building2,
  Mail,
  MapPin,
  ChevronRight,
  ExternalLink,
  Loader2,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReconManagerProps {
  manager: GraphManager | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function ReconManager({ manager, loading, error, onRetry }: ReconManagerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.05 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center">
          <User className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Manager</h3>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-xs text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-2 text-[10px] text-primary hover:underline">
              Retry
            </button>
          </div>
        ) : manager ? (
          <div className="space-y-3">
            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 ring-1 ring-amber-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-amber-400">
                  {(manager.displayName || manager.userPrincipalName || "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-foreground truncate">
                  {manager.displayName || "Unknown"}
                </h4>
                {manager.userPrincipalName && (
                  <p className="text-[10px] text-muted-foreground truncate font-mono">
                    {manager.userPrincipalName}
                  </p>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              {manager.jobTitle && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80">{manager.jobTitle}</span>
                </div>
              )}
              {manager.department && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80">{manager.department}</span>
                </div>
              )}
              {manager.mail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground font-mono">{manager.mail}</span>
                </div>
              )}
              {manager.officeLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-foreground/80">{manager.officeLocation}</span>
                </div>
              )}
              {manager.businessPhones?.[0] && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[11px] text-muted-foreground font-mono">{manager.businessPhones[0]}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <User className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No manager found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
