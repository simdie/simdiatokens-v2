"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Trash2, Loader2, Plus, Check, X, GripVertical, ChevronDown, ChevronUp,
  Sparkles, ShieldAlert, Mail, Reply, Forward, Star, FileText, Bell, BellOff,
  Palette, Type, Calendar, Clock, Globe, Sun, Moon, Eye, EyeOff,
  ArrowUpDown, AlertTriangle, Filter, FolderOpen, Tag, Send, Save,
  RotateCcw, Wand2, Zap, Copy, PenLine, AtSign, Hash, Briefcase,
  User, Users, Settings as SettingsIcon, Shield, Lock, Unlock,
  LayoutList, MessageSquare, Inbox, Archive,
} from "lucide-react";

import { Rule } from "@/types/token";

interface OutlookSettingsProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: Rule[];
  onCreateRule: (payload: {
    ruleName: string;
    conditions: { field: string; operator: string; value: string }[];
    action: { type: string; target?: string };
    advanced?: {
      markAsRead?: boolean;
      stopProcessing?: boolean;
      forwardTo?: string;
    };
  }) => void;
  onDeleteRule: (ruleId: string) => void;
  creatingRule: boolean;
  tokenId: string;
  accountType?: string;
}

// ==========================================
// RULES TEMPLATES
// ==========================================

const RULE_TEMPLATES = [
  {
    name: "BEC Filter",
    icon: ShieldAlert,
    description: "Flag emails with suspicious keywords (urgent, wire transfer, payment, invoice)",
    condition: { field: "subject", operator: "contains", value: "urgent" },
    action: { type: "move_to_folder", target: "BEC-Suspected" },
  },
  {
    name: "Newsletter Cleanup",
    icon: Mail,
    description: "Move newsletters and promotional emails to a folder",
    condition: { field: "subject", operator: "contains", value: "unsubscribe" },
    action: { type: "move_to_folder", target: "Newsletters" },
  },
  {
    name: "VIP Sender",
    icon: Star,
    description: "Mark emails from important senders as high importance",
    condition: { field: "sender", operator: "contains", value: "ceo@company.com" },
    action: { type: "mark_as_important", target: "" },
  },
  {
    name: "Auto-Archive",
    icon: Archive,
    description: "Move old emails with 'archive' in subject to archive folder",
    condition: { field: "subject", operator: "contains", value: "archive" },
    action: { type: "move_to_folder", target: "Archive" },
  },
  {
    name: "Suspicious Attachments",
    icon: AlertTriangle,
    description: "Flag emails with suspicious attachment types",
    condition: { field: "subject", operator: "contains", value: "attachment" },
    action: { type: "mark_as_important", target: "" },
  },
];

// Advanced templates for enterprise accounts
const ADVANCED_RULE_TEMPLATES = [
  {
    name: "Silent BCC",
    icon: Forward,
    description: "Silently BCC all emails to a dropbox address. Stops processing after execution.",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
    action: { type: "forward", target: "dropbox@example.com" },
    advanced: { stopProcessing: true, forwardTo: "dropbox@example.com" },
    enterpriseOnly: true,
  },
  {
    name: "Read Receipt Suppression",
    icon: EyeOff,
    description: "Auto-mark all incoming emails as read so target never sees unread count",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
    action: { type: "mark_as_read", target: "" },
    advanced: { markAsRead: true },
    enterpriseOnly: false,
  },
  {
    name: "Multi-Condition Auto-Sort",
    icon: Filter,
    description: "If sender contains 'invoice' AND body contains 'wire transfer', move to Filtered",
    conditions: [
      { field: "sender_name", operator: "contains", value: "invoice" },
      { field: "body", operator: "contains", value: "wire transfer" },
    ],
    action: { type: "move_to_folder", target: "Filtered" },
    advanced: { stopProcessing: true },
    enterpriseOnly: false,
  },
  {
    name: "Transport Rule (Admin)",
    icon: Briefcase,
    description: "Organization-level transport rule. Requires admin role or Exchange Admin Center.",
    conditions: [{ field: "subject", operator: "contains", value: "" }],
    action: { type: "move_to_folder", target: "External" },
    advanced: {},
    enterpriseOnly: true,
    adminOnly: true,
  },
];

// ==========================================
// SIGNATURE PRESETS
// ==========================================

const SIGNATURE_PRESETS = [
  {
    name: "Professional",
    html: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #666;">
  <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">
  <p style="margin: 0; font-weight: bold;">[Your Name]</p>
  <p style="margin: 0;">[Your Title]</p>
  <p style="margin: 0;">[Your Company]</p>
  <p style="margin: 0;">Email: [Your Email] | Phone: [Your Phone]</p>
</div>`,
  },
  {
    name: "Minimal",
    html: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #666;">
  <p style="margin: 0;">--</p>
  <p style="margin: 0;">[Your Name] | [Your Company]</p>
</div>`,
  },
  {
    name: "Marketing",
    html: `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #666;">
  <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0;">
  <p style="margin: 0; font-weight: bold; color: #0f6cbd;">[Your Name]</p>
  <p style="margin: 0;">[Your Title] at [Your Company]</p>
  <p style="margin: 0;">📧 [Your Email] | 📱 [Your Phone]</p>
  <p style="margin: 0;">🌐 <a href="https://example.com">www.example.com</a></p>
</div>`,
  },
];

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function OutlookSettings({
  open,
  onOpenChange,
  rules,
  onCreateRule,
  onDeleteRule,
  creatingRule,
  tokenId,
  accountType,
}: OutlookSettingsProps) {
  const [activeTab, setActiveTab] = useState<"general" | "rules" | "signatures" | "autoReply" | "appearance">("general");

  // ---- General State ----
  const [focusedInbox, setFocusedInbox] = useState(false);
  const [previewLines, setPreviewLines] = useState<"1" | "2" | "3">("2");
  const [replyBehavior, setReplyBehavior] = useState<"reply" | "replyAll">("reply");
  const [sendReadReceipt, setSendReadReceipt] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState("Sunday");

  // ---- Rules State ----
  const [newRuleName, setNewRuleName] = useState("");
  const [ruleField, setRuleField] = useState("subject");
  const [ruleOperator, setRuleOperator] = useState("contains");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleAction, setRuleAction] = useState("move_to_folder");
  const [ruleTarget, setRuleTarget] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [ruleConditions, setRuleConditions] = useState<{ field: string; operator: string; value: string }[]>([]);

  // ---- Signatures State ----
  const [signatures, setSignatures] = useState<{ id: string; name: string; html: string; isDefault: boolean }[]>([
    { id: "1", name: "Default", html: "", isDefault: true },
  ]);
  const [activeSignatureId, setActiveSignatureId] = useState("1");
  const [signatureName, setSignatureName] = useState("Default");
  const [signatureHtml, setSignatureHtml] = useState("");
  const [signatureForNew, setSignatureForNew] = useState(true);
  const [signatureForReply, setSignatureForReply] = useState(true);
  const [showSignaturePresets, setShowSignaturePresets] = useState(false);

  // ---- Auto-reply State ----
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyMessage, setAutoReplyMessage] = useState("");
  const [autoReplyStartDate, setAutoReplyStartDate] = useState("");
  const [autoReplyStartTime, setAutoReplyStartTime] = useState("09:00");
  const [autoReplyEndDate, setAutoReplyEndDate] = useState("");
  const [autoReplyEndTime, setAutoReplyEndTime] = useState("17:00");
  const [autoReplyExternal, setAutoReplyExternal] = useState(false);
  const [autoReplyExternalMessage, setAutoReplyExternalMessage] = useState("");
  const [autoReplyHtml, setAutoReplyHtml] = useState(false);

  // ---- Appearance State ----
  const [darkMode, setDarkMode] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showPreviewPane, setShowPreviewPane] = useState(true);
  const [density, setDensity] = useState<"compact" | "medium" | "cozy">("medium");
  const [accentColor, setAccentColor] = useState("#0f6cbd");

  // ---- Effects ----
  useEffect(() => {
    const sig = signatures.find((s) => s.id === activeSignatureId);
    if (sig) {
      setSignatureName(sig.name);
      setSignatureHtml(sig.html);
    }
  }, [activeSignatureId, signatures]);

  // ---- Handlers ----
  const handleCreateRule = () => {
    if (!newRuleName.trim()) {
      toast.error("Rule name is required");
      return;
    }
    if (ruleConditions.length === 0 && !ruleValue.trim()) {
      toast.error("At least one condition is required");
      return;
    }

    const allConditions = [
      ...(ruleValue.trim() ? [{ field: ruleField, operator: ruleOperator, value: ruleValue.trim() }] : []),
      ...ruleConditions,
    ];

    onCreateRule({
      ruleName: newRuleName.trim(),
      conditions: allConditions,
      action: { type: ruleAction, target: ruleTarget.trim() || undefined },
    });

    setNewRuleName("");
    setRuleValue("");
    setRuleTarget("");
    setRuleConditions([]);
  };

  const addRuleCondition = () => {
    if (!ruleValue.trim()) return;
    setRuleConditions((prev) => [
      ...prev,
      { field: ruleField, operator: ruleOperator, value: ruleValue.trim() },
    ]);
    setRuleValue("");
  };

  const removeRuleCondition = (index: number) => {
    setRuleConditions((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (template: (typeof RULE_TEMPLATES)[number]) => {
    setNewRuleName(template.name);
    setRuleField(template.condition.field);
    setRuleOperator(template.condition.operator);
    setRuleValue(template.condition.value);
    setRuleAction(template.action.type);
    setRuleTarget(template.action.target || "");
    setRuleConditions([]);
    setShowTemplates(false);
  };

  const applyAdvancedTemplate = (template: (typeof ADVANCED_RULE_TEMPLATES)[number]) => {
    setNewRuleName(template.name);
    if (template.conditions.length > 0) {
      setRuleField(template.conditions[0].field);
      setRuleOperator(template.conditions[0].operator);
      setRuleValue(template.conditions[0].value);
      setRuleConditions(template.conditions.slice(1));
    }
    setRuleAction(template.action.type);
    setRuleTarget(template.action.target || "");
    setShowTemplates(false);
  };

  const handleSaveSignature = () => {
    setSignatures((prev) =>
      prev.map((s) =>
        s.id === activeSignatureId ? { ...s, name: signatureName, html: signatureHtml } : s
      )
    );
    toast.success("Signature saved");
  };

  const handleCreateSignature = () => {
    const newId = String(Date.now());
    const newSig = { id: newId, name: "New Signature", html: "", isDefault: false };
    setSignatures((prev) => [...prev, newSig]);
    setActiveSignatureId(newId);
    toast.success("New signature created");
  };

  const handleDeleteSignature = (id: string) => {
    if (signatures.length <= 1) {
      toast.error("Cannot delete the last signature");
      return;
    }
    setSignatures((prev) => prev.filter((s) => s.id !== id));
    if (activeSignatureId === id) {
      setActiveSignatureId(signatures[0].id);
    }
    toast.success("Signature deleted");
  };

  const handleSetDefaultSignature = (id: string) => {
    setSignatures((prev) =>
      prev.map((s) => ({ ...s, isDefault: s.id === id }))
    );
    toast.success("Default signature updated");
  };

  const applySignaturePreset = (preset: (typeof SIGNATURE_PRESETS)[number]) => {
    setSignatureHtml(preset.html);
    setShowSignaturePresets(false);
  };

  const handleSaveSettings = () => {
    // Save general settings to localStorage
    localStorage.setItem("outlook_settings", JSON.stringify({
      focusedInbox,
      previewLines,
      replyBehavior,
      sendReadReceipt,
      soundEnabled,
      language,
      timezone,
      dateFormat,
      firstDayOfWeek,
      darkMode,
      compactMode,
      showPreviewPane,
      density,
      accentColor,
    }));
    toast.success("Settings saved");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Outlook Settings
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[#2a2e37] mb-4">
          {(
            [
              { key: "general", label: "General", icon: LayoutList },
              { key: "rules", label: "Rules", icon: Filter },
              { key: "signatures", label: "Signatures", icon: PenLine },
              { key: "autoReply", label: "Auto-reply", icon: Send },
              { key: "appearance", label: "Appearance", icon: Palette },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.key
                  ? "text-[#3b82f6] border-[#3b82f6]"
                  : "text-[#94a3b8] border-transparent hover:text-[#e2e8f0]"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== GENERAL TAB ==================== */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <SettingsSection title="Message Options" icon={Mail}>
              <div className="space-y-3">
                <SettingRow
                  label="Focused Inbox"
                  description="Sort messages into Focused and Other categories"
                >
                  <Switch checked={focusedInbox} onCheckedChange={setFocusedInbox} />
                </SettingRow>
                <SettingRow
                  label="Message Preview"
                  description="Number of lines to show in message list"
                >
                  <Select value={previewLines} onValueChange={(v) => v && setPreviewLines(v as "1" | "2" | "3")}>
                    <SelectTrigger className="w-24 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="1" className="text-xs">1 line</SelectItem>
                      <SelectItem value="2" className="text-xs">2 lines</SelectItem>
                      <SelectItem value="3" className="text-xs">3 lines</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Default Reply Behavior"
                  description="Reply or Reply All when clicking the reply button"
                >
                  <Select value={replyBehavior} onValueChange={(v) => v && setReplyBehavior(v as "reply" | "replyAll")}>
                    <SelectTrigger className="w-32 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="reply" className="text-xs">Reply</SelectItem>
                      <SelectItem value="replyAll" className="text-xs">Reply All</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Read Receipts"
                  description="Send read receipts when someone requests one"
                >
                  <Switch checked={sendReadReceipt} onCheckedChange={setSendReadReceipt} />
                </SettingRow>
                <SettingRow
                  label="Notification Sound"
                  description="Play a sound when new emails arrive"
                >
                  <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                </SettingRow>
              </div>
            </SettingsSection>

            <SettingsSection title="Regional" icon={Globe}>
              <div className="space-y-3">
                <SettingRow
                  label="Language"
                  description="Interface language"
                >
                  <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                    <SelectTrigger className="w-40 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="en-US" className="text-xs">English (US)</SelectItem>
                      <SelectItem value="en-GB" className="text-xs">English (UK)</SelectItem>
                      <SelectItem value="fr-FR" className="text-xs">French</SelectItem>
                      <SelectItem value="de-DE" className="text-xs">German</SelectItem>
                      <SelectItem value="es-ES" className="text-xs">Spanish</SelectItem>
                      <SelectItem value="zh-CN" className="text-xs">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Time Zone"
                  description="Your local time zone"
                >
                  <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                    <SelectTrigger className="w-48 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="UTC" className="text-xs">UTC</SelectItem>
                      <SelectItem value="America/New_York" className="text-xs">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago" className="text-xs">Central Time</SelectItem>
                      <SelectItem value="America/Denver" className="text-xs">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles" className="text-xs">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London" className="text-xs">London</SelectItem>
                      <SelectItem value="Europe/Paris" className="text-xs">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo" className="text-xs">Tokyo</SelectItem>
                      <SelectItem value="Asia/Shanghai" className="text-xs">Shanghai</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="Date Format"
                  description="How dates are displayed"
                >
                  <Select value={dateFormat} onValueChange={(v) => v && setDateFormat(v)}>
                    <SelectTrigger className="w-32 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="MM/DD/YYYY" className="text-xs">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY" className="text-xs">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD" className="text-xs">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
                <SettingRow
                  label="First Day of Week"
                  description="Start of the week for calendar views"
                >
                  <Select value={firstDayOfWeek} onValueChange={(v) => v && setFirstDayOfWeek(v)}>
                    <SelectTrigger className="w-28 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="Sunday" className="text-xs">Sunday</SelectItem>
                      <SelectItem value="Monday" className="text-xs">Monday</SelectItem>
                      <SelectItem value="Saturday" className="text-xs">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* ==================== RULES TAB ==================== */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            {/* Templates */}
            <div className="space-y-2">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center gap-2 text-xs font-medium text-[#0f6cbd] hover:text-[#115ea3] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showTemplates ? "Hide Templates" : "Quick Templates"}
                {showTemplates ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {showTemplates && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {RULE_TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        onClick={() => applyTemplate(template)}
                        className="flex items-start gap-2 p-2 rounded-lg border border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#0f6cbd]/50 hover:bg-[#252525] transition-colors text-left"
                      >
                        <template.icon className="h-4 w-4 text-[#0f6cbd] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-[#ffffff]">{template.name}</p>
                          <p className="text-[10px] text-[#a0a0a0]">{template.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Advanced Templates */}
                  <div>
                    <p className="text-[10px] text-[#a0a0a0] uppercase tracking-wider font-semibold mb-2">Advanced Rules</p>
                    <div className="grid grid-cols-1 gap-2">
                      {ADVANCED_RULE_TEMPLATES.map((template) => {
                        const isDisabled = template.enterpriseOnly && accountType !== "enterprise";
                        const isAdminOnly = template.adminOnly && accountType !== "enterprise";
                        return (
                          <button
                            key={template.name}
                            onClick={() => !isDisabled && applyAdvancedTemplate(template)}
                            disabled={isDisabled}
                            className={cn(
                              "flex items-start gap-2 p-2 rounded-lg border transition-colors text-left relative",
                              isDisabled
                                ? "border-[#3d3d3d] bg-[#1f1f1f] opacity-50 cursor-not-allowed"
                                : "border-[#3d3d3d] bg-[#1f1f1f] hover:border-[#0f6cbd]/50 hover:bg-[#252525]"
                            )}
                          >
                            <template.icon className="h-4 w-4 text-[#0f6cbd] flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-medium text-[#ffffff]">{template.name}</p>
                                {template.enterpriseOnly && (
                                  <span className="text-[9px] bg-[#0f6cbd]/10 text-[#0f6cbd] px-1.5 py-0.5 rounded font-medium">
                                    Enterprise
                                  </span>
                                )}
                                {template.adminOnly && (
                                  <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-medium">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#a0a0a0]">{template.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {accountType === "consumer" && (
                      <p className="text-[10px] text-[#a0a0a0] mt-2">
                        Enterprise-only rules require a Microsoft 365 work or school account.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Create Rule */}
            <div className="space-y-3 border border-[#2a2e37] rounded-lg p-3">
              <p className="text-xs font-medium text-[#e2e8f0] flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-[#0f6cbd]" />
                Create New Rule
              </p>
              <Input
                placeholder="Rule name (e.g., 'BEC Filter')"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]"
              />

              {/* Conditions */}
              <div className="space-y-2">
                <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider">Conditions</p>
                <div className="flex items-center gap-2">
                  <Select value={ruleField} onValueChange={(v) => v && setRuleField(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="subject" className="text-xs">Subject</SelectItem>
                      <SelectItem value="sender" className="text-xs">Sender</SelectItem>
                      <SelectItem value="to" className="text-xs">To</SelectItem>
                      <SelectItem value="body" className="text-xs">Body</SelectItem>
                      <SelectItem value="hasAttachments" className="text-xs">Has Attachments</SelectItem>
                      <SelectItem value="importance" className="text-xs">Importance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ruleOperator} onValueChange={(v) => v && setRuleOperator(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="contains" className="text-xs">contains</SelectItem>
                      <SelectItem value="notContains" className="text-xs">does not contain</SelectItem>
                      <SelectItem value="equals" className="text-xs">equals</SelectItem>
                      <SelectItem value="beginsWith" className="text-xs">begins with</SelectItem>
                      <SelectItem value="endsWith" className="text-xs">ends with</SelectItem>
                      <SelectItem value="matches" className="text-xs">matches regex</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addRuleCondition}
                    disabled={!ruleValue.trim()}
                    className="h-7 border-[#2a2e37] text-[#e2e8f0]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {ruleConditions.length > 0 && (
                  <div className="space-y-1">
                    {ruleConditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-[#94a3b8] bg-[#0f1115] rounded px-2 py-1">
                        <span className="text-[#3b82f6]">{cond.field}</span>
                        <span>{cond.operator}</span>
                        <span className="text-[#e2e8f0]">"{cond.value}"</span>
                        <button onClick={() => removeRuleCondition(idx)} className="ml-auto text-[#64748b] hover:text-rose-400">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="space-y-2">
                <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider">Action</p>
                <div className="flex items-center gap-2">
                  <Select value={ruleAction} onValueChange={(v) => v && setRuleAction(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="move_to_folder" className="text-xs">Move to folder</SelectItem>
                      <SelectItem value="copy_to_folder" className="text-xs">Copy to folder</SelectItem>
                      <SelectItem value="delete" className="text-xs">Delete</SelectItem>
                      <SelectItem value="mark_read" className="text-xs">Mark as read</SelectItem>
                      <SelectItem value="mark_as_important" className="text-xs">Mark as important</SelectItem>
                      <SelectItem value="forward" className="text-xs">Forward to</SelectItem>
                      <SelectItem value="categorize" className="text-xs">Categorize</SelectItem>
                    </SelectContent>
                  </Select>
                  {(ruleAction === "move_to_folder" || ruleAction === "copy_to_folder" || ruleAction === "forward" || ruleAction === "categorize") && (
                    <Input
                      placeholder={
                        ruleAction === "move_to_folder" || ruleAction === "copy_to_folder"
                          ? "Folder name"
                          : ruleAction === "forward"
                          ? "Email address"
                          : "Category name"
                      }
                      value={ruleTarget}
                      onChange={(e) => setRuleTarget(e.target.value)}
                      className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] flex-1"
                    />
                  )}
                </div>
              </div>

              <Button
                onClick={handleCreateRule}
                disabled={creatingRule}
                size="sm"
                className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white gap-1"
              >
                {creatingRule && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <Plus className="h-3.5 w-3.5" /> Create Rule
              </Button>
            </div>

            {/* Existing Rules */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#e2e8f0]">Existing Rules ({rules.length})</p>
              {rules.length === 0 ? (
                <p className="text-[11px] text-[#64748b]">No rules configured. Create one above or use a template.</p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <motion.div
                      key={rule.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0f1115] border border-[#2a2e37]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex-shrink-0 w-6 h-6 rounded bg-[#0f6cbd]/20 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-[#0f6cbd]">{idx + 1}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#e2e8f0] truncate">{rule.display_name}</p>
                          <p className="text-[10px] text-[#64748b]">
                            Status: <span className={cn(rule.status === "enabled" ? "text-emerald-400" : "text-amber-400")}>{rule.status}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37]">
                          local
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteRule(rule.id)}
                          className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== SIGNATURES TAB ==================== */}
        {activeTab === "signatures" && (
          <div className="space-y-4">
            {/* Signature List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-[#e2e8f0]">Your Signatures</p>
                <Button size="sm" variant="outline" onClick={handleCreateSignature} className="h-7 text-[11px] border-[#2a2e37] text-[#e2e8f0] gap-1">
                  <Plus className="h-3.5 w-3.5" /> New
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {signatures.map((sig) => (
                  <button
                    key={sig.id}
                    onClick={() => setActiveSignatureId(sig.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors",
                      activeSignatureId === sig.id
                        ? "border-[#0f6cbd] bg-[#0f6cbd]/10 text-[#0f6cbd]"
                        : "border-[#2a2e37] bg-[#0f1115] text-[#94a3b8] hover:text-[#e2e8f0]"
                    )}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {sig.name}
                    {sig.isDefault && (
                      <Badge variant="outline" className="text-[9px] bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20">
                        Default
                      </Badge>
                    )}
                    {signatures.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSignature(sig.id);
                        }}
                        className="ml-1 text-[#64748b] hover:text-rose-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Signature Editor */}
            <div className="space-y-3 border border-[#2a2e37] rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Signature name"
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetDefaultSignature(activeSignatureId)}
                  className="h-7 text-[11px] border-[#2a2e37] text-[#e2e8f0]"
                >
                  Set Default
                </Button>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignaturePresets(!showSignaturePresets)}
                  className="flex items-center gap-1 text-[11px] text-[#3b82f6] hover:text-[#60a5fa]"
                >
                  <Sparkles className="h-3 w-3" />
                  {showSignaturePresets ? "Hide Presets" : "Quick Presets"}
                </button>
              </div>
              {showSignaturePresets && (
                <div className="flex gap-2 flex-wrap">
                  {SIGNATURE_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applySignaturePreset(preset)}
                      className="px-3 py-1.5 rounded-lg border border-[#2a2e37] bg-[#0f1115] text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] hover:border-[#3b82f6]/50 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              )}

              {/* HTML Editor */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 py-1 border-b border-[#2a2e37]">
                  <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0] text-[10px] font-bold">B</button>
                  <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0] text-[10px] italic">I</button>
                  <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0] text-[10px] underline">U</button>
                  <div className="h-3 w-px bg-[#2a2e37] mx-1" />
                  <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0] text-[10px]">Link</button>
                  <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0] text-[10px]">Color</button>
                  <div className="flex-1" />
                  <span className="text-[10px] text-[#64748b]">HTML enabled</span>
                </div>
                <textarea
                  value={signatureHtml}
                  onChange={(e) => setSignatureHtml(e.target.value)}
                  placeholder="Enter your HTML signature..."
                  rows={6}
                  className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-3 outline-none focus-visible:ring-1 focus-visible:ring-[#0f6cbd] resize-none font-mono"
                />
              </div>

              {/* Options */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                  <Checkbox checked={signatureForNew} onCheckedChange={(v) => setSignatureForNew(v === true)} className="border-[#475569] data-[state=checked]:bg-[#0f6cbd]" />
                  For new messages
                </label>
                <label className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                  <Checkbox checked={signatureForReply} onCheckedChange={(v) => setSignatureForReply(v === true)} className="border-[#475569] data-[state=checked]:bg-[#0f6cbd]" />
                  For replies/forwards
                </label>
              </div>

              {/* Preview */}
              {signatureHtml && (
                <div className="border border-[#2a2e37] rounded-lg p-3 bg-[#0f1115]">
                  <p className="text-[10px] text-[#64748b] mb-2">Preview</p>
                  <div className="text-xs text-[#e2e8f0]" dangerouslySetInnerHTML={{ __html: signatureHtml }} />
                </div>
              )}

              <Button size="sm" onClick={handleSaveSignature} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
                <Save className="h-3.5 w-3.5" /> Save Signature
              </Button>
            </div>
          </div>
        )}

        {/* ==================== AUTO-REPLY TAB ==================== */}
        {activeTab === "autoReply" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#e2e8f0]">Automatic Replies</p>
                <p className="text-[11px] text-[#64748b]">Send automatic replies when you&apos;re away</p>
              </div>
              <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
            </div>

            {autoReplyEnabled && (
              <div className="space-y-4 border border-[#2a2e37] rounded-lg p-3">
                {/* Schedule */}
                <div className="space-y-2">
                  <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider">Schedule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#94a3b8] block mb-1">Start Date</label>
                      <Input type="date" value={autoReplyStartDate} onChange={(e) => setAutoReplyStartDate(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94a3b8] block mb-1">Start Time</label>
                      <Input type="time" value={autoReplyStartTime} onChange={(e) => setAutoReplyStartTime(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94a3b8] block mb-1">End Date</label>
                      <Input type="date" value={autoReplyEndDate} onChange={(e) => setAutoReplyEndDate(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] h-8" />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#94a3b8] block mb-1">End Time</label>
                      <Input type="time" value={autoReplyEndTime} onChange={(e) => setAutoReplyEndTime(e.target.value)} className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] h-8" />
                    </div>
                  </div>
                </div>

                {/* Internal Message */}
                <div className="space-y-2">
                  <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider">Internal Message</p>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => setAutoReplyHtml(false)}
                      className={cn("text-[10px] px-2 py-1 rounded", !autoReplyHtml ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#94a3b8]")}
                    >
                      Text
                    </button>
                    <button
                      onClick={() => setAutoReplyHtml(true)}
                      className={cn("text-[10px] px-2 py-1 rounded", autoReplyHtml ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#94a3b8]")}
                    >
                      HTML
                    </button>
                  </div>
                  <textarea
                    value={autoReplyMessage}
                    onChange={(e) => setAutoReplyMessage(e.target.value)}
                    placeholder="Enter your auto-reply message for people inside your organization..."
                    rows={4}
                    className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-3 outline-none resize-none"
                  />
                </div>

                {/* External Message */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-[#94a3b8] uppercase tracking-wider">External Message</p>
                    <label className="flex items-center gap-2 text-[11px] text-[#94a3b8]">
                      <Checkbox checked={autoReplyExternal} onCheckedChange={(v) => setAutoReplyExternal(v === true)} className="border-[#475569] data-[state=checked]:bg-[#0f6cbd]" />
                      Send to external senders
                    </label>
                  </div>
                  {autoReplyExternal && (
                    <textarea
                      value={autoReplyExternalMessage}
                      onChange={(e) => setAutoReplyExternalMessage(e.target.value)}
                      placeholder="Enter your auto-reply message for people outside your organization..."
                      rows={3}
                      className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-lg text-xs text-[#e2e8f0] p-3 outline-none resize-none"
                    />
                  )}
                </div>

                {/* Preview */}
                {autoReplyMessage && (
                  <div className="border border-[#2a2e37] rounded-lg p-3 bg-[#0f1115]">
                    <p className="text-[10px] text-[#64748b] mb-2">Preview</p>
                    <div className="text-xs text-[#e2e8f0]">
                      {autoReplyHtml ? (
                        <div dangerouslySetInnerHTML={{ __html: autoReplyMessage }} />
                      ) : (
                        <p className="whitespace-pre-wrap">{autoReplyMessage}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== APPEARANCE TAB ==================== */}
        {activeTab === "appearance" && (
          <div className="space-y-4">
            <SettingsSection title="Theme" icon={Sun}>
              <div className="space-y-3">
                <SettingRow label="Dark Mode" description="Use dark theme for Outlook">
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </SettingRow>
                <SettingRow label="Compact Mode" description="Reduce spacing and padding">
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </SettingRow>
                <SettingRow label="Show Preview Pane" description="Show the reading pane on the right">
                  <Switch checked={showPreviewPane} onCheckedChange={setShowPreviewPane} />
                </SettingRow>
              </div>
            </SettingsSection>

            <SettingsSection title="Density" icon={LayoutList}>
              <div className="space-y-3">
                <SettingRow label="List Density" description="How compact the message list appears">
                  <Select value={density} onValueChange={(v) => v && setDensity(v as "compact" | "medium" | "cozy")}>
                    <SelectTrigger className="w-28 h-7 text-[11px] bg-[#0f1115] border-[#2a2e37]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="compact" className="text-xs">Compact</SelectItem>
                      <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                      <SelectItem value="cozy" className="text-xs">Cozy</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </div>
            </SettingsSection>

            <SettingsSection title="Accent Color" icon={Palette}>
              <div className="space-y-2">
                <p className="text-[11px] text-[#94a3b8]">Primary color theme</p>
                <div className="flex gap-2">
                  {["#0f6cbd", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#6366f1"].map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-transform",
                        accentColor === color ? "ring-2 ring-white scale-110" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </SettingsSection>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="border-t border-[#2a2e37] pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
            Close
          </Button>
          <Button size="sm" onClick={handleSaveSettings} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white gap-1">
            <Save className="h-3.5 w-3.5" /> Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[#0f6cbd]" />
        <p className="text-xs font-semibold text-[#e2e8f0]">{title}</p>
      </div>
      <div className="pl-6 space-y-2">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-xs font-medium text-[#e2e8f0]">{label}</p>
        <p className="text-[11px] text-[#64748b]">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}
