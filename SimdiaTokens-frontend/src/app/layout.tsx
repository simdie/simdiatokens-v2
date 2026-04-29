import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { AppShell } from "@/components/dashboard/app-shell";
import { QueryProvider } from "@/components/ui/query-provider";
import { LiveModeProvider } from "@/lib/polling";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SimdiaTokens | Token Management Dashboard",
  description: "Enterprise-grade OAuth2 token management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased dark`}
    >
      <body className="h-full w-full flex bg-background">
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider delay={200}>
              <ErrorBoundary>
                <AuthProvider>
                  <LiveModeProvider>
                    <AppShell>{children}</AppShell>
                  </LiveModeProvider>
                </AuthProvider>
              </ErrorBoundary>
            </TooltipProvider>
            <Toaster
              richColors
              closeButton
              position="top-right"
              toastOptions={{
                style: {
                  borderRadius: "0.75rem",
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                },
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
