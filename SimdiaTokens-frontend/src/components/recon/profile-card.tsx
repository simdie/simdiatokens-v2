"use client";

import { motion } from "framer-motion";
import { GraphUser } from "@/types/token";
import {
  User,
  Briefcase,
  Building2,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReconProfileProps {
  user: GraphUser | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
  mono?: boolean;
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{label}</p>
        <p className={cn("text-xs text-foreground/90 truncate", mono && "font-mono")}>{value}</p>
      </div>
    </div>
  );
};

export function ReconProfile({ user, loading, error, onRetry }: ReconProfileProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl border border-white/5 overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">User Profile</h3>
        </div>
        {user?.accountEnabled !== undefined && (
          <span
            className={cn(
              "text-[10px] font-medium px-2 py-0.5 rounded-full border",
              user.accountEnabled
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-rose-500/30 bg-rose-500/10 text-rose-400"
            )}
          >
            {user.accountEnabled ? "Active" : "Disabled"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-xs text-destructive">{error}</p>
            <button onClick={onRetry} className="mt-2 text-[10px] text-primary hover:underline">
              Retry
            </button>
          </div>
        ) : user ? (
          <div className="space-y-4">
            {/* Name Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-white/5">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/10 ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-primary">
                  {(user.displayName || user.userPrincipalName || "?")[0].toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-foreground truncate">
                  {user.displayName || "Unknown"}
                </h4>
                {user.userPrincipalName && (
                  <p className="text-xs text-muted-foreground truncate">{user.userPrincipalName}</p>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow icon={Briefcase} label="Job Title" value={user.jobTitle} />
              <InfoRow icon={Building2} label="Department" value={user.department} />
              <InfoRow icon={MapPin} label="Office" value={user.officeLocation} />
              <InfoRow icon={MapPin} label="Location" value={[user.city, user.state, user.country].filter(Boolean).join(", ")} />
              <InfoRow icon={Mail} label="Email" value={user.mail || user.userPrincipalName} mono />
              <InfoRow icon={Phone} label="Phone" value={user.businessPhones?.[0] || user.mobilePhone} mono />
              <InfoRow icon={Hash} label="Employee ID" value={user.employeeId} mono />
              <InfoRow icon={Calendar} label="Created" value={user.createdDateTime ? new Date(user.createdDateTime).toLocaleDateString() : undefined} />
              <InfoRow icon={Building2} label="Company" value={user.companyName} />
              <InfoRow icon={MapPin} label="Address" value={user.streetAddress} />
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-8">No profile data available.</p>
        )}
      </div>
    </motion.div>
  );
}
