"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  fetchOneDriveItems,
  searchOneDriveItems,
  getOneDriveDownloadUrl,
  DriveItem,
} from "@/lib/api";
import {
  ArrowLeft,
  Search,
  Loader2,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileCode,
  FileAudio,
  FileVideo,
  FileArchive,
  Download,
  ChevronRight,
  HardDrive,
  X,
  ExternalLink,
  ArrowUp,
  Home,
  Cloud,
} from "lucide-react";

interface OneDriveViewProps {
  tokenId: string;
  onBack: () => void;
}

function getFileIcon(item: DriveItem) {
  if (item.folder) {
    return FolderOpen;
  }

  const mimeType = item.file?.mimeType || item.mimeType || "";
  const name = item.name.toLowerCase();

  if (mimeType.includes("image") || name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".gif") || name.endsWith(".svg") || name.endsWith(".webp")) {
    return FileImage;
  }
  if (mimeType.includes("pdf") || name.endsWith(".pdf")) {
    return FileText;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || name.endsWith(".xlsx") || name.endsWith(".csv") || name.endsWith(".xls")) {
    return FileSpreadsheet;
  }
  if (mimeType.includes("word") || mimeType.includes("document") || name.endsWith(".docx") || name.endsWith(".doc")) {
    return FileText;
  }
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint") || name.endsWith(".pptx") || name.endsWith(".ppt")) {
    return FileText;
  }
  if (mimeType.includes("audio") || name.endsWith(".mp3") || name.endsWith(".wav") || name.endsWith(".m4a") || name.endsWith(".ogg")) {
    return FileAudio;
  }
  if (mimeType.includes("video") || name.endsWith(".mp4") || name.endsWith(".avi") || name.endsWith(".mov") || name.endsWith(".mkv")) {
    return FileVideo;
  }
  if (mimeType.includes("zip") || mimeType.includes("archive") || name.endsWith(".zip") || name.endsWith(".tar") || name.endsWith(".gz") || name.endsWith(".rar")) {
    return FileArchive;
  }
  if (mimeType.includes("code") || mimeType.includes("javascript") || mimeType.includes("typescript") || mimeType.includes("json") || name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".json") || name.endsWith(".html") || name.endsWith(".css") || name.endsWith(".py") || name.endsWith(".rs") || name.endsWith(".go")) {
    return FileCode;
  }

  return File;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function OneDriveView({ tokenId, onBack }: OneDriveViewProps) {
  const [items, setItems] = useState<DriveItem[]>([]);
  const [currentPath, setCurrentPath] = useState("Root");
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([{ id: "root", name: "Root" }]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null);

  const loadItems = useCallback(async (itemId?: string, path?: string) => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const data = await fetchOneDriveItems(tokenId, itemId, path);
      setItems(data.items || []);
      if (data.path && data.path !== "Root") {
        setCurrentPath(data.path);
      }
    } catch (err: any) {
      toast.error("Failed to load OneDrive items", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId]);

  const handleSearch = useCallback(async () => {
    if (!tokenId || !searchQuery.trim()) return;
    setIsSearching(true);
    setLoading(true);
    try {
      const data = await searchOneDriveItems(tokenId, searchQuery.trim());
      setItems(data.items || []);
      setIsSearching(true);
    } catch (err: any) {
      toast.error("Search failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, [tokenId, searchQuery]);

  const handleItemClick = (item: DriveItem) => {
    if (item.folder) {
      // Navigate into folder
      const newBreadcrumbs = [...breadcrumbs, { id: item.id, name: item.name }];
      setBreadcrumbs(newBreadcrumbs);
      setCurrentPath(item.name);
      setIsSearching(false);
      loadItems(item.id);
    } else {
      setSelectedItem(item);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setIsSearching(false);
    setSearchQuery("");

    if (index === 0) {
      setCurrentPath("Root");
      loadItems();
    } else {
      const item = newBreadcrumbs[index];
      setCurrentPath(item.name);
      loadItems(item.id);
    }
  };

  const handleDownload = (item: DriveItem) => {
    if (!item.downloadUrl) {
      toast.error("Download not available for this file");
      return;
    }
    const url = getOneDriveDownloadUrl(tokenId, item.id);
    window.open(url, "_blank");
  };

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const folderCount = items.filter((i) => i.folder).length;
  const fileCount = items.filter((i) => !i.folder).length;

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
            <Cloud className="h-5 w-5 text-[#0f6cbd]" />
            <h2 className="text-sm font-semibold text-[#e2e8f0]">OneDrive</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {folderCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-[#0f6cbd]/10 text-[#0f6cbd] border-[#0f6cbd]/20">
                {folderCount} folder{folderCount !== 1 ? "s" : ""}
              </Badge>
            )}
            {fileCount > 0 && (
              <Badge variant="outline" className="text-[10px] bg-[#1a1d24] text-[#94a3b8] border-[#2a2e37]">
                {fileCount} file{fileCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#64748b]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search OneDrive..."
              className="pl-9 w-56 h-8 text-xs bg-[#1a1d24] border-[#2a2e37] text-[#e2e8f0]"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setIsSearching(false); loadItems(); }}
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

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#2a2e37] bg-[#0f1115]/80">
        <button onClick={() => handleBreadcrumbClick(0)} className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors">
          <Home className="h-3.5 w-3.5" />
          Root
        </button>
        {breadcrumbs.slice(1).map((crumb, idx) => (
          <div key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3 text-[#64748b]" />
            <button
              onClick={() => handleBreadcrumbClick(idx + 1)}
              className="text-xs text-[#94a3b8] hover:text-[#e2e8f0] transition-colors"
            >
              {crumb.name}
            </button>
          </div>
        ))}
        {isSearching && (
          <>
            <ChevronRight className="h-3 w-3 text-[#64748b]" />
            <span className="text-xs text-[#0f6cbd]">Search: "{searchQuery}"</span>
          </>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-[#0f6cbd]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <HardDrive className="h-12 w-12 mb-3 text-[#2a2e37]" />
            <p className="text-sm">{isSearching ? "No results found" : "This folder is empty"}</p>
            <p className="text-xs text-[#64748b] mt-1">
              {isSearching ? "Try a different search term" : "Upload files to your OneDrive to see them here"}
            </p>
          </div>
        ) : (
          <div className="px-2 py-2">
            {/* Grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
              {items.map((item, index) => {
                const Icon = getFileIcon(item);
                const isFolder = !!item.folder;
                const isSelected = selectedItem?.id === item.id;
                const date = item.lastModifiedDateTime ? parseISO(item.lastModifiedDateTime) : null;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => handleItemClick(item)}
                    onDoubleClick={() => isFolder && handleItemClick(item)}
                    className={cn(
                      "group relative flex flex-col items-center p-3 rounded-lg border border-[#2a2e37] bg-[#1a1d24] cursor-pointer transition-colors hover:bg-[#1a1d24]/80 hover:border-[#3a3e47]",
                      isSelected && "border-[#0f6cbd] bg-[#0f6cbd]/10"
                    )}
                  >
                    {/* Icon */}
                    <div className="mb-2">
                      <Icon className={cn(
                        "h-10 w-10",
                        isFolder ? "text-[#0f6cbd]" : "text-[#94a3b8]"
                      )} />
                    </div>

                    {/* Name */}
                    <p className="text-xs text-[#e2e8f0] text-center truncate w-full mb-1" title={item.name}>
                      {item.name}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-1 text-[10px] text-[#64748b]">
                      {isFolder ? (
                        <span>{item.folder?.childCount || 0} items</span>
                      ) : (
                        <span>{formatFileSize(item.size)}</span>
                      )}
                    </div>

                    {/* Date */}
                    {date && (
                      <p className="text-[9px] text-[#64748b] mt-0.5">
                        {format(date, "MMM d, yyyy")}
                      </p>
                    )}

                    {/* Hover Actions */}
                    {!isFolder && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                          className="p-1 rounded bg-[#0f6cbd]/80 hover:bg-[#0f6cbd] text-white"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                        {item.webUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(item.webUrl, "_blank");
                            }}
                            className="p-1 rounded bg-[#2a2e37] hover:bg-[#3a3e47] text-[#94a3b8]"
                            title="Open in OneDrive"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* File Details Panel (bottom) */}
      {selectedItem && (
        <div className="border-t border-[#2a2e37] bg-[#1a1d24] p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {(() => {
                const Icon = getFileIcon(selectedItem);
                return <Icon className="h-8 w-8 text-[#94a3b8]" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#e2e8f0] truncate">{selectedItem.name}</p>
              <div className="flex items-center gap-3 text-[10px] text-[#64748b]">
                <span>{formatFileSize(selectedItem.size)}</span>
                {selectedItem.lastModifiedDateTime && (
                  <span>Modified: {format(parseISO(selectedItem.lastModifiedDateTime), "MMM d, yyyy h:mm a")}</span>
                )}
                {selectedItem.file?.mimeType && (
                  <span>Type: {selectedItem.file.mimeType}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDownload(selectedItem)}
                className="h-7 text-[11px] border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37] gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </Button>
              {selectedItem.webUrl && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(selectedItem.webUrl!, "_blank")}
                  className="h-7 text-[11px] border-[#2a2e37] text-[#e2e8f0] hover:bg-[#2a2e37] gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedItem(null)}
                className="h-7 w-7 p-0 text-[#64748b] hover:text-[#e2e8f0]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
