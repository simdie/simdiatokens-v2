"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ExternalLink, EyeOff, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---- HTML Sanitization ----
function sanitizeEmailHtml(html: string): string {
  if (!html) return "";

  let sanitized = html;

  // Remove <script> tags and their contents
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove <form> tags and their contents
  sanitized = sanitized.replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "");

  // Remove <input>, <textarea>, <select>, <button> (except inside styled divs)
  sanitized = sanitized.replace(/<input\b[^>]*>/gi, "");
  sanitized = sanitized.replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, "");
  sanitized = sanitized.replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, "");
  // Keep <button> only if it's a styled div-like element (not an actual form button)
  // Actually, safer to just strip all interactive elements
  sanitized = sanitized.replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, "");

  // Remove on* event handlers from all tags
  sanitized = sanitized.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href=""');
  sanitized = sanitized.replace(/href\s*=\s*'javascript:[^']*'/gi, "href=''");
  sanitized = sanitized.replace(/href\s*=\s*javascript:[^\s>]+/gi, 'href=""');
  sanitized = sanitized.replace(/src\s*=\s*"javascript:[^"]*"/gi, 'src=""');
  sanitized = sanitized.replace(/src\s*=\s*'javascript:[^']*'/gi, "src=''");
  sanitized = sanitized.replace(/src\s*=\s*javascript:[^\s>]+/gi, 'src=""');

  // Remove data-* attributes that might execute scripts
  sanitized = sanitized.replace(/\sdata-[\w-]+\s*=\s*"[^"]*"/gi, "");
  sanitized = sanitized.replace(/\sdata-[\w-]+\s*=\s*'[^']*'/gi, "");

  // Remove <meta> refresh tags
  sanitized = sanitized.replace(/<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, "");

  // Remove <object>, <embed>, <iframe>
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "");
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, "");
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

  // Remove <link> tags (external stylesheets can be malicious)
  sanitized = sanitized.replace(/<link\b[^>]*>/gi, "");

  // Remove <base> tag
  sanitized = sanitized.replace(/<base\b[^>]*>/gi, "");

  // Remove <noscript> tags and their contents
  sanitized = sanitized.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, "");

  return sanitized;
}

// ---- Image URL Rewriting ----
function rewriteImages(html: string, loadImages: boolean): string {
  if (!loadImages) {
    // Replace all image src with a transparent pixel and store original
    return html.replace(
      /<img\b([^>]*)src\s*=\s*"([^"]*)"([^>]*)>/gi,
      '<img$1src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" data-original-src="$2"$3>'
    ).replace(
      /<img\b([^>]*)src\s*=\s*'([^']*)'([^>]*)>/gi,
      "<img$1src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7\" data-original-src='$2'$3>"
    );
  }
  return html;
}

// ---- Base CSS for iframe ----
const BASE_EMAIL_CSS = `
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #333333;
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    word-wrap: break-word;
    -webkit-font-smoothing: antialiased;
  }
  body {
    padding: 16px;
    overflow-y: auto;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  a {
    color: #0078d4;
    text-decoration: underline;
  }
  a:hover {
    color: #106ebe;
  }
  img {
    max-width: 100%;
    height: auto;
    border: 0;
  }
  table {
    border-collapse: collapse;
    max-width: 100%;
  }
  td, th {
    word-wrap: break-word;
  }
  /* Ensure email's own styles work */
  * {
    box-sizing: border-box;
  }
  /* Blocked images styling */
  img[data-original-src] {
    background: #f3f3f3;
    border: 1px dashed #c8c8c8;
    display: inline-block;
    min-width: 32px;
    min-height: 32px;
  }
`;

// ---- Click Interception Script ----
const CLICK_INTERCEPTION_SCRIPT = `
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
      if (!target || target === document.body) break;
    }
    if (target && target.tagName === 'A') {
      e.preventDefault();
      e.stopPropagation();
      window.parent.postMessage({
        type: 'email-link-click',
        href: target.href,
        text: target.textContent
      }, '*');
    }
  });
  // Report height changes
  function reportHeight() {
    var height = document.documentElement.scrollHeight;
    window.parent.postMessage({
      type: 'email-height',
      height: height
    }, '*');
  }
  window.addEventListener('load', reportHeight);
  // Use MutationObserver for dynamic content
  var observer = new MutationObserver(reportHeight);
  observer.observe(document.body, { subtree: true, childList: true, attributes: true });
  // Also report periodically in case images load
  setInterval(reportHeight, 500);
`;

interface SafeEmailViewerProps {
  htmlContent: string;
  contentType?: "html" | "text";
  className?: string;
  onLinkClick?: (href: string) => void;
}

export function SafeEmailViewer({
  htmlContent,
  contentType = "html",
  className,
  onLinkClick,
}: SafeEmailViewerProps) {
  const [loadImages, setLoadImages] = useState(false);
  const [clickedUrl, setClickedUrl] = useState<string | null>(null);

  // Prepare the HTML content for the iframe
  const prepareHtml = useCallback(() => {
    if (contentType === "text") {
      const escaped = htmlContent
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<!DOCTYPE html>
<html>
<head>
<style>${BASE_EMAIL_CSS}</style>
</head>
<body>
<div style="white-space: pre-wrap; font-family: monospace; font-size: 13px;">${escaped}</div>
</body>
</html>`;
    }

    let sanitized = sanitizeEmailHtml(htmlContent);
    sanitized = rewriteImages(sanitized, loadImages);

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${BASE_EMAIL_CSS}</style>
</head>
<body>
${sanitized}
<script>${CLICK_INTERCEPTION_SCRIPT}</script>
</body>
</html>`;
  }, [htmlContent, contentType, loadImages]);

  const handleOpenUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    setClickedUrl(null);
  };

  const srcDoc = prepareHtml();

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Image toggle bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3d3d3d] bg-[#1f1f1f]/80 flex-shrink-0">
        <div className="flex items-center gap-2">
          {!loadImages ? (
            <div className="flex items-center gap-1.5 text-[11px] text-[#a0a0a0]">
              <EyeOff className="h-3 w-3" />
              <span>Images blocked for privacy</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <Image className="h-3 w-3" />
              <span>Images loaded</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLoadImages((v) => !v)}
          className="h-6 text-[11px] text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#2d2d2d] px-2"
        >
          {loadImages ? "Block images" : "Load images"}
        </Button>
      </div>

      {/* Clicked URL preview bar */}
      {clickedUrl && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#3d3d3d] bg-[#0f6cbd]/10 flex-shrink-0">
          <span className="text-[11px] text-[#a0a0a0] truncate flex-1">{clickedUrl}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenUrl(clickedUrl)}
            className="h-6 text-[11px] text-[#0f6cbd] hover:text-[#0f6cbd] hover:bg-[#0f6cbd]/10 px-2 gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setClickedUrl(null)}
            className="h-6 text-[11px] text-[#a0a0a0] hover:text-[#ffffff] hover:bg-[#2d2d2d] px-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Iframe — scrollable viewport like real OWA */}
      <div className="flex-1 bg-[#ffffff] min-h-0 overflow-hidden">
        <iframe
          srcDoc={srcDoc}
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block",
            overflow: "auto",
          }}
          sandbox="allow-same-origin"
          title="Email content"
        />
      </div>
    </div>
  );
}

export default SafeEmailViewer;
