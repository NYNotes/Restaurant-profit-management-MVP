"use client";

import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Inside the native app shell, a plain <a href> download hangs the WebView — WKWebView
// has no built-in file-download UI, unlike Safari/Chrome. On native, fetch the CSV
// ourselves, write it to the app's cache, and hand it to the OS share sheet instead
// (Save to Files, AirDrop, Mail, ...). In a regular browser the link just works as-is.
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

export function ExportCsvButton({
  href,
  filename,
  label,
  className,
}: {
  href: string;
  filename: string;
  label: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!Capacitor.isNativePlatform()) return;
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(href);
      const text = await res.text();
      const written = await Filesystem.writeFile({
        path: filename,
        data: utf8ToBase64(text),
        directory: Directory.Cache,
      });
      await Share.share({ url: written.uri });
    } finally {
      setBusy(false);
    }
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {busy ? "…" : label}
    </a>
  );
}
