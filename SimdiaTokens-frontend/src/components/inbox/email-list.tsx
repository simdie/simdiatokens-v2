"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Mail,
  Paperclip,
  AlertTriangle,
  Loader2,
  Plus,
  InboxIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraphMessage } from "@/types/token";
import { formatDistanceToNow } from "date-fns";

interface InboxListProps {
  messages: GraphMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (message: GraphMessage) => void;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterRead: "all" | "read" | "unread";
  onFilterChange: (value: "all" | "read" | "unread") => void;
  sortBy: "date" | "sender";
  onSortChange: (value: "date" | "sender") => void;
  onRefresh: () => void;
  refreshing: boolean;
  onCreateRule: () => void;
}

export function InboxList({
  messages,
  selectedMessageId,
  onSelectMessage,
  loading,
  error,
  searchQuery,
  onSearchChange,
  filterRead,
  onFilterChange,
  sortBy,
  onSortChange,
  onRefresh,
  refreshing,
  onCreateRule,
}: InboxListProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <InboxIcon className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Inbox</h3>
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {messages.length} emails
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-8 text-xs bg-secondary/50 border-white/5 w-full"
          />
        </div>

        {/* Filter & Sort row */}
        <div className="flex items-center gap-2">
          <Select value={filterRead} onValueChange={(v) => v && onFilterChange(v as typeof filterRead)}>
            <SelectTrigger className="h-7 text-[11px] flex-1 bg-secondary/50 border-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/10">
              <SelectItem value="all">All Mail</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => v && onSortChange(v as typeof sortBy)}>
            <SelectTrigger className="h-7 text-[11px] flex-1 bg-secondary/50 border-white/5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-strong border-white/10">
              <SelectItem value="date">By Date</SelectItem>
              <SelectItem value="sender">By Sender</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 min-h-0">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">Loading emails...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
              <p className="text-[11px] text-destructive">{error}</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Mail className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-[11px] text-muted-foreground">No emails found</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y divide-white/[0.03]">
              <AnimatePresence>
                {messages.map((msg, i) => {
                  const isSelected = msg.id === selectedMessageId;
                  const isRead = !!msg.isRead;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015, duration: 0.15 }}
                      onClick={() => onSelectMessage(msg)}
                      className={`group px-4 py-3 cursor-pointer transition-all duration-150 ${
                        isSelected
                          ? "bg-primary/10 border-l-2 border-primary"
                          : "border-l-2 border-transparent hover:bg-secondary/30"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Sender avatar */}
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          !isRead ? "bg-primary/20 ring-1 ring-primary/30" : "bg-secondary/50"
                        }`}>
                          <span className={`text-[10px] font-semibold ${!isRead ? "text-primary" : "text-muted-foreground"}`}>
                            {(msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "?")[0].toUpperCase()}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-xs line-clamp-1 ${!isRead ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                              {msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "Unknown"}
                            </p>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5 tabular-nums">
                              {formatDistanceToNow(new Date(msg.receivedDateTime), { addSuffix: false })
                                .replace("about ", "")
                                .replace("less than a minute", "now")
                                .replace(" minutes", "m")
                                .replace(" minute", "m")
                                .replace(" hours", "h")
                                .replace(" hour", "h")
                                .replace(" days", "d")
                                .replace(" day", "d")
                                .replace(" months", "mo")
                                .replace(" month", "mo")}
                            </span>
                          </div>
                          <p className={`text-xs line-clamp-1 mt-0.5 ${!isRead ? "font-medium text-foreground" : "text-muted-foreground/70"}`}>
                            {msg.subject || "(No subject)"}
                          </p>
                          <p className="text-[10px] text-muted-foreground/50 line-clamp-1 mt-0.5">
                            {msg.bodyPreview}
                          </p>
                        </div>

                        {msg.hasAttachments && (
                          <Paperclip className="h-3 w-3 text-muted-foreground/30 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-3 py-2 border-t border-white/5">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateRule}
          className="w-full justify-start gap-2 h-8 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Inbox Rule
        </Button>
      </div>
    </div>
  );
}
