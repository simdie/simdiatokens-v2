"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { Token, GraphMessage } from "@/types/token";
import { fetchTokens, fetchInbox } from "@/lib/api";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { InboxList } from "@/components/inbox/email-list";
import { InboxDetail } from "@/components/inbox/email-detail";
import { InboxRuleModal } from "@/components/inbox/rule-creator-modal";
import { InboxForwardModal } from "@/components/inbox/email-forward-modal";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

function generateMockEmails(): GraphMessage[] {
  return Array.from({ length: 12 }, (_, i) => {
    const senders = [
      { name: "Sarah Chen", address: "s.chen@corp.com" },
      { name: "Accounts Payable", address: "ap@vendor-co.com" },
      { name: "Marcus Rivera", address: "m.rivera@corp.com" },
      { name: "IT Support", address: "it@corp.com" },
      { name: "Emily Park", address: "e.park@partner.com" },
    ];
    const subjects = [
      "Q2 Invoice #INV-2024-0" + (890 + i),
      "RE: Wire Transfer Confirmation Needed",
      "Meeting Follow-up: Budget Review",
      "Urgent: Payment Processing Required",
      "Your payroll information has been updated",
      "New vendor onboarding request",
    ];
    const previews = [
      "Please find attached the quarterly invoice for services rendered...",
      "Following up on our call regarding the wire transfer to the advisory firm...",
      "Here are the action items from today's budget review meeting...",
      "This payment needs to be processed by end of day...",
      "Your direct deposit information has been successfully updated...",
      "I'd like to submit a new vendor for approval in our system...",
    ];
    const s = senders[i % senders.length];
    const subj = subjects[i % subjects.length];
    return {
      id: `msg-${i}`,
      subject: subj,
      from: { emailAddress: s },
      receivedDateTime: new Date(Date.now() - i * 3600000 * (i + 1) * 0.5).toISOString(),
      bodyPreview: previews[i % previews.length],
      isRead: i < 3,
      hasAttachments: i % 3 === 0,
      body: {
        contentType: "html",
        content: `<div><p><strong>${subj}</strong></p><p>${previews[i % previews.length]} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p><p>Best regards,<br/>${s.name}<br/>${s.address}</p></div>`,
      },
    };
  });
}

export default function InboxPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;
  const router = useRouter();

  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  // Email state
  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GraphMessage | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Search / filter / sort
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRead, setFilterRead] = useState<"all" | "read" | "unread">("all");
  const [sortBy, setSortBy] = useState<"date" | "sender">("date");
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [forwardModalOpen, setForwardModalOpen] = useState(false);

  // Summarization state
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const loadToken = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTokens();
      const found = data?.find((t: Token) => t.id === tokenId) || null;
      setToken(found);
    } catch (err: any) {
      setError(err.message || "Failed to load token");
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const loadMessages = useCallback(async () => {
    if (!tokenId) return;
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await fetchInbox(tokenId);
      let msgs: GraphMessage[] = data.value || [];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        msgs = msgs.filter(
          (m) =>
            m.subject?.toLowerCase().includes(q) ||
            m.from?.emailAddress?.address?.toLowerCase().includes(q) ||
            m.bodyPreview?.toLowerCase().includes(q)
        );
      }

      if (filterRead !== "all") {
        msgs = msgs.filter((m) => (filterRead === "read" ? m.isRead : !m.isRead));
      }

      msgs.sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime();
        }
        return (a.from?.emailAddress?.address || "").localeCompare(b.from?.emailAddress?.address || "");
      });

      setMessages(msgs);
    } catch {
      // Fall back to mock data when backend unavailable
      let msgs = generateMockEmails();
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        msgs = msgs.filter(
          (m) =>
            m.subject?.toLowerCase().includes(q) ||
            m.from?.emailAddress?.address?.toLowerCase().includes(q) ||
            m.bodyPreview?.toLowerCase().includes(q)
        );
      }
      if (filterRead !== "all") {
        msgs = msgs.filter((m) => (filterRead === "read" ? m.isRead : !m.isRead));
      }
      msgs.sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime();
        }
        return (a.from?.emailAddress?.address || "").localeCompare(b.from?.emailAddress?.address || "");
      });
      setMessages(msgs);
      setMessagesError(null);
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  }, [tokenId, searchQuery, filterRead, sortBy]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      loadToken();
    }
  }, [loadToken]);

  useEffect(() => {
    if (tokenId) loadMessages();
  }, [loadMessages]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
  };

  const handleSelectMessage = (msg: GraphMessage) => {
    setSelectedMessage(msg);
    setSummary(null);
    // Mark as read (visual only)
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
    );
  };

  const handleMarkUnread = () => {
    if (!selectedMessage) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? { ...m, isRead: false } : m))
    );
    setSelectedMessage((prev) => (prev ? { ...prev, isRead: false } : null));
  };

  const handleSummarize = async () => {
    if (!selectedMessage || !tokenId) return;
    setSummarizing(true);
    try {
      const res = await fetch(`/api/summarize?token_id=${encodeURIComponent(tokenId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: selectedMessage.id,
          subject: selectedMessage.subject,
          body: selectedMessage.body?.content || selectedMessage.bodyPreview || "",
        }),
      });
      const data = await res.json();
      setSummary(data.summary || "No summary available.");
    } catch {
      // Mock summary when backend unavailable
      setSummary(
        `Mock AI Summary: This email regarding "${selectedMessage.subject}" contains information related to account activity. The sender (${selectedMessage.from?.emailAddress?.address || "unknown"}) appears to be communicating about standard operational matters. Key action items may include review and follow-up.`
      );
    } finally {
      setSummarizing(false);
    }
  };

  const handleForward = () => {
    if (selectedMessage) setForwardModalOpen(true);
  };

  const handleCreateRule = () => {
    setRuleModalOpen(true);
  };

  const handleAnalyze = () => {
    router.push(`/analyze/${encodeURIComponent(tokenId)}`);
  };

  useKeyboardShortcuts({
    "ctrl+r": handleRefresh,
  });

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardTopBar title="Inbox" subtitle="Loading..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-32 animate-pulse rounded-xl bg-white/5" />
            <p className="text-sm text-muted-foreground">Loading inbox...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardTopBar title="Inbox" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Error</h3>
            <p className="text-sm text-destructive/80">{error}</p>
            <Button variant="outline" size="sm" onClick={loadToken}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  // Token not found
  if (!token) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardTopBar title="Inbox" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Mail className="h-8 w-8 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">Token not found</h3>
            <p className="text-sm text-muted-foreground">The requested token could not be found.</p>
            <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 flex items-center gap-3 h-14 px-4 sm:px-6 glass-strong border-b border-white/5">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-5 w-px bg-white/10" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground truncate">
            {token.email}
          </h2>
          <p className="text-[10px] text-muted-foreground truncate">
            {token.source || "Unknown source"} • {messages.length} emails
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-1.5 border-white/10 bg-secondary/50 hover:bg-secondary"
          >
            <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
            </svg>
            Refresh
          </Button>
        </div>
      </div>

      {/* Main split-screen content */}
      <div className="flex-1 flex min-h-0">
        {/* Left sidebar: Email list */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-[340px] flex-shrink-0 border-r border-white/5 flex flex-col"
        >
          <InboxList
            messages={messages}
            selectedMessageId={selectedMessage?.id || null}
            onSelectMessage={handleSelectMessage}
            loading={messagesLoading}
            error={messagesError}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterRead={filterRead}
            onFilterChange={setFilterRead}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onCreateRule={handleCreateRule}
          />
        </motion.div>

        {/* Right main: Email detail */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex-1 flex flex-col min-w-0"
        >
          <InboxDetail
            message={selectedMessage}
            tokenId={tokenId}
            onSummarize={handleSummarize}
            onForward={handleForward}
            onCreateRule={handleCreateRule}
            onMarkUnread={handleMarkUnread}
            onAnalyze={handleAnalyze}
            summarizing={summarizing}
            summary={summary}
          />
        </motion.div>
      </div>

      {/* Modals */}
      <InboxRuleModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        tokenId={tokenId}
        message={selectedMessage}
      />
      <InboxForwardModal
        open={forwardModalOpen}
        onOpenChange={setForwardModalOpen}
        tokenId={tokenId}
        message={selectedMessage}
      />
    </div>
  );
}
