"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login, register, isAuthenticated, isLoading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter username and password");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(username, password);
        toast.success("Welcome back");
      } else {
        await register(username, password);
        toast.success("Account created");
      }
      router.replace("/");
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">SimdiaTokens</h1>
          <p className="text-xs text-muted-foreground">
            {mode === "login" ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <Input
              name="simdia_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="mt-1.5 bg-secondary/50 border-white/5"
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Password
            </label>
            <div className="relative mt-1.5">
              <Input
                name="simdia_password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-secondary/50 border-white/5 pr-10"
                disabled={submitting}
                autoComplete="off"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full gap-1.5" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-xs text-muted-foreground">
          {mode === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-primary hover:underline"
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-primary hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </p>

        {mode === "login" && (
          <p className="text-center text-[10px] text-muted-foreground/60">
            Default: admin / admin12345
          </p>
        )}
      </motion.div>
    </div>
  );
}
