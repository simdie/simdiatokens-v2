"use client";
import { DashboardTopBar } from "@/components/dashboard/top-bar";

export default function TokensPage() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <DashboardTopBar title="Tokens" subtitle="Browse and manage all harvested tokens" />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Token management page coming soon.</p>
      </div>
    </div>
  );
}
