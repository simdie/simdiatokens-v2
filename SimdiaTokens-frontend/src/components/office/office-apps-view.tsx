"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchOfficeDocs,
  searchOfficeDocs,
  getOfficeEmbedUrl,
  OfficeDocument,
} from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Loader2,
  FileText,
  FileSpreadsheet,
  Presentation,
  File,
  ExternalLink,
  X,
  Clock,
  User,
  HardDrive,
  LayoutGrid,
  List,
  FolderOpen,
  Download,
  Eye,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileArchive,
  Grid3X3,
  ChevronDown,
  Filter,
} from "lucide-react";

interface OfficeAppsViewProps {
  tokenId: string;
  onBack: () => void;
}

type DocType = "all" | "word" | "excel" | "powerpoint" | "pdf";
type ViewMode = "grid" | "list";

function getDocIcon(docType: string) {
  switch (docType) {
    case "word": return FileText;
    case "excel": return FileSpreadsheet;
    case "powerpoint": return Presentation;
    case "pdf": return FileText;
    default: return File;
  }
}

function getDocColor(docType: string): string {
  switch (docType) {
    case "word": return "text-[#2b579a]";
    case "excel": return "text-[#217346]";
    case "powerpoint": return "text-[#d24726]";
    case "pdf": return "text-[#f40f02]";
    default: return "text-[#94a3b8]";
  }
}

function getDocBgColor(docType: string): string {
  switch (docType) {
    case "word": return "bg-[#2b579a]/10";
    case "excel": return "bg-[#217346]/10";
    case "powerpoint": return "bg-[#d24726]/10";
    case "pdf": return "bg-[#f40f02]/10";
    default: return "bg-[#1a1d24]";
  }
}

function getDocLabel(docType: string): string {
  switch (docType) {
    case "word": return "Word";
    case "excel": return "Excel";
    case "powerpoint": return "PowerPoint";
    case "pdf": return "PDF";
    default: return "Document";
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "--";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function OfficeAppsView({ tokenId, onBack }: OfficeAppsViewProps) {
  const [documents, setDocuments] = useState<OfficeDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<DocType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedDoc, setSelectedDoc] = useState<OfficeDocument | null>(null);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);

  const loadDocuments = useCallback(async (docType?: DocType) => {
    if (!tokenId) return;
    setLoading(true);
    setIsSearching(false);
    try {
      const typeParam = docType && docType !== "all" ? docType : undefined;
      const data = await fetchOfficeDocs(tokenId, typeParam);
      setDocuments(data.documents || []);
    } catch (err: any) {
      toast.error("Failed to load documents", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const handleSearch = useCallback(async () => {
    if (!tokenId || !searchQuery.trim()) return;
    setIsSearching(true);
    setLoading(true);
    try {
      const data = await searchOfficeDocs(tokenId, searchQuery.trim());
      setDocuments(data.documents || []);
    } catch (err: any) {
      toast.error("Search failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId, searchQuery]);

  const handleOpenDocument = async (doc: OfficeDocument) => {
    setSelectedDoc(doc);
    if (doc.embed_url) {
      setEmbedUrl(doc.embed_url);
      setEmbedDialogOpen(true);
    } else if (doc.web_url) {
      window.open(doc.web_url, "_blank");
    }
  };

  const handleOpenInOffice = async (doc: OfficeDocument) => {
    try {
      const data = await getOfficeEmbedUrl(tokenId, doc.id);
      if (data.document?.office_online_url) {
        window.open(data.document.office_online_url, "_blank");
      } else if (doc.web_url) {
        window.open(doc.web_url, "_blank");
      }
    } catch {
      if (doc.web_url) {
        window.open(doc.web_url, "_blank");
      }
    }
  };

  const handleDownload = (doc: OfficeDocument) => {
    if (doc.download_url) {
      window.open(doc.download_url, "_blank");
    } else {
      toast.error("Download not available");
    }
  };

  useEffect(() => {
    loadDocuments(activeFilter);
  }, [activeFilter, loadDocuments]);

  const filteredDocs = documents;
  const docTypeCounts = {
    all: documents.length,
    word: documents.filter((d) => d.doc_type === "word").length,
    excel: documents.filter((d) => d.doc_type === "excel").length,
    powerpoint: documents.filter((d) => d.doc_type === "powerpoint").length,
    pdf: documents.filter((d) => d.doc_type === "pdf").length,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0f1115]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2a2e37]">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Mail
          </button>
          <div className="h-4 w-px bg-[#2a2e37]" />
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-[#d24726]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">Office Apps</h2>
          </div>
          <Badge variant="outline" className="text-[10px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37]">
            {filteredDocs.length} document{filteredDocs.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-[#2a2e37] rounded-md overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={cn("p-1.5", viewMode === "grid" ? "bg-[#2a2e37] text-[#e2e8f0]" : "text-[#64748b] hover:text-[#e2e8f0]")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn("p-1.5", viewMode === "list" ? "bg-[#2a2e37] text-[#e2e8f0]" : "text-[#64748b] hover:text-[#e2e8f0]")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search documents..."
              className="pl-9 w-56 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setIsSearching(false); loadDocuments(activeFilter); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button size="sm" onClick={handleSearch} disabled={!searchQuery.trim() || loading} className="bg-[#0f6cbd] hover:bg-[#0f6cbd]/90 text-white h-8 text-xs gap-1">
            <Search className="h-3.5 w-3.5" /> Search
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a2e37] bg-[#0f1115]/80">
        {(["all", "word", "excel", "powerpoint", "pdf"] as DocType[]).map((type) => (
          <button
            key={type}
            onClick={() => setActiveFilter(type)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors border",
              activeFilter === type
                ? "bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20"
                : "bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37] hover:text-[#e2e8f0]"
            )}
          >
            {type === "all" && <LayoutGrid className="h-3 w-3" />}
            {type === "word" && <FileText className="h-3 w-3" />}
            {type === "excel" && <FileSpreadsheet className="h-3 w-3" />}
            {type === "powerpoint" && <Presentation className="h-3 w-3" />}
            {type === "pdf" && <FileText className="h-3 w-3" />}
            {getDocLabel(type)}
            <span className="text-[10px] text-[#64748b]">({docTypeCounts[type]})</span>
          </button>
        ))}
        {isSearching && (
          <span className="text-[11px] text-[#0f6cbd] ml-2">
            Search: "{searchQuery}"
          </span>
        )}
      </div>

      {/* Documents */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-[#0f6cbd]" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <HardDrive className="h-12 w-12 mb-3 text-[#2a2e37]" />
            <p className="text-sm">No documents found</p>
            <p className="text-xs text-[#64748b] mt-1">
              {isSearching ? "Try a different search term" : "Recent Office documents will appear here"}
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredDocs.map((doc, index) => {
              const Icon = getDocIcon(doc.doc_type);
              const colorClass = getDocColor(doc.doc_type);
              const bgClass = getDocBgColor(doc.doc_type);
              const date = doc.last_modified_date_time ? parseISO(doc.last_modified_date_time) : null;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex flex-col rounded-lg border border-[#2a2e37] bg-[#1a1d24] hover:border-[#3a3e47] transition-colors overflow-hidden"
                >
                  {/* Icon Area */}
                  <div className={cn("flex items-center justify-center p-4", bgClass)}>
                    <Icon className={cn("h-10 w-10", colorClass)} />
                  </div>

                  {/* Info */}
                  <div className="p-2.5 flex-1 flex flex-col">
                    <p className="text-xs font-medium text-[#e2e8f0] truncate mb-1" title={doc.name}>
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-[#64748b] mb-1">
                      <span>{formatFileSize(doc.size)}</span>
                    </div>
                    {date && (
                      <p className="text-[9px] text-[#64748b] mt-auto">
                        {format(date, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 p-2 border-t border-[#2a2e37] opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenDocument(doc)}
                      className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#0f6cbd]/20 text-[#0f6cbd] hover:bg-[#0f6cbd]/30 text-[10px] font-medium"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                    <button
                      onClick={() => handleOpenInOffice(doc)}
                      className="p-1 rounded bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]"
                      title="Open in Office Online"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1 rounded bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-2 space-y-1">
            {filteredDocs.map((doc, index) => {
              const Icon = getDocIcon(doc.doc_type);
              const colorClass = getDocColor(doc.doc_type);
              const date = doc.last_modified_date_time ? parseISO(doc.last_modified_date_time) : null;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#2a2e37] bg-[#1a1d24] hover:bg-[#1a1d24]/80 transition-colors"
                >
                  <Icon className={cn("h-5 w-5 flex-shrink-0", colorClass)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#e2e8f0] truncate">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-[#64748b]">
                      <span>{getDocLabel(doc.doc_type)}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.size)}</span>
                      {date && (
                        <>
                          <span>•</span>
                          <span>Modified {format(date, "MMM d, yyyy")}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      onClick={() => handleOpenDocument(doc)}
                      className="p-1.5 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#0f6cbd]"
                      title="View"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenInOffice(doc)}
                      className="p-1.5 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]"
                      title="Open in Office Online"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded hover:bg-[#2a2e37] text-[#94a3b8] hover:text-[#e2e8f0]"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="sm:max-w-5xl bg-[#1a1d24] border-[#2a2e37] max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-[#2a2e37]">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm text-[#e2e8f0]">
                {selectedDoc?.name || "Document Viewer"}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {selectedDoc?.web_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(selectedDoc.web_url, "_blank")}
                    className="h-7 text-[11px] border-[#2a2e37] text-[#e2e8f0] gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Open in Office
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEmbedDialogOpen(false)}
                  className="h-7 w-7 p-0 text-[#64748b] hover:text-[#e2e8f0]"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="w-full" style={{ height: "70vh" }}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title="Office Document Viewer"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-[#94a3b8]">
                <p className="text-sm">Unable to load document preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
