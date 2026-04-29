"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraphMessage } from "@/types/token";
import { Forward, Loader2, Send } from "lucide-react";

interface InboxForwardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: string;
  message: GraphMessage | null;
}

export function InboxForwardModal({ open, onOpenChange, tokenId, message }: InboxForwardModalProps) {
  const [to, setTo] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!to.trim() || !message) return;
    setSending(true);
    try {
      await fetch(`/api/forward?token_id=${encodeURIComponent(tokenId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          to: to.trim(),
          comment: comment.trim() || undefined,
        }),
      });
    } catch {
      console.log("Forward Email:", {
        tokenId,
        messageId: message.id,
        to: to.trim(),
        comment: comment.trim(),
      });
    } finally {
      setSending(false);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onOpenChange(false);
        setTo("");
        setComment("");
      }, 1500);
    }
  };

  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden glass-strong border-white/10">
        <DialogHeader className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center">
              <Forward className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">Forward Email</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Forward this email from {message.from?.emailAddress?.address || "unknown"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Original email info */}
          <div className="rounded-xl bg-secondary/30 border border-white/5 p-3">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
              Original Email
            </p>
            <p className="text-xs font-medium text-foreground truncate">{message.subject || "(No subject)"}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              From: {message.from?.emailAddress?.address || "Unknown"}
            </p>
          </div>

          {/* To field */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Forward To
            </label>
            <Input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@email.com"
              className="mt-1.5 bg-secondary/50 border-white/5"
              autoComplete="off"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Add a note (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Fwd: check this out..."
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-white/5 bg-secondary/50 px-3 py-2 text-sm outline-none resize-none focus-visible:border-ring transition-colors placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 text-emerald-400 text-xs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
              Email forwarded
            </motion.div>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-white/10">
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !to.trim()}
                className="gap-1.5"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Forward
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
