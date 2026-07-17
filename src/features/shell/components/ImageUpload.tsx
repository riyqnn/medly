"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Uploads through the existing `/api/upload` route, which pins to Pinata/IPFS
 * and returns `{ url }`. Lifted out of the meals page so the hospital logo and
 * any future image field share one behaviour.
 */
export function ImageUpload({
  value,
  onChange,
  label = "Gambar",
  hint,
  preview = "wide",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  preview?: "wide" | "square";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handle(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't upload the image");
      onChange(data.url);
    } catch (err: any) {
      setError(err.message || "Couldn't upload the image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-line bg-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className={cn(
              "w-full bg-white object-contain",
              preview === "square" ? "h-32" : "h-36"
            )}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Remove image"
            className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/90 text-ink-soft shadow-sm backdrop-blur transition hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line py-7 transition hover:border-brand-300 hover:bg-brand-50/40",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          <ImagePlus className={cn("h-6 w-6 text-brand-500", uploading && "animate-pulse")} />
          <span className="text-xs font-bold text-ink-soft">
            {uploading ? "Mengunggah…" : "Choose image"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handle(e.target.files?.[0])}
          />
        </label>
      )}

      {hint && !error && <p className="mt-1.5 text-xs text-ink-mute">{hint}</p>}
      {error && <p className="mt-1.5 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}
