"use client";

import { useState } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useLocale } from "next-intl";
import { recognizeText } from "@/lib/ocr";

export function PhotoScanButton({
  label,
  scanningLabel,
  errorLabel,
  onScanned,
}: {
  label: string;
  scanningLabel: string;
  errorLabel: string;
  onScanned: (rawText: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "scanning" | "error">("idle");
  const locale = useLocale();

  async function handleScan() {
    setStatus("scanning");
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        quality: 70,
        promptLabelHeader: label,
      });
      if (!photo.dataUrl) throw new Error("No image data");
      const text = await recognizeText(photo.dataUrl, locale);
      onScanned(text);
      setStatus("idle");
    } catch (err) {
      // Cancelling the picker also rejects the promise — that's not a real error.
      const message = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(message)) {
        setStatus("idle");
      } else {
        setStatus("error");
      }
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleScan}
        disabled={status === "scanning"}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
      >
        {status === "scanning" ? scanningLabel : label}
      </button>
      {status === "error" && <p className="text-xs text-red-600">{errorLabel}</p>}
    </div>
  );
}
