"use client";

import { motion } from "framer-motion";
import { GraphUser, GraphManager, DirectReport } from "@/types/token";
import { User, Briefcase, Mail, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrgTreeProps {
  target: GraphUser;
  manager?: GraphManager;
  directReports: DirectReport[];
}

function PersonCard({
  name,
  title,
  email,
  department,
  variant,
}: {
  name: string;
  title?: string;
  email?: string;
  department?: string;
  variant: "manager" | "target" | "report";
}) {
  const isTarget = variant === "target";
  const isManager = variant === "manager";
  const initial = (name || "?")[0].toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border flex flex-col items-center text-center px-4 py-3 min-w-[180px] max-w-[260px]",
        isTarget
          ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20"
          : isManager
          ? "bg-amber-500/5 border-amber-500/20 ring-1 ring-amber-500/10"
          : "bg-secondary/30 border-white/5"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold mb-2",
          isTarget
            ? "bg-primary/20 text-primary ring-1 ring-primary/30"
            : isManager
            ? "bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30"
            : "bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20"
        )}
      >
        {initial}
      </div>
      <p className={cn("text-sm font-semibold truncate w-full", isTarget ? "text-primary" : "text-foreground")}>
        {name}
      </p>
      {title && (
        <p className="text-[11px] text-muted-foreground truncate w-full flex items-center justify-center gap-1 mt-0.5">
          <Briefcase className="h-3 w-3 flex-shrink-0" />
          {title}
        </p>
      )}
      {email && (
        <p className="text-[10px] text-muted-foreground/70 truncate w-full font-mono mt-0.5">
          {email}
        </p>
      )}
      {department && (
        <p className="text-[10px] text-muted-foreground/60 truncate w-full flex items-center justify-center gap-1 mt-0.5">
          <Building2 className="h-3 w-3 flex-shrink-0" />
          {department}
        </p>
      )}
    </motion.div>
  );
}

function Connector({ hasChildren = true }: { hasChildren?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-4 bg-white/10" />
      {hasChildren && (
        <>
          <div className="w-4 h-px bg-white/10" />
          <div className="w-px h-4 bg-white/10" />
        </>
      )}
    </div>
  );
}

export function OrgTree({ target, manager, directReports }: OrgTreeProps) {
  return (
    <div className="flex flex-col items-center py-6">
      {/* Manager */}
      {manager && (
        <>
          <PersonCard
            variant="manager"
            name={manager.displayName || manager.userPrincipalName || "Unknown"}
            title={manager.jobTitle}
            email={manager.mail || manager.userPrincipalName}
            department={manager.department}
          />
          <Connector />
        </>
      )}

      {/* Target User */}
      <PersonCard
        variant="target"
        name={target.displayName || target.userPrincipalName || "Unknown"}
        title={target.jobTitle}
        email={target.mail || target.userPrincipalName}
        department={target.department}
      />

      {/* Direct Reports */}
      {directReports.length > 0 && (
        <>
          <Connector hasChildren={directReports.length > 0} />
          <div className="flex flex-wrap items-start justify-center gap-3 mt-2">
            {directReports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PersonCard
                  variant="report"
                  name={report.displayName || report.userPrincipalName || "Unknown"}
                  title={report.jobTitle}
                  email={report.mail || report.userPrincipalName}
                  department={report.department}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
