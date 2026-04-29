"use client";

import { Component, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex items-center justify-center p-8"
        >
          <div className="text-center max-w-md space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 ring-1 ring-destructive/20 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-destructive">Something went wrong</h3>
              <p className="text-xs text-muted-foreground mt-1">
                An unexpected error occurred. Please try again.
              </p>
              {this.state.error && (
                <p className="text-[10px] text-destructive/70 mt-2 font-mono bg-destructive/5 rounded-lg p-2 max-h-24 overflow-auto">
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="gap-1.5 border-destructive/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}
