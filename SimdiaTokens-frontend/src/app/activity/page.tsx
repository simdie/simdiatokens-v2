"use client";
import { DashboardTopBar } from "@/components/dashboard/top-bar";

export default function ActivityPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DashboardTopBar title="Activity Log" subtitle="Audit trail and system events" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Activity log coming soon.</p>
      </div>
    </div>
  );
}
