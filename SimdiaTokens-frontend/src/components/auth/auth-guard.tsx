"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname && pathname !== "/login") {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Never block login page or while pathname is still resolving (null during hydration)
  if (!pathname || pathname === "/login") {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
