"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns";
import { toast } from "sonner";
import {
  Token,
  GraphMessage,
  MailFolder,
  Rule,
  GraphUser,
} from "@/types/token";
import {
  fetchTokens,
  fetchInbox,
  fetchMailFolders,
  fetchFolderMessages,
  deleteMessage,
  sendMail,
  markMessageRead,
  fetchContacts,
  fetchGraphMe,
  fetchRules,
  createRule,
  deleteRule,
  createFolder,
  fetchLocalFolders,
  createLocalFolder,
  deleteLocalFolder,
  fetchLocalFolderMessages,
  runAutoFilter,
} from "@/lib/api";
import { fileToBase64, cn } from "@/lib/utils";
import CalendarView from "@/components/calendar/calendar-view";

import {
  Inbox,
  Send,
  Trash2,
  FileText,
  ShieldAlert,
  Archive,
  PenLine,
  Loader2,
  Search,
  Paperclip,
  Star,
  Reply,
  ReplyAll,
  Forward,
  Flag,
  X,
  Check,
  Brain,
  Sparkles,
  Mail,
  MailMinus,
  MailOpen,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Clock,
  User,
  Calendar,
  CheckSquare,
  Square,
  Settings,
  FolderPlus,
  Pin,
  PinOff,
  AlertCircle,
  ArrowLeft,
  Menu,
  Minimize2,
  Maximize2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Printer,
  Download,
  Move,
  Copy,
  Edit3,
  Trash,
  RotateCcw,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Bell,
  BellOff,
  Share2,
  Users,
  LayoutList,
  BookOpen,
  HelpCircle,
  LogOut,
  Plus,
  Minus,
  Circle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Hash,
  Clock3,
  BarChart3,
  FileSearch,
  SendHorizontal,
  CornerUpLeft,
  CornerUpRight,
  ExternalLink,
  Globe,
  Lock,
  Unlock,
  Zap,
  Wand2,
  Scissors,
  ClipboardCopy,
  ClipboardPaste,
  Undo,
  Redo,
  Strikethrough,
  Subscript,
  Superscript,
  Quote,
  Code,
  Table,
  Indent,
  Outdent,
  Eraser,
  Paintbrush,
  Highlighter,
  Text,
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  ListChecks,
  FileDown,
  FileUp,
  FolderOpen,
  FolderClosed,
  Folder,
  Folders,
  FolderTree,
  FolderSync,
  FolderLock,
  FolderHeart,
  FolderArchive,
  FolderCog,
  FolderX,
  FolderCheck,
  FolderMinus,
  FolderGit,
  FolderKanban,
  FolderKey,
  FolderOutput,
  FolderPen,
  FolderRoot,
  FolderSearch,
  FolderSymlink,
  FolderUp,
  FolderClock,
  Home,
  Building,
  Briefcase,
  Building2,
  Landmark,
  Store,
  Factory,
  Warehouse,
  Hospital,
  School,
  Church,
  Hotel,
  Castle,
  TreePine,
  TreeDeciduous,
  Palmtree,
  Sprout,
  Flower,
  Leaf,
  Mountain,
  MountainSnow,
  Flame,
  Droplets,
  Waves,
  Wind,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudSun,
  CloudMoon,
  CloudFog,
  SunDim,
  MoonStar,
  Thermometer,
  Snowflake,
  Umbrella,
  Rainbow,
  Tornado,
  Haze,
  Sunrise,
  Sunset,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  ChevronsUp,
  ChevronsDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronsLeftRight,
  ArrowUpDown,
  ArrowLeftRight,
  Shuffle,
  Repeat,
  Repeat1,
  Repeat2,
  RefreshCw,
  RefreshCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  FlipHorizontal2,
  FlipVertical2,
  Expand,
  Shrink,
  Maximize,
  Minimize,
  MoveHorizontal,
  MoveVertical,
  MoveDiagonal,
  MoveDiagonal2,
  Target,
  Crosshair,
  Scan,
  ScanLine,
  ScanFace,
  ScanEye,
  ScanBarcode,
  QrCode,
  Barcode,
  Fingerprint,
  Footprints,
  Glasses,
  Watch,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Speaker,
  Headphones,
  Camera,
  CameraOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  PhoneCall,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Voicemail,
  Mail as MailIcon,
  MailCheck,
  MailQuestion,
  MailWarning,
  MailX,
  MailSearch,
  MailPlus,
  MailSearch as MailScanSearch,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ==========================================
// TYPES
// ==========================================

type ViewMode = "mail" | "calendar" | "people" | "todo";
type SortOption = "date" | "from" | "size" | "importance" | "subject";
type SortDirection = "asc" | "desc";
type FilterOption = "all" | "unread" | "flagged" | "hasAttachments" | "from" | "to" | "subject" | "date";

interface ComposePayload {
  subject: string;
  body: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  content_type?: string;
  attachments?: { name: string; content_type: string; content_bytes: string }[];
}

interface LocalFolder {
  id: string;
  name: string;
}

interface EmailGroup {
  label: string;
  messages: GraphMessage[];
}

// ==========================================
// CONSTANTS
// ==========================================

const WELL_KNOWN_ORDER = [
  "inbox",
  "drafts",
  "sentitems",
  "deleteditems",
  "archive",
  "junkemail",
  "outbox",
  "conversationhistory",
];

const FOLDER_ICON_MAP: Record<string, React.ElementType> = {
  inbox: Inbox,
  drafts: FileText,
  sentitems: Send,
  deleteditems: Trash2,
  junkemail: ShieldAlert,
  archive: Archive,
  outbox: Clock,
  conversationhistory: MessageSquare,
};

const FOLDER_COLOR_MAP: Record<string, string> = {
  inbox: "text-blue-400",
  drafts: "text-amber-400",
  sentitems: "text-emerald-400",
  deleteditems: "text-rose-400",
  junkemail: "text-amber-400",
  archive: "text-violet-400",
  outbox: "text-cyan-400",
  conversationhistory: "text-pink-400",
};

const FOLDER_LABEL_MAP: Record<string, string> = {
  inbox: "Inbox",
  drafts: "Drafts",
  sentitems: "Sent Items",
  deleteditems: "Deleted Items",
  junkemail: "Junk Email",
  archive: "Archive",
  outbox: "Outbox",
  conversationhistory: "Conversation History",
};

// ==========================================
// UTILS
// ==========================================

function getInitials(name?: string, address?: string): string {
  const str = name || address || "?";
  const parts = str.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return str[0].toUpperCase();
}

function formatOutlookDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return format(date, "h:mm a");
  } else if (isYesterday(date)) {
    return "Yesterday";
  } else if (date > subDays(new Date(), 7)) {
    return format(date, "EEE");
  } else {
    return format(date, "MMM d");
  }
}

function groupMessagesByDate(messages: GraphMessage[]): EmailGroup[] {
  const groups: EmailGroup[] = [];
  const today: GraphMessage[] = [];
  const yesterday: GraphMessage[] = [];
  const thisWeek: GraphMessage[] = [];
  const earlier: GraphMessage[] = [];

  for (const msg of messages) {
    const date = new Date(msg.receivedDateTime);
    if (isToday(date)) {
      today.push(msg);
    } else if (isYesterday(date)) {
      yesterday.push(msg);
    } else if (date > subDays(new Date(), 7)) {
      thisWeek.push(msg);
    } else {
      earlier.push(msg);
    }
  }

  if (today.length > 0) groups.push({ label: "Today", messages: today });
  if (yesterday.length > 0) groups.push({ label: "Yesterday", messages: yesterday });
  if (thisWeek.length > 0) groups.push({ label: "Earlier this week", messages: thisWeek });
  if (earlier.length > 0) groups.push({ label: "Earlier", messages: earlier });

  return groups;
}

function generateAvatarColor(name?: string): string {
  const colors = [
    "bg-red-500/20 text-red-400",
    "bg-orange-500/20 text-orange-400",
    "bg-amber-500/20 text-amber-400",
    "bg-green-500/20 text-green-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-teal-500/20 text-teal-400",
    "bg-cyan-500/20 text-cyan-400",
    "bg-sky-500/20 text-sky-400",
    "bg-blue-500/20 text-blue-400",
    "bg-indigo-500/20 text-indigo-400",
    "bg-violet-500/20 text-violet-400",
    "bg-purple-500/20 text-purple-400",
    "bg-fuchsia-500/20 text-fuchsia-400",
    "bg-pink-500/20 text-pink-400",
    "bg-rose-500/20 text-rose-400",
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// ==========================================
// COMPONENTS
// ==========================================

// ---- Left Navigation Sidebar ----
function OutlookSidebar({
  folders,
  localFolders,
  activeFolder,
  activeFolderIsLocal,
  onSelectFolder,
  onSelectLocalFolder,
  onCreateLocalFolder,
  onDeleteLocalFolder,
  onCompose,
  onNavigate,
  currentView,
  expandedSections,
  onToggleSection,
  onOpenSettings,
  unreadCount,
  userInfo,
}: {
  folders: MailFolder[];
  localFolders: LocalFolder[];
  activeFolder: string;
  activeFolderIsLocal: boolean;
  onSelectFolder: (id: string) => void;
  onSelectLocalFolder: (id: string) => void;
  onCreateLocalFolder: () => void;
  onDeleteLocalFolder: (id: string) => void;
  onCompose: () => void;
  onNavigate: (view: ViewMode) => void;
  currentView: ViewMode;
  expandedSections: Record<string, boolean>;
  onToggleSection: (section: string) => void;
  onOpenSettings: () => void;
  unreadCount: number;
  userInfo: GraphUser | null;
}) {
  const sortedFolders = useMemo(() => {
    const sorted: MailFolder[] = [];
    for (const wk of WELL_KNOWN_ORDER) {
      const f = folders.find((x) => x.wellKnownName === wk);
      if (f) sorted.push(f);
    }
    for (const f of folders) {
      if (!sorted.find((x) => x.id === f.id)) sorted.push(f);
    }
    return sorted;
  }, [folders]);

  const otherFolders = useMemo(() => {
    return sortedFolders.filter((f) => !WELL_KNOWN_ORDER.includes(f.wellKnownName || ""));
  }, [sortedFolders]);

  const wellKnownFolders = useMemo(() => {
    return sortedFolders.filter((f) => WELL_KNOWN_ORDER.includes(f.wellKnownName || ""));
  }, [sortedFolders]);

  return (
    <div className="w-[230px] flex-shrink-0 bg-[#0f1115] border-r border-[#2a2e37] flex flex-col h-full">
      {/* New Mail Button */}
      <div className="p-3">
        <Button
          onClick={onCompose}
          className="w-full gap-2 justify-center bg-[#0f6cbd] hover:bg-[#115ea3] text-white rounded-md shadow-sm transition-colors"
          size="sm"
        >
          <PenLine className="h-4 w-4" />
          <span className="font-semibold">New mail</span>
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-4 space-y-1">
          {/* Nav Sections */}
          <NavItem
            icon={Inbox}
            label="Mail"
            active={currentView === "mail"}
            onClick={() => onNavigate("mail")}
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
          <NavItem
            icon={Calendar}
            label="Calendar"
            active={currentView === "calendar"}
            onClick={() => onNavigate("calendar")}
          />
          <NavItem
            icon={Users}
            label="People"
            active={currentView === "people"}
            onClick={() => onNavigate("people")}
          />
          <NavItem
            icon={CheckSquare}
            label="To Do"
            active={currentView === "todo"}
            onClick={() => onNavigate("todo")}
          />

          <div className="h-px bg-[#2a2e37] my-2" />

          {/* Favorites */}
          <div className="px-2 py-1">
            <button
              onClick={() => onToggleSection("favorites")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider hover:text-[#e2e8f0] transition-colors w-full"
            >
              {expandedSections.favorites ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Favorites
            </button>
          </div>
          {expandedSections.favorites && (
            <div className="space-y-0.5">
              {wellKnownFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isActive={!activeFolderIsLocal && activeFolder === folder.id}
                  onClick={() => { onSelectFolder(folder.id); onNavigate("mail"); }}
                />
              ))}
            </div>
          )}

          {/* Folders */}
          <div className="px-2 py-1">
            <button
              onClick={() => onToggleSection("folders")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider hover:text-[#e2e8f0] transition-colors w-full"
            >
              {expandedSections.folders ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Folders
            </button>
          </div>
          {expandedSections.folders && (
            <div className="space-y-0.5">
              {otherFolders.map((folder) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isActive={!activeFolderIsLocal && activeFolder === folder.id}
                  onClick={() => { onSelectFolder(folder.id); onNavigate("mail"); }}
                />
              ))}
            </div>
          )}

          {/* Local / Starred Folders */}
          <div className="px-2 py-1 flex items-center justify-between">
            <button
              onClick={() => onToggleSection("local")}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider hover:text-[#e2e8f0] transition-colors"
            >
              {expandedSections.local ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Starred
            </button>
            <button
              onClick={onCreateLocalFolder}
              className="text-[11px] text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
              title="New folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {expandedSections.local && (
            <div className="space-y-0.5">
              {localFolders.map((lf) => (
                <div
                  key={lf.id}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                    activeFolderIsLocal && activeFolder === lf.id
                      ? "bg-[#1a3a5c] text-[#3b82f6] font-medium"
                      : "text-[#e2e8f0] hover:bg-[#1a1d24]"
                  )}
                >
                  <button
                    onClick={() => { onSelectLocalFolder(lf.id); onNavigate("mail"); }}
                    className="flex items-center gap-2.5 flex-1 text-left"
                  >
                    <Star className="h-4 w-4 flex-shrink-0 text-amber-400" />
                    <span className="truncate">{lf.name}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLocalFolder(lf.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-rose-500/20 text-[#94a3b8] hover:text-rose-400 transition-opacity"
                    title="Delete folder"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {localFolders.length === 0 && (
                <p className="text-[10px] text-[#64748b] px-3 py-1">No starred folders</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom: User + Settings */}
      <div className="p-2 border-t border-[#2a2e37]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#1a1d24] transition-colors cursor-pointer">
          <div className="h-7 w-7 rounded-full bg-[#0f6cbd]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-[#3b82f6]">
              {getInitials(userInfo?.displayName, userInfo?.mail)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-[#e2e8f0] truncate">
              {userInfo?.displayName || userInfo?.mail || "User"}
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="p-1 rounded hover:bg-[#1a1d24] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs transition-colors",
        active
          ? "bg-[#1a3a5c] text-[#3b82f6] font-medium"
          : "text-[#e2e8f0] hover:bg-[#1a1d24]"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-[#3b82f6]" : "text-[#94a3b8]")} />
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="text-[10px] font-semibold bg-[#3b82f6]/20 text-[#3b82f6] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function FolderItem({
  folder,
  isActive,
  onClick,
}: {
  folder: MailFolder;
  isActive: boolean;
  onClick: () => void;
}) {
  const wk = folder.wellKnownName || "";
  const Icon = FOLDER_ICON_MAP[wk] || Folder;
  const iconColor = FOLDER_COLOR_MAP[wk] || "text-[#94a3b8]";
  const label = FOLDER_LABEL_MAP[wk] || folder.displayName;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors",
        isActive
          ? "bg-[#1a3a5c] text-[#3b82f6] font-medium"
          : "text-[#e2e8f0] hover:bg-[#1a1d24]"
      )}
    >
      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-[#3b82f6]" : iconColor)} />
      <span className="flex-1 text-left truncate">{label}</span>
      {folder.unreadItemCount ? (
        <span className="text-[10px] font-semibold bg-[#3b82f6]/20 text-[#3b82f6] px-1.5 py-0.5 rounded-full">
          {folder.unreadItemCount}
        </span>
      ) : null}
    </button>
  );
}

// ---- Command Bar ----
function CommandBar({
  selectedCount,
  onDelete,
  onArchive,
  onReply,
  onReplyAll,
  onForward,
  onMove,
  onMarkRead,
  onMarkUnread,
  onFlag,
  onPin,
  onReport,
  onRecall,
  onResend,
  onShareToTeams,
  onTrackReadReceipts,
  onRules,
  onRefresh,
  refreshing,
  hasSelection,
}: {
  selectedCount: number;
  onDelete: () => void;
  onArchive: () => void;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onMove: () => void;
  onMarkRead: () => void;
  onMarkUnread: () => void;
  onFlag: () => void;
  onPin: () => void;
  onReport: () => void;
  onRecall: () => void;
  onResend: () => void;
  onShareToTeams: () => void;
  onTrackReadReceipts: () => void;
  onRules: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  hasSelection: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[#2a2e37] bg-[#0f1115]/80 backdrop-blur-sm flex-shrink-0 overflow-x-auto">
      <TooltipProvider delay={200}>
        <CmdBtn icon={Trash2} label="Delete" onClick={onDelete} disabled={!hasSelection} danger />
        <CmdBtn icon={Archive} label="Archive" onClick={onArchive} disabled={!hasSelection} />
        <CmdBtn icon={AlertCircle} label="Report" onClick={onReport} disabled={!hasSelection} />
        <div className="h-4 w-px bg-[#2a2e37] mx-1" />
        <CmdBtn icon={Reply} label="Reply" onClick={onReply} disabled={!hasSelection} />
        <CmdBtn icon={ReplyAll} label="Reply all" onClick={onReplyAll} disabled={!hasSelection} />
        <CmdBtn icon={Forward} label="Forward" onClick={onForward} disabled={!hasSelection} />
        <CmdBtn icon={Calendar} label="Meeting" onClick={() => {}} disabled={!hasSelection} />
        <div className="h-4 w-px bg-[#2a2e37] mx-1" />
        <CmdBtn icon={RotateCcw} label="Recall" onClick={onRecall} disabled={!hasSelection} />
        <CmdBtn icon={RefreshCw} label="Resend" onClick={onResend} disabled={!hasSelection} />
        <CmdBtn icon={Share2} label="Teams" onClick={onShareToTeams} disabled={!hasSelection} />
        <CmdBtn icon={Eye} label="Track" onClick={onTrackReadReceipts} disabled={!hasSelection} />
        <div className="h-4 w-px bg-[#2a2e37] mx-1" />
        <CmdBtn icon={Move} label="Move" onClick={onMove} disabled={!hasSelection} />
        <CmdBtn icon={Flag} label="Flag" onClick={onFlag} disabled={!hasSelection} />
        <CmdBtn icon={Pin} label="Pin" onClick={onPin} disabled={!hasSelection} />
        <div className="h-4 w-px bg-[#2a2e37] mx-1" />
        <CmdBtn icon={MailOpen} label="Read" onClick={onMarkRead} disabled={!hasSelection} />
        <CmdBtn icon={MailMinus} label="Unread" onClick={onMarkUnread} disabled={!hasSelection} />
        <div className="h-4 w-px bg-[#2a2e37] mx-1" />
        <CmdBtn icon={Shuffle} label="Rules" onClick={onRules} />
        <div className="flex-1" />
        <CmdBtn icon={refreshing ? Loader2 : RefreshCw} label="Refresh" onClick={onRefresh} spinning={refreshing} />
      </TooltipProvider>
    </div>
  );
}

function CmdBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
  spinning,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  spinning?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-colors",
            disabled
              ? "text-[#475569] cursor-not-allowed"
              : danger
              ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              : "text-[#e2e8f0] hover:bg-[#1a1d24] hover:text-white"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
          <span className="hidden lg:inline">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px]">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// ---- Search Bar ----
function SearchBar({
  value,
  onChange,
  onFilter,
  activeFilter,
}: {
  value: string;
  onChange: (v: string) => void;
  onFilter: (f: FilterOption) => void;
  activeFilter: FilterOption;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2a2e37] bg-[#0f1115]/80 backdrop-blur-sm flex-shrink-0">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
        <Input
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-9 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0] placeholder:text-[#64748b] focus-visible:ring-[#3b82f6] focus-visible:ring-1"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <DropdownMenu>
          <DropdownMenuTrigger>
          <Button variant="ghost" size="sm" className="h-8 text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1d24] gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            <span className="capitalize">{activeFilter === "all" ? "All" : activeFilter}</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-[#1a1d24] border-[#2a2e37]">
          <DropdownMenuLabel className="text-[11px] text-[#94a3b8]">Filter by</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-[#2a2e37]" />
          <DropdownMenuCheckboxItem checked={activeFilter === "all"} onCheckedChange={() => onFilter("all")} className="text-[11px] text-[#e2e8f0]">
            All
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "unread"} onCheckedChange={() => onFilter("unread")} className="text-[11px] text-[#e2e8f0]">
            Unread
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "flagged"} onCheckedChange={() => onFilter("flagged")} className="text-[11px] text-[#e2e8f0]">
            Flagged
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "hasAttachments"} onCheckedChange={() => onFilter("hasAttachments")} className="text-[11px] text-[#e2e8f0]">
            Has attachments
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "from"} onCheckedChange={() => onFilter("from")} className="text-[11px] text-[#e2e8f0]">
            From
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "subject"} onCheckedChange={() => onFilter("subject")} className="text-[11px] text-[#e2e8f0]">
            Subject
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={activeFilter === "date"} onCheckedChange={() => onFilter("date")} className="text-[11px] text-[#e2e8f0]">
            Date range
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ---- Message List ----
function MessageList({
  messages,
  selectedMessageId,
  onSelectMessage,
  loading,
  sortField,
  sortDirection,
  onSort,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  flaggedIds,
  pinnedIds,
  onToggleFlag,
  onTogglePin,
}: {
  messages: GraphMessage[];
  selectedMessageId: string | null;
  onSelectMessage: (msg: GraphMessage) => void;
  loading: boolean;
  sortField: SortOption;
  sortDirection: SortDirection;
  onSort: (field: SortOption) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  flaggedIds: Set<string>;
  pinnedIds: Set<string>;
  onToggleFlag: (id: string) => void;
  onTogglePin: (id: string) => void;
}) {
  const groups = useMemo(() => groupMessagesByDate(messages), [messages]);

  const allIds = useMemo(() => messages.map((m) => m.id), [messages]);

  const SortIcon = sortDirection === "asc" ? SortAsc : SortDesc;

  return (
    <div className="w-[380px] flex-shrink-0 border-r border-[#2a2e37] flex flex-col bg-[#0f1115] h-full">
      {/* Sort / Select Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#2a2e37] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedIds.size > 0 && selectedIds.size === allIds.length}
            onCheckedChange={() => {
              if (selectedIds.size === allIds.length) {
                onSelectAll([]);
              } else {
                onSelectAll(allIds);
              }
            }}
            className="border-[#475569] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6]"
          />
          <span className="text-[11px] text-[#94a3b8]">
            {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${messages.length} messages`}
          </span>
        </div>
        <DropdownMenu>
        <DropdownMenuTrigger>
            <button className="flex items-center gap-1 text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
              <SortIcon className="h-3.5 w-3.5" />
              <span className="capitalize">{sortField}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#1a1d24] border-[#2a2e37]">
            <DropdownMenuLabel className="text-[11px] text-[#94a3b8]">Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2a2e37]" />
            {(["date", "from", "size", "importance", "subject"] as SortOption[]).map((field) => (
              <DropdownMenuItem
                key={field}
                onClick={() => onSort(field)}
                className={cn(
                  "text-[11px] capitalize",
                  sortField === field ? "text-[#3b82f6] font-medium" : "text-[#e2e8f0]"
                )}
              >
                {field}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-[#64748b]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <MailIcon className="h-8 w-8 text-[#475569] mb-2" />
            <p className="text-xs text-[#64748b]">No messages found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1a1d24]">
            <AnimatePresence>
              {groups.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 bg-[#0f1115] z-10 px-3 py-1 text-[10px] font-semibold text-[#64748b] uppercase tracking-wider border-b border-[#1a1d24]">
                    {group.label}
                  </div>
                  {group.messages.map((msg, i) => {
                    const isSelected = msg.id === selectedMessageId;
                    const isRead = !!msg.isRead;
                    const from = msg.from?.emailAddress;
                    const initials = getInitials(from?.name, from?.address);
                    const isFlagged = flaggedIds.has(msg.id);
                    const isPinned = pinnedIds.has(msg.id);
                    const isSelectedMulti = selectedIds.has(msg.id);
                    const avatarColor = generateAvatarColor(from?.name || from?.address);

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        onClick={() => onSelectMessage(msg)}
                        className={cn(
                          "group px-3 py-2.5 cursor-pointer transition-colors border-l-[3px]",
                          isSelected
                            ? "bg-[#1a3a5c]/30 border-l-[#3b82f6]"
                            : "border-l-transparent hover:bg-[#1a1d24]"
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          {/* Checkbox */}
                          <div className="pt-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelectedMulti}
                              onCheckedChange={() => onToggleSelect(msg.id)}
                              className="border-[#475569] data-[state=checked]:bg-[#3b82f6] data-[state=checked]:border-[#3b82f6]"
                            />
                          </div>

                          {/* Avatar */}
                          <div
                            className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold",
                              !isRead ? avatarColor : "bg-[#1a1d24] text-[#64748b]"
                            )}
                          >
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className={cn(
                                  "text-xs truncate",
                                  !isRead ? "font-semibold text-[#e2e8f0]" : "text-[#94a3b8]"
                                )}
                              >
                                {from?.name || from?.address || "Unknown"}
                              </p>
                              <span className="text-[10px] text-[#64748b] flex-shrink-0 tabular-nums">
                                {formatOutlookDate(msg.receivedDateTime)}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-xs truncate mt-0.5",
                                !isRead ? "font-medium text-[#e2e8f0]" : "text-[#94a3b8]/70"
                              )}
                            >
                              {msg.subject || "(No subject)"}
                            </p>
                            <p className="text-[10px] text-[#64748b] truncate mt-0.5">
                              {msg.bodyPreview}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {msg.hasAttachments && (
                                <Paperclip className="h-3 w-3 text-[#64748b]" />
                              )}
                              {!isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
                              )}
                              <div className="flex-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleFlag(msg.id);
                                }}
                                className={cn(
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  isFlagged ? "opacity-100 text-amber-400" : "text-[#64748b] hover:text-amber-400"
                                )}
                              >
                                <Flag className={cn("h-3 w-3", isFlagged && "fill-amber-400")} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(msg.id);
                                }}
                                className={cn(
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  isPinned ? "opacity-100 text-[#3b82f6]" : "text-[#64748b] hover:text-[#3b82f6]"
                                )}
                              >
                                <Pin className={cn("h-3 w-3", isPinned && "fill-[#3b82f6]")} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onToggleSelect(msg.id);
                                }}
                                className={cn(
                                  "opacity-0 group-hover:opacity-100 transition-opacity",
                                  isSelectedMulti ? "text-[#3b82f6] opacity-100" : "text-[#64748b]"
                                )}
                              >
                                <Star className={cn("h-3 w-3", isSelectedMulti && "fill-[#3b82f6]")} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Reading Pane ----
function ReadingPane({
  message,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onFlag,
  onPin,
  onMove,
  onMarkUnread,
  onSummarize,
  onAnalyze,
  summarizing,
  summary,
  isFlagged,
  isPinned,
  onToggleFlag,
  onTogglePin,
}: {
  message: GraphMessage | null;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
  onDelete: () => void;
  onArchive: () => void;
  onFlag: () => void;
  onPin: () => void;
  onMove: () => void;
  onMarkUnread: () => void;
  onSummarize: () => void;
  onAnalyze: () => void;
  summarizing: boolean;
  summary: string | null;
  isFlagged: boolean;
  isPinned: boolean;
  onToggleFlag: () => void;
  onTogglePin: () => void;
}) {
  if (!message) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f1115]/50">
        <div className="text-center space-y-3">
          <MailIcon className="h-12 w-12 text-[#2a2e37] mx-auto" />
          <p className="text-sm text-[#64748b]">Select an item to read</p>
        </div>
      </div>
    );
  }

  const from = message.from?.emailAddress;
  const contentType = message.body?.contentType || "text";
  const bodyContent = message.body?.content || message.bodyPreview || "";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]/50">
      {/* Reading Pane Command Bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#2a2e37] bg-[#0f1115]/80 backdrop-blur-sm flex-shrink-0 overflow-x-auto">
<TooltipProvider delay={200}>
          <CmdBtn icon={Reply} label="Reply" onClick={onReply} />
          <CmdBtn icon={ReplyAll} label="Reply all" onClick={onReplyAll} />
          <CmdBtn icon={Forward} label="Forward" onClick={onForward} />
          <div className="h-4 w-px bg-[#2a2e37] mx-1" />
          <CmdBtn icon={Trash2} label="Delete" onClick={onDelete} danger />
          <CmdBtn icon={Archive} label="Archive" onClick={onArchive} />
          <CmdBtn icon={Move} label="Move" onClick={onMove} />
          <CmdBtn icon={MailMinus} label="Unread" onClick={onMarkUnread} />
          <CmdBtn icon={Printer} label="Print" onClick={() => window.print()} />
          <div className="h-4 w-px bg-[#2a2e37] mx-1" />
          <CmdBtn
            icon={Flag}
            label={isFlagged ? "Unflag" : "Flag"}
            onClick={onToggleFlag}
          />
          <CmdBtn
            icon={Pin}
            label={isPinned ? "Unpin" : "Pin"}
            onClick={onTogglePin}
          />
          <div className="flex-1" />
          <CmdBtn icon={Sparkles} label="Summarize" onClick={onSummarize} spinning={summarizing} />
          <CmdBtn icon={Brain} label="Analyze" onClick={onAnalyze} />
        </TooltipProvider>
      </div>

      {/* AI Summary */}
      <AnimatePresence>
        {summary && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex-shrink-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[11px] font-semibold text-amber-400 uppercase">AI Summary</p>
              <button onClick={onSummarize} className="ml-auto text-[#64748b] hover:text-[#e2e8f0]">
                <X className="h-3 w-3" />
              </button>
            </div>
            <p className="text-xs text-[#e2e8f0]/80 leading-relaxed">{summary}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Header */}
      <div className="px-5 py-4 border-b border-[#2a2e37] flex-shrink-0">
        <div className="flex items-start gap-1 mb-3">
          {isFlagged && <Flag className="h-4 w-4 text-amber-400 fill-amber-400 flex-shrink-0 mt-0.5" />}
          {isPinned && <Pin className="h-4 w-4 text-[#3b82f6] fill-[#3b82f6] flex-shrink-0 mt-0.5" />}
          <h2 className="text-sm font-semibold text-[#e2e8f0] leading-snug">
            {message.subject || "(No subject)"}
          </h2>
        </div>
        <div className="flex items-start gap-3">
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold", generateAvatarColor(from?.name || from?.address))}>
            {getInitials(from?.name, from?.address)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#e2e8f0]">
                  {from?.name || from?.address || "Unknown"}
                </p>
                <p className="text-xs text-[#64748b]">&lt;{from?.address || "unknown"}&gt;</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {message.toRecipients && message.toRecipients.length > 0 && (
                    <span className="text-[10px] text-[#64748b]">
                      To: {message.toRecipients.map((r) => r.emailAddress?.name || r.emailAddress?.address).filter(Boolean).join(", ")}
                    </span>
                  )}
                  {(message as any).ccRecipients && (message as any).ccRecipients.length > 0 && (
                    <span className="text-[10px] text-[#64748b]">
                      Cc: {(message as any).ccRecipients.map((r: any) => r.emailAddress?.name || r.emailAddress?.address).filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-[#94a3b8]">
                  {format(new Date(message.receivedDateTime), "EEE, MMM d, yyyy")}
                </p>
                <p className="text-[10px] text-[#64748b]">
                  {format(new Date(message.receivedDateTime), "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[10px] text-[#94a3b8] bg-[#1a1d24] px-2 py-0.5 rounded">To me</span>
              {message.hasAttachments && (
                <span className="text-[10px] text-[#94a3b8] bg-[#1a1d24] px-2 py-0.5 rounded flex items-center gap-1">
                  <Paperclip className="h-3 w-3" /> Attachments
                </span>
              )}
              {isFlagged && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                  <Flag className="h-3 w-3" /> Flagged
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <ScrollArea className="flex-1">
        <div className="px-5 py-5">
          <div className="max-w-3xl mx-auto">
            {contentType === "html" ? (
              <div
                className="prose prose-invert prose-sm max-w-none
                  [&_a]:text-[#3b82f6] [&_a]:underline [&_img]:rounded-lg [&_img]:max-w-full
                  [&_table]:w-full [&_table]:border-collapse
                  [&_td]:border [&_td]:border-[#2a2e37] [&_td]:p-2 [&_td]:text-xs
                  [&_th]:border [&_th]:border-[#2a2e37] [&_th]:p-2 [&_th]:text-xs
                  [&_blockquote]:border-l-2 [&_blockquote]:border-[#3b82f6]/30 [&_blockquote]:pl-3 [&_blockquote]:text-[#94a3b8]
                  [&_pre]:bg-[#1a1d24] [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:text-xs
                  [&_code]:bg-[#1a1d24] [&_code]:rounded [&_code]:px-1 [&_code]:text-xs
                  [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4
                  [&_li]:text-xs [&_li]:text-[#e2e8f0]/80
                  [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm
                  [&_p]:text-xs [&_p]:text-[#e2e8f0]/80 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: bodyContent }}
              />
            ) : (
              <div
                className="text-xs text-[#e2e8f0]/80 leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: bodyContent
                    .replace(/\n/g, "<br>")
                    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" class="text-[#3b82f6] underline" target="_blank" rel="noopener noreferrer">$1</a>'),
                }}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

// ---- Compose Dialog ----
function ComposeDialog({
  open,
  onOpenChange,
  to,
  cc,
  bcc,
  subject,
  body,
  contentType,
  attachments,
  onToChange,
  onCcChange,
  onBccChange,
  onSubjectChange,
  onBodyChange,
  onContentTypeChange,
  onAddAttachments,
  onRemoveAttachment,
  onSend,
  onSaveDraft,
  onDiscard,
  sending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  contentType: "HTML" | "Text";
  attachments: File[];
  onToChange: (v: string) => void;
  onCcChange: (v: string) => void;
  onBccChange: (v: string) => void;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  onContentTypeChange: (v: "HTML" | "Text") => void;
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (idx: number) => void;
  onSend: () => void;
  onSaveDraft: () => void;
  onDiscard: () => void;
  sending: boolean;
}) {
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-[#2a2e37]">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-sm font-semibold">New message</DialogTitle>
            <div className="flex items-center gap-1">
              <button onClick={() => onOpenChange(false)} className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8]">
                <Minimize2 className="h-4 w-4" />
              </button>
              <button onClick={() => onOpenChange(false)} className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8]">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button onClick={onDiscard} className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {/* To */}
          <div className="flex items-center gap-2 border-b border-[#2a2e37] pb-2">
            <span className="text-[11px] text-[#94a3b8] w-10 text-right">To</span>
            <Input
              value={to}
              onChange={(e) => onToChange(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 bg-transparent border-0 text-xs px-0 text-[#e2e8f0] placeholder:text-[#64748b] focus-visible:ring-0"
              autoComplete="off"
            />
            <div className="flex items-center gap-1 text-[10px] text-[#3b82f6]">
              {!showCc && (
                <button onClick={() => setShowCc(true)} className="hover:underline">Cc</button>
              )}
              {!showBcc && (
                <button onClick={() => setShowBcc(true)} className="hover:underline">Bcc</button>
              )}
            </div>
          </div>

          {/* Cc */}
          {showCc && (
            <div className="flex items-center gap-2 border-b border-[#2a2e37] pb-2">
              <span className="text-[11px] text-[#94a3b8] w-10 text-right">Cc</span>
              <Input
                value={cc}
                onChange={(e) => onCcChange(e.target.value)}
                placeholder="cc@example.com"
                className="flex-1 bg-transparent border-0 text-xs px-0 text-[#e2e8f0] placeholder:text-[#64748b] focus-visible:ring-0"
                autoComplete="off"
              />
              <button onClick={() => setShowCc(false)} className="text-[#94a3b8] hover:text-[#e2e8f0]">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div className="flex items-center gap-2 border-b border-[#2a2e37] pb-2">
              <span className="text-[11px] text-[#94a3b8] w-10 text-right">Bcc</span>
              <Input
                value={bcc}
                onChange={(e) => onBccChange(e.target.value)}
                placeholder="bcc@example.com"
                className="flex-1 bg-transparent border-0 text-xs px-0 text-[#e2e8f0] placeholder:text-[#64748b] focus-visible:ring-0"
                autoComplete="off"
              />
              <button onClick={() => setShowBcc(false)} className="text-[#94a3b8] hover:text-[#e2e8f0]">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2 border-b border-[#2a2e37] pb-2">
            <span className="text-[11px] text-[#94a3b8] w-10 text-right">Subject</span>
            <Input
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Add a subject"
              className="flex-1 bg-transparent border-0 text-xs px-0 text-[#e2e8f0] placeholder:text-[#64748b] focus-visible:ring-0"
              autoComplete="off"
            />
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-0.5 py-1 border-b border-[#2a2e37]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onContentTypeChange("HTML")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded",
                  contentType === "HTML" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                )}
              >
                HTML
              </button>
              <button
                onClick={() => onContentTypeChange("Text")}
                className={cn(
                  "text-[10px] px-2 py-1 rounded",
                  contentType === "Text" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#94a3b8] hover:text-[#e2e8f0]"
                )}
              >
                Text
              </button>
            </div>
            <div className="h-4 w-px bg-[#2a2e37] mx-1" />
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Underline className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Strikethrough className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-[#2a2e37] mx-1" />
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <List className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <ListOrdered className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-[#2a2e37] mx-1" />
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Link className="h-3.5 w-3.5" />
            </button>
            <button className="p-1 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]">
              <Image className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Body */}
          <textarea
            value={body}
            onChange={(e) => onBodyChange(e.target.value)}
            placeholder={contentType === "HTML" ? "Type your HTML message..." : "Type your message..."}
            rows={12}
            className="w-full bg-transparent text-xs text-[#e2e8f0] outline-none resize-none font-mono"
          />

          {/* Attachments */}
          <div className="space-y-2">
            <input
              type="file"
              multiple
              id="compose-attachments"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) onAddAttachments(files);
              }}
            />
            <label
              htmlFor="compose-attachments"
              className="inline-flex items-center gap-1.5 text-[11px] text-[#94a3b8] hover:text-[#e2e8f0] cursor-pointer"
            >
              <Paperclip className="h-3.5 w-3.5" /> Attach files
            </label>
            <p className="text-[10px] text-[#64748b]">Max 4MB per file</p>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {attachments.map((file, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-[10px] gap-1 bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]"
                  >
                    {file.name}
                    <button
                      onClick={() => onRemoveAttachment(idx)}
                      className="hover:text-rose-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-[#2a2e37] pt-3 gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
            Discard
          </Button>
          <Button variant="outline" size="sm" onClick={onSaveDraft} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
            Save draft
          </Button>
          <Button
            size="sm"
            onClick={onSend}
            disabled={sending}
            className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white gap-1.5"
          >
            {sending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <Send className="h-3.5 w-3.5" /> Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---- Settings Panel ----
function SettingsPanel({
  open,
  onOpenChange,
  rules,
  onCreateRule,
  onDeleteRule,
  creatingRule,
  signature,
  onSignatureChange,
  autoReply,
  onAutoReplyChange,
  focusedInbox,
  onFocusedInboxChange,
  darkMode,
  onDarkModeChange,
  tokenId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  rules: Rule[];
  onCreateRule: (payload: {
    ruleName: string;
    condition: { field: string; operator: string; value: string };
    action: { type: string; target?: string };
  }) => void;
  onDeleteRule: (ruleId: string) => void;
  creatingRule: boolean;
  signature: string;
  onSignatureChange: (v: string) => void;
  autoReply: { enabled: boolean; message: string };
  onAutoReplyChange: (v: { enabled: boolean; message: string }) => void;
  focusedInbox: boolean;
  onFocusedInboxChange: (v: boolean) => void;
  darkMode: boolean;
  onDarkModeChange: (v: boolean) => void;
  tokenId: string;
}) {
  const [activeTab, setActiveTab] = useState<"general" | "rules" | "signature" | "autoReply">("general");
  const [newRuleName, setNewRuleName] = useState("");
  const [ruleField, setRuleField] = useState("subject");
  const [ruleOperator, setRuleOperator] = useState("contains");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleAction, setRuleAction] = useState("move_to_folder");
  const [ruleTarget, setRuleTarget] = useState("");

  const handleCreateRule = () => {
    if (!newRuleName.trim() || !ruleValue.trim()) {
      toast.error("Rule name and condition value are required");
      return;
    }
    onCreateRule({
      ruleName: newRuleName.trim(),
      condition: { field: ruleField, operator: ruleOperator, value: ruleValue.trim() },
      action: { type: ruleAction, target: ruleTarget.trim() || undefined },
    });
    setNewRuleName("");
    setRuleValue("");
    setRuleTarget("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">Settings</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-[#2a2e37] mb-4">
          {(["general", "rules", "signature", "autoReply"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab
                  ? "text-[#3b82f6] border-[#3b82f6]"
                  : "text-[#94a3b8] border-transparent hover:text-[#e2e8f0]"
              )}
            >
              {tab === "general" && "General"}
              {tab === "rules" && "Rules"}
              {tab === "signature" && "Signature"}
              {tab === "autoReply" && "Auto-reply"}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-medium text-[#e2e8f0]">Focused Inbox</p>
                <p className="text-[11px] text-[#64748b]">Sort messages into Focused and Other</p>
              </div>
              <Switch checked={focusedInbox} onCheckedChange={onFocusedInboxChange} />
            </div>
            <div className="h-px bg-[#2a2e37]" />
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-xs font-medium text-[#e2e8f0]">Dark mode</p>
                <p className="text-[11px] text-[#64748b]">Use dark theme for Outlook</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={onDarkModeChange} />
            </div>
          </div>
        )}

        {/* Rules Tab */}
        {activeTab === "rules" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#e2e8f0]">Create new rule</p>
              <div className="space-y-2">
                <Input
                  placeholder="Rule name"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]"
                />
                <div className="flex items-center gap-2">
                  <Select value={ruleField} onValueChange={(v) => v && setRuleField(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="subject" className="text-xs text-[#e2e8f0]">Subject</SelectItem>
                      <SelectItem value="sender" className="text-xs text-[#e2e8f0]">Sender</SelectItem>
                      <SelectItem value="body" className="text-xs text-[#e2e8f0]">Body</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ruleOperator} onValueChange={(v) => v && setRuleOperator(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="contains" className="text-xs text-[#e2e8f0]">contains</SelectItem>
                      <SelectItem value="equals" className="text-xs text-[#e2e8f0]">equals</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Value"
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={ruleAction} onValueChange={(v) => v && setRuleAction(v)}>
                    <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                      <SelectItem value="move_to_folder" className="text-xs text-[#e2e8f0]">Move to folder</SelectItem>
                      <SelectItem value="forward" className="text-xs text-[#e2e8f0]">Forward to</SelectItem>
                      <SelectItem value="mark_read" className="text-xs text-[#e2e8f0]">Mark as read</SelectItem>
                      <SelectItem value="delete" className="text-xs text-[#e2e8f0]">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                  {(ruleAction === "move_to_folder" || ruleAction === "forward") && (
                    <Input
                      placeholder={ruleAction === "move_to_folder" ? "Folder name" : "Email address"}
                      value={ruleTarget}
                      onChange={(e) => setRuleTarget(e.target.value)}
                      className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0] flex-1"
                    />
                  )}
                </div>
                <Button
                  onClick={handleCreateRule}
                  disabled={creatingRule}
                  size="sm"
                  className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white"
                >
                  {creatingRule && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                  Create rule
                </Button>
              </div>
            </div>

            <div className="h-px bg-[#2a2e37]" />

            {/* Existing Rules */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#e2e8f0]">Existing rules ({rules.length})</p>
              {rules.length === 0 ? (
                <p className="text-[11px] text-[#64748b]">No rules configured</p>
              ) : (
                <div className="space-y-2">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between p-2 rounded-md bg-[#0f1115] border border-[#2a2e37]"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#e2e8f0] truncate">{rule.display_name}</p>
                        <p className="text-[10px] text-[#64748b]">
                          Status: {rule.status}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteRule(rule.id)}
                        className="h-7 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature Tab */}
        {activeTab === "signature" && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#e2e8f0]">Email signature</p>
            <textarea
              value={signature}
              onChange={(e) => onSignatureChange(e.target.value)}
              placeholder="Enter your email signature..."
              rows={6}
              className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-md text-xs text-[#e2e8f0] p-3 outline-none resize-none"
            />
            <p className="text-[10px] text-[#64748b]">Signature will be appended to all outgoing emails</p>
          </div>
        )}

        {/* Auto-reply Tab */}
        {activeTab === "autoReply" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#e2e8f0]">Automatic replies</p>
                <p className="text-[11px] text-[#64748b]">Send automatic replies when you're away</p>
              </div>
              <Switch
                checked={autoReply.enabled}
                onCheckedChange={(v) => onAutoReplyChange({ ...autoReply, enabled: v })}
              />
            </div>
            {autoReply.enabled && (
              <div className="space-y-2">
                <textarea
                  value={autoReply.message}
                  onChange={(e) => onAutoReplyChange({ ...autoReply, message: e.target.value })}
                  placeholder="Enter your auto-reply message..."
                  rows={4}
                  className="w-full bg-[#0f1115] border border-[#2a2e37] rounded-md text-xs text-[#e2e8f0] p-3 outline-none resize-none"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="border-t border-[#2a2e37] pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN PAGE
// ==========================================

export default function OutlookPage() {
  const params = useParams<{ tokenId: string }>();
  const tokenId = params?.tokenId;
  const router = useRouter();

  // ---- State ----
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [messages, setMessages] = useState<GraphMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GraphMessage | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [folders, setFolders] = useState<MailFolder[]>([]);
  const [localFolders, setLocalFolders] = useState<LocalFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [activeFolderIsLocal, setActiveFolderIsLocal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [sortField, setSortField] = useState<SortOption>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [refreshing, setRefreshing] = useState(false);

  const [currentView, setCurrentView] = useState<ViewMode>("mail");
  const [expandedSections, setExpandedSections] = useState({
    favorites: true,
    folders: true,
    local: true,
  });

  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeCc, setComposeCc] = useState("");
  const [composeBcc, setComposeBcc] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeContentType, setComposeContentType] = useState<"HTML" | "Text">("HTML");
  const [composeAttachments, setComposeAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [creatingRule, setCreatingRule] = useState(false);
  const [signature, setSignature] = useState("");
  const [autoReply, setAutoReply] = useState({ enabled: false, message: "" });
  const [focusedInbox, setFocusedInbox] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [userInfo, setUserInfo] = useState<GraphUser | null>(null);

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createLocalFolderOpen, setCreateLocalFolderOpen] = useState(false);
  const [newLocalFolderName, setNewLocalFolderName] = useState("");

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetFolder, setMoveTargetFolder] = useState("");

  // ---- Data Loading ----
  const loadToken = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const data = await fetchTokens();
      const t = data?.find((t: Token) => t.id === tokenId);
      setToken(t || null);
    } catch (err: any) {
      setError(err.message || "Failed to load token");
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const loadFolders = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await fetchMailFolders(tokenId);
      setFolders(data.value || []);
    } catch { /* silent */ }
  }, [tokenId]);

  const loadLocalFolders = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await fetchLocalFolders(tokenId);
      setLocalFolders(data.value || []);
    } catch { /* silent */ }
  }, [tokenId]);

  const loadRules = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await fetchRules(tokenId);
      setRules(data || []);
    } catch { /* silent */ }
  }, [tokenId]);

  const loadUserInfo = useCallback(async () => {
    if (!tokenId) return;
    try {
      const data = await fetchGraphMe(tokenId);
      setUserInfo(data);
    } catch { /* silent */ }
  }, [tokenId]);

  const loadMessages = useCallback(async () => {
    if (!tokenId) return;
    setMessagesLoading(true);
    try {
      let msgs: GraphMessage[] = [];
      if (activeFolderIsLocal) {
        const data = await fetchLocalFolderMessages(tokenId, activeFolder);
        msgs = (data.value || []).map((m: any) => ({
          id: m.message_id || m.id,
          subject: m.subject || "(No subject)",
          from: { emailAddress: { name: m.sender || m.sender_email, address: m.sender_email } },
          receivedDateTime: m.received_date || new Date().toISOString(),
          bodyPreview: m.body_preview || "",
          isRead: true,
          hasAttachments: false,
          body: { contentType: "text", content: m.body_preview || "" },
        }));
      } else if (activeFolder === "inbox") {
        const data = await fetchInbox(tokenId);
        msgs = data.value || [];
      } else {
        const data = await fetchFolderMessages(tokenId, activeFolder);
        msgs = data.value || [];
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        msgs = msgs.filter(
          (m) =>
            m.subject?.toLowerCase().includes(q) ||
            m.from?.emailAddress?.address?.toLowerCase().includes(q) ||
            m.from?.emailAddress?.name?.toLowerCase().includes(q) ||
            m.bodyPreview?.toLowerCase().includes(q)
        );
      }

      // Active filter
      if (activeFilter === "unread") {
        msgs = msgs.filter((m) => !m.isRead);
      } else if (activeFilter === "flagged") {
        msgs = msgs.filter((m) => flaggedIds.has(m.id));
      } else if (activeFilter === "hasAttachments") {
        msgs = msgs.filter((m) => m.hasAttachments);
      } else if (activeFilter === "from") {
        const q = searchQuery.toLowerCase().trim();
        if (q) msgs = msgs.filter((m) => m.from?.emailAddress?.address?.toLowerCase().includes(q));
      } else if (activeFilter === "subject") {
        const q = searchQuery.toLowerCase().trim();
        if (q) msgs = msgs.filter((m) => m.subject?.toLowerCase().includes(q));
      }

      // Sort
      msgs.sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        switch (sortField) {
          case "date":
            return (new Date(a.receivedDateTime).getTime() - new Date(b.receivedDateTime).getTime()) * dir;
          case "from":
            return ((a.from?.emailAddress?.name || "").localeCompare(b.from?.emailAddress?.name || "")) * dir;
          case "subject":
            return ((a.subject || "").localeCompare(b.subject || "")) * dir;
          default:
            return (new Date(b.receivedDateTime).getTime() - new Date(a.receivedDateTime).getTime()) * dir;
        }
      });

      setMessages(msgs);
    } catch (err: any) {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
      setRefreshing(false);
    }
  }, [tokenId, activeFolder, activeFolderIsLocal, searchQuery, activeFilter, sortField, sortDirection, flaggedIds]);

  useEffect(() => {
    loadToken();
    loadFolders();
    loadLocalFolders();
    loadRules();
    loadUserInfo();
  }, [loadToken, loadFolders, loadLocalFolders, loadRules, loadUserInfo]);

  useEffect(() => {
    if (tokenId) loadMessages();
  }, [loadMessages]);

  // ---- Handlers ----
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMessages();
  };

  const handleSelectMessage = async (msg: GraphMessage) => {
    setSelectedMessage(msg);
    setSummary(null);
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m)));
    if (!msg.isRead && tokenId) {
      try { await markMessageRead(tokenId, msg.id, true); } catch { /* silent */ }
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const handleToggleFlag = (id: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTogglePin = (id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!selectedMessage || !tokenId) return;
    if (!confirm("Delete this email?")) return;
    try {
      await deleteMessage(tokenId, selectedMessage.id);
      toast.success("Email deleted");
      setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
      setSelectedMessage(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const handleArchive = async () => {
    if (!selectedMessage || !tokenId) return;
    try {
      const archiveFolder = folders.find((f) => f.displayName === "Archive" || f.wellKnownName === "archive");
      if (archiveFolder) {
        await deleteMessage(tokenId, selectedMessage.id);
        toast.success("Message archived");
        setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
        setSelectedMessage(null);
      } else {
        toast.error("Archive folder not found");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to archive");
    }
  };

  const handleMoveToJunk = async (messageId: string) => {
    if (!tokenId) return;
    try {
      const junkFolder = folders.find((f) => f.displayName === "Junk Email" || f.wellKnownName === "junkemail");
      if (junkFolder) {
        await deleteMessage(tokenId, messageId);
        toast.success("Message reported as junk and moved to Junk Email folder");
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (selectedMessage?.id === messageId) setSelectedMessage(null);
      } else {
        toast.error("Junk Email folder not found");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to report as junk");
    }
  };

  const handleResend = async (message: GraphMessage) => {
    if (!tokenId) return;
    try {
      const to = message.toRecipients?.map((r) => r.emailAddress?.address).filter(Boolean) as string[] || [];
      await sendMail(tokenId, {
        subject: message.subject || "",
        body: message.body?.content || message.bodyPreview || "",
        to,
        content_type: message.body?.contentType || "HTML",
      });
      toast.success("Message resent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend");
    }
  };

  const handleMarkUnread = async () => {
    if (!selectedMessage || !tokenId) return;
    setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? { ...m, isRead: false } : m)));
    setSelectedMessage((prev) => (prev ? { ...prev, isRead: false } : null));
    try { await markMessageRead(tokenId, selectedMessage.id, false); } catch { /* silent */ }
  };

  const handleMarkRead = async () => {
    if (!selectedMessage || !tokenId) return;
    setMessages((prev) => prev.map((m) => (m.id === selectedMessage.id ? { ...m, isRead: true } : m)));
    setSelectedMessage((prev) => (prev ? { ...prev, isRead: true } : null));
    try { await markMessageRead(tokenId, selectedMessage.id, true); } catch { /* silent */ }
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
      setSummary(`Mock summary for "${selectedMessage.subject}"`);
    } finally {
      setSummarizing(false);
    }
  };

  const handleAnalyze = () => {
    if (!tokenId) return;
    router.push(`/analyze/${encodeURIComponent(tokenId)}`);
  };

  const openReply = (mode: "reply" | "replyAll" | "forward") => {
    if (!selectedMessage) return;
    const from = selectedMessage.from?.emailAddress;
    const toList = selectedMessage.toRecipients?.map((r) => r.emailAddress?.address).filter(Boolean) as string[] || [];
    const date = selectedMessage.receivedDateTime ? new Date(selectedMessage.receivedDateTime).toLocaleString() : "";
    const quoted = `\n\nOn ${date}, ${from?.name || from?.address || "Unknown"} wrote:\n> ${(selectedMessage.body?.content || selectedMessage.bodyPreview || "").replace(/\n/g, "\n> ")}`;

    if (mode === "reply") {
      setComposeTo(from?.address || "");
      setComposeSubject(selectedMessage.subject?.startsWith("Re: ") ? selectedMessage.subject : `Re: ${selectedMessage.subject || ""}`);
      setComposeBody(quoted);
    } else if (mode === "replyAll") {
      const all = [from?.address, ...toList].filter((e, i, arr) => e && arr.indexOf(e) === i) as string[];
      setComposeTo(all.join(", "));
      setComposeSubject(selectedMessage.subject?.startsWith("Re: ") ? selectedMessage.subject : `Re: ${selectedMessage.subject || ""}`);
      setComposeBody(quoted);
    } else {
      setComposeTo("");
      setComposeSubject(selectedMessage.subject?.startsWith("Fwd: ") ? selectedMessage.subject : `Fwd: ${selectedMessage.subject || ""}`);
      setComposeBody(`\n\n---------- Forwarded message ----------\nFrom: ${from?.name || from?.address || "Unknown"}\nDate: ${date}\nSubject: ${selectedMessage.subject || ""}\n\n${selectedMessage.body?.content || selectedMessage.bodyPreview || ""}`);
    }
    setComposeContentType("HTML");
    setComposeOpen(true);
  };

  const handleSendMail = async () => {
    if (!tokenId || !composeTo.trim() || !composeSubject.trim()) {
      toast.error("To and Subject are required");
      return;
    }
    setSending(true);
    try {
      const to = composeTo.split(",").map((e) => e.trim()).filter(Boolean);
      const cc = composeCc.split(",").map((e) => e.trim()).filter(Boolean);
      const bcc = composeBcc.split(",").map((e) => e.trim()).filter(Boolean);
      const attachments = await Promise.all(composeAttachments.map(fileToBase64));

      const formattedBody = composeContentType === "HTML"
        ? composeBody.replace(/\r\n/g, "\n").replace(/\n/g, "<br>")
        : composeBody;

      const payload: ComposePayload = {
        subject: composeSubject,
        body: formattedBody,
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        content_type: composeContentType,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      if (signature.trim()) {
        payload.body += composeContentType === "HTML"
          ? `<br><br>--<br>${signature.trim().replace(/\n/g, "<br>")}`
          : `\n\n--\n${signature.trim()}`;
      }

      await sendMail(tokenId, payload);
      toast.success("Email sent");
      setComposeTo("");
      setComposeCc("");
      setComposeBcc("");
      setComposeSubject("");
      setComposeBody("");
      setComposeAttachments([]);
      setComposeOpen(false);
      loadMessages();
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = () => {
    toast.success("Draft saved (local)");
  };

  const handleDiscard = () => {
    setComposeTo("");
    setComposeCc("");
    setComposeBcc("");
    setComposeSubject("");
    setComposeBody("");
    setComposeAttachments([]);
    setComposeOpen(false);
  };

  const handleCreateFolder = async () => {
    if (!tokenId || !newFolderName.trim()) return;
    try {
      await createFolder(tokenId, newFolderName.trim());
      toast.success(`Folder "${newFolderName}" created`);
      setNewFolderName("");
      setCreateFolderOpen(false);
      loadFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to create folder");
    }
  };

  const handleCreateLocalFolder = async () => {
    if (!tokenId || !newLocalFolderName.trim()) return;
    try {
      await createLocalFolder(tokenId, newLocalFolderName.trim());
      toast.success(`Local folder "${newLocalFolderName}" created`);
      setNewLocalFolderName("");
      setCreateLocalFolderOpen(false);
      loadLocalFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to create local folder");
    }
  };

  const handleDeleteLocalFolder = async (folderId: string) => {
    if (!tokenId) return;
    if (!confirm("Delete this local folder and all its messages?")) return;
    try {
      await deleteLocalFolder(tokenId, folderId);
      toast.success("Local folder deleted");
      if (activeFolder === folderId) {
        setActiveFolder("inbox");
        setActiveFolderIsLocal(false);
      }
      loadLocalFolders();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete local folder");
    }
  };

  const handleCreateRule = async (payload: {
    ruleName: string;
    condition: { field: string; operator: string; value: string };
    action: { type: string; target?: string };
  }) => {
    if (!tokenId) return;
    setCreatingRule(true);
    try {
      await createRule({
        token_id: tokenId,
        rule_name: payload.ruleName,
        condition_subject_contains: payload.condition.field === "subject" ? [payload.condition.value] : [],
        condition_sender_domain: payload.condition.field === "sender" ? [payload.condition.value] : [],
        action_move_to_folder: payload.action.type === "move_to_folder" ? payload.action.target || null : null,
        action_forward_to: payload.action.type === "forward" ? payload.action.target || null : null,
        stop_processing: false,
      });
      toast.success("Rule created");
      loadRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to create rule");
    } finally {
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await deleteRule(ruleId);
      toast.success("Rule deleted");
      loadRules();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete rule");
    }
  };

  const handleMove = async () => {
    if (!selectedMessage || !tokenId) return;
    if (!moveTargetFolder) {
      setMoveDialogOpen(true);
      return;
    }
    toast.info("Move functionality requires server implementation");
    setMoveDialogOpen(false);
    setMoveTargetFolder("");
  };

  const handleAutoFilter = async () => {
    if (!tokenId) return;
    try {
      const res = await runAutoFilter(tokenId);
      toast.success(`Auto-filter complete`, { description: `${res.moved} message(s) moved to FILTERED` });
      loadLocalFolders();
    } catch (err: any) {
      toast.error(err.message || "Auto-filter failed");
    }
  };

  const handleSort = (field: SortOption) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleToggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section as keyof typeof prev] }));
  };

  const unreadCount = useMemo(() => {
    return messages.filter((m) => !m.isRead).length;
  }, [messages]);

  // ---- Loading / Error States ----
  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-screen bg-[#0f1115]">
        <div className="h-14 px-6 flex items-center border-b border-[#2a2e37]">
          <div className="h-4 w-32 animate-pulse rounded bg-[#1a1d24]" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#64748b]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-screen bg-[#0f1115]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-8 w-8 mx-auto text-rose-400" />
            <p className="text-sm text-rose-400/80">{error}</p>
            <Button variant="outline" size="sm" onClick={loadToken} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex-1 flex flex-col min-h-0 h-screen bg-[#0f1115]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <MailIcon className="h-8 w-8 mx-auto text-[#64748b]" />
            <p className="text-sm text-[#64748b]">Token not found</p>
            <Button variant="outline" size="sm" onClick={() => router.push("/")} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="flex-1 flex flex-col min-h-0 h-screen bg-[#0f1115] overflow-hidden">
      {/* Top App Bar */}
      <div className="h-12 flex items-center gap-3 px-4 border-b border-[#2a2e37] bg-[#0f1115] flex-shrink-0 z-50">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <div className="h-4 w-px bg-[#2a2e37]" />
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-[#0f6cbd] flex items-center justify-center">
            <MailIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#e2e8f0] hidden sm:inline">Outlook</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAutoFilter}
            className="gap-1.5 h-8 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">BEC Filter</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setComposeOpen(true)}
            className="gap-1.5 h-8 text-xs text-[#e2e8f0] hover:bg-[#1a1d24]"
          >
            <PenLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New mail</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0 text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1d24]"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            className="h-8 w-8 p-0 text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#1a1d24]"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Three-pane Outlook layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <OutlookSidebar
          folders={folders}
          localFolders={localFolders}
          activeFolder={activeFolder}
          activeFolderIsLocal={activeFolderIsLocal}
          onSelectFolder={(id) => { setActiveFolder(id); setActiveFolderIsLocal(false); }}
          onSelectLocalFolder={(id) => { setActiveFolder(id); setActiveFolderIsLocal(true); }}
          onCreateLocalFolder={() => setCreateLocalFolderOpen(true)}
          onDeleteLocalFolder={handleDeleteLocalFolder}
          onCompose={() => setComposeOpen(true)}
          onNavigate={(view) => setCurrentView(view)}
          currentView={currentView}
          expandedSections={expandedSections}
          onToggleSection={handleToggleSection}
          onOpenSettings={() => setSettingsOpen(true)}
          unreadCount={unreadCount}
          userInfo={userInfo}
        />

        {currentView === "calendar" && tokenId ? (
          <CalendarView tokenId={tokenId} onBack={() => setCurrentView("mail")} />
        ) : currentView === "people" ? (
          <div className="flex-1 flex items-center justify-center bg-[#0f1115]">
            <div className="text-center">
              <Users className="h-12 w-12 text-[#2a2e37] mx-auto mb-3" />
              <p className="text-sm text-[#94a3b8]">People view coming in Phase 3</p>
              <Button size="sm" variant="outline" onClick={() => setCurrentView("mail")} className="mt-3 border-[#2a2e37]">
                Back to Mail
              </Button>
            </div>
          </div>
        ) : currentView === "todo" ? (
          <div className="flex-1 flex items-center justify-center bg-[#0f1115]">
            <div className="text-center">
              <CheckSquare className="h-12 w-12 text-[#2a2e37] mx-auto mb-3" />
              <p className="text-sm text-[#94a3b8]">To Do view coming in Phase 4</p>
              <Button size="sm" variant="outline" onClick={() => setCurrentView("mail")} className="mt-3 border-[#2a2e37]">
                Back to Mail
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Search Bar */}
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onFilter={setActiveFilter}
              activeFilter={activeFilter}
            />

            {/* Command Bar */}
            <CommandBar
              selectedCount={selectedIds.size}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onReply={() => openReply("reply")}
              onReplyAll={() => openReply("replyAll")}
              onForward={() => openReply("forward")}
              onMove={handleMove}
              onMarkRead={handleMarkRead}
              onMarkUnread={handleMarkUnread}
              onFlag={() => selectedMessage && handleToggleFlag(selectedMessage.id)}
              onPin={() => selectedMessage && handleTogglePin(selectedMessage.id)}
              onReport={() => selectedMessage && handleMoveToJunk(selectedMessage.id)}
              onRecall={() => toast.info("Message recall requires Exchange Web Services (EWS) - not available via Graph API")}
              onResend={() => selectedMessage && handleResend(selectedMessage)}
              onShareToTeams={() => toast.info("Share to Teams requires Microsoft Teams API integration")}
              onTrackReadReceipts={() => toast.info("Read receipt tracking requires Microsoft 365 Message Center API")}
              onRules={() => { setSettingsOpen(true); }}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              hasSelection={!!selectedMessage}
            />

            {/* Message List + Reading Pane */}
            <div className="flex-1 flex min-h-0">
              <MessageList
                messages={messages}
                selectedMessageId={selectedMessage?.id || null}
                onSelectMessage={handleSelectMessage}
                loading={messagesLoading}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                flaggedIds={flaggedIds}
                pinnedIds={pinnedIds}
                onToggleFlag={handleToggleFlag}
                onTogglePin={handleTogglePin}
              />
              <ReadingPane
                message={selectedMessage}
                onReply={() => openReply("reply")}
                onReplyAll={() => openReply("replyAll")}
                onForward={() => openReply("forward")}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onFlag={() => selectedMessage && handleToggleFlag(selectedMessage.id)}
                onPin={() => selectedMessage && handleTogglePin(selectedMessage.id)}
                onMove={handleMove}
                onMarkUnread={handleMarkUnread}
                onSummarize={handleSummarize}
                onAnalyze={handleAnalyze}
                summarizing={summarizing}
                summary={summary}
                isFlagged={selectedMessage ? flaggedIds.has(selectedMessage.id) : false}
                isPinned={selectedMessage ? pinnedIds.has(selectedMessage.id) : false}
                onToggleFlag={() => selectedMessage && handleToggleFlag(selectedMessage.id)}
                onTogglePin={() => selectedMessage && handleTogglePin(selectedMessage.id)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Compose Dialog */}
      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        to={composeTo}
        cc={composeCc}
        bcc={composeBcc}
        subject={composeSubject}
        body={composeBody}
        contentType={composeContentType}
        attachments={composeAttachments}
        onToChange={setComposeTo}
        onCcChange={setComposeCc}
        onBccChange={setComposeBcc}
        onSubjectChange={setComposeSubject}
        onBodyChange={setComposeBody}
        onContentTypeChange={setComposeContentType}
        onAddAttachments={(files) => setComposeAttachments((prev) => [...prev, ...Array.from(files)])}
        onRemoveAttachment={(idx) => setComposeAttachments((prev) => prev.filter((_, i) => i !== idx))}
        onSend={handleSendMail}
        onSaveDraft={handleSaveDraft}
        onDiscard={handleDiscard}
        sending={sending}
      />

      {/* Settings Panel */}
      <SettingsPanel
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        rules={rules}
        onCreateRule={handleCreateRule}
        onDeleteRule={handleDeleteRule}
        creatingRule={creatingRule}
        signature={signature}
        onSignatureChange={setSignature}
        autoReply={autoReply}
        onAutoReplyChange={setAutoReply}
        focusedInbox={focusedInbox}
        onFocusedInboxChange={setFocusedInbox}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        tokenId={tokenId || ""}
      />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-sm bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Create Outlook folder</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(false)} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Local Folder Dialog */}
      <Dialog open={createLocalFolderOpen} onOpenChange={setCreateLocalFolderOpen}>
        <DialogContent className="sm:max-w-sm bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Create local folder</DialogTitle>
            <DialogDescription className="text-[11px] text-[#64748b]">
              Local folders are only visible in this system, not in Outlook.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newLocalFolderName}
              onChange={(e) => setNewLocalFolderName(e.target.value)}
              placeholder="Folder name"
              className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]"
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateLocalFolderOpen(false)} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreateLocalFolder} disabled={!newLocalFolderName.trim()} className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-sm bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Move to folder</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Select value={moveTargetFolder} onValueChange={(v) => v && setMoveTargetFolder(v)}>
              <SelectTrigger className="bg-[#0f1115] border-[#2a2e37] text-xs text-[#e2e8f0]">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1d24] border-[#2a2e37]">
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs text-[#e2e8f0]">
                    {f.displayName}
                  </SelectItem>
                ))}
                {localFolders.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs text-[#e2e8f0]">
                    {f.name} (Local)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setMoveDialogOpen(false)} className="border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37]">
              Cancel
            </Button>
            <Button size="sm" onClick={handleMove} disabled={!moveTargetFolder} className="bg-[#0f6cbd] hover:bg-[#115ea3] text-white">
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
