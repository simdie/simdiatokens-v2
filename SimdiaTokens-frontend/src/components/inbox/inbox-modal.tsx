"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SafeEmailViewer } from "@/components/safe-email";
import {
  Mail,
  Clock,
  User,
  Eye,
  MailOpen,
  X,
  ChevronLeft,
  RefreshCw,
} from "lucide-react";
import { Token, GraphMessage } from "@/types/token";
import { fetchInbox } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";

interface InboxModalProps {
  token: Token | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InboxModal({ token, open, onOpenChange }: InboxModalProps) {
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GraphMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && token) {
      loadMessages();
    } else {
      setMessages([]);
      setSelectedMessage(null);
      setError(null);
    }
  }, [open, token]);

  async function loadMessages() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInbox(token.id);
      setMessages(data.value || []);
    } catch (err: any) {
      setError(err.message || "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] p-0 gap-0 overflow-hidden glass-strong border-white/10">
        <DialogHeader className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedMessage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="gap-1 text-muted-foreground hover:text-foreground -ml-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <Mail className="h-5 w-5 text-primary" />
              )}
              <DialogTitle className="text-base font-semibold">
                {selectedMessage ? selectedMessage.subject : `Inbox: ${token?.email}`}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              {!selectedMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMessages}
                  disabled={loading}
                  className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </div>
          </div>
          {token && !selectedMessage && (
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {token.email}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Expires {formatDistanceToNow(new Date(token.expires_at), { addSuffix: true })}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="h-[65vh]">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={loadMessages} className="mt-3">
                  Retry
                </Button>
              </div>
            </div>
          ) : selectedMessage ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full flex flex-col"
            >
              <div className="px-6 py-3 border-b border-white/5 bg-secondary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedMessage.from?.emailAddress?.name || selectedMessage.from?.emailAddress?.address || "Unknown"}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(selectedMessage.receivedDateTime), "PPP p")}</span>
                  </div>
                  {!selectedMessage.isRead && (
                    <Badge variant="secondary" className="text-[10px]">Unread</Badge>
                  )}
                </div>
              </div>
               <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <SafeEmailViewer
                    htmlContent={
                      selectedMessage.body?.content ||
                      selectedMessage.bodyPreview ||
                      "No content available."
                    }
                    contentType={
                      selectedMessage.body?.contentType === "html" ? "html" : "text"
                    }
                    className="flex-1 flex flex-col"
                  />
                </div>
            </motion.div>
          ) : messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <MailOpen className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">No messages found</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {messages.map((message, i) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedMessage(message)}
                      className={`group flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-secondary/40 ${
                        !message.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                        !message.isRead ? "bg-primary" : "bg-transparent border border-white/10"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {message.from?.emailAddress?.name || message.from?.emailAddress?.address || "Unknown"}
                          </p>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {formatDistanceToNow(new Date(message.receivedDateTime), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate mt-0.5">
                          {message.subject || "(No subject)"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {message.bodyPreview}
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-all flex-shrink-0 mt-1" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
