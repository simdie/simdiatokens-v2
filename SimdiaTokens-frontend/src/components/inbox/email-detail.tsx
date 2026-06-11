"use client";

import { motion } from "framer-motion";
import {
  Mail,
  MailOpen,
  Clock,
  User,
  Sparkles,
  Forward,
  Shield,
  MailMinus,
  Calendar,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SafeEmailViewer } from "@/components/safe-email";
import { GraphMessage } from "@/types/token";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface InboxDetailProps {
  message: GraphMessage | null;
  tokenId: string;
  onSummarize: () => void;
  onForward: () => void;
  onCreateRule: () => void;
  onMarkUnread: () => void;
  onAnalyze?: () => void;
  onDelete: () => void;
  summarizing: boolean;
  summary: string | null;
}

export function InboxDetail({
  message,
  tokenId,
  onSummarize,
  onForward,
  onCreateRule,
  onMarkUnread,
  onAnalyze,
  onDelete,
  summarizing,
  summary,
}: InboxDetailProps) {
  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="h-16 w-16 rounded-2xl bg-secondary/30 border border-white/5 flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">No email selected</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Select an email from the inbox to view its contents
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const contentType = message.body?.contentType || "text";
  const bodyContent = message.body?.content || message.bodyPreview || "";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 bg-secondary/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSummarize}
          disabled={summarizing}
          className="gap-1.5 h-7 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <Sparkles className={`h-3.5 w-3.5 ${summarizing ? "animate-spin" : ""}`} />
          AI Summarize
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onForward}
          className="gap-1.5 h-7 text-[11px] text-primary hover:text-primary hover:bg-primary/10"
        >
          <Forward className="h-3.5 w-3.5" />
          Forward
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateRule}
          className="gap-1.5 h-7 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <Shield className="h-3.5 w-3.5" />
          Create Rule
        </Button>
        {message.isRead ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMarkUnread}
            className="gap-1.5 h-7 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <MailMinus className="h-3.5 w-3.5" />
            Mark Unread
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="gap-1.5 h-7 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </div>

      {/* Summary (if available) */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mx-4 mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">AI Summary</p>
          </div>
          <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
        </motion.div>
      )}

      {/* Email Header */}
      <div className="px-6 py-4 border-b border-white/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-semibold text-primary">
                {(message.from?.emailAddress?.name || message.from?.emailAddress?.address || "?")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-semibold text-foreground truncate">
                  {message.subject || "(No subject)"}
                </h4>
                {!message.isRead && (
                  <Badge variant="secondary" className="text-[10px] py-0 h-5">
                    New
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {message.from?.emailAddress?.name || message.from?.emailAddress?.address || "Unknown"}
                  {message.from?.emailAddress?.address &&
                    message.from?.emailAddress?.name !== message.from?.emailAddress?.address && (
                      <span className="text-muted-foreground/50">
                        &lt;{message.from.emailAddress.address}&gt;
                      </span>
                    )}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(message.receivedDateTime), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <span className="text-muted-foreground/40">
                  ({formatDistanceToNow(new Date(message.receivedDateTime), { addSuffix: true })})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <SafeEmailViewer
          htmlContent={bodyContent}
          contentType={contentType === "html" ? "html" : "text"}
          className="flex-1 flex flex-col"
        />
      </div>
    </div>
  );
}
