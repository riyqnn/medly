"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/src/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  /**
   * Rendered into <body> rather than in place.
   *
   * `position: fixed` resolves against the viewport only while no ancestor
   * establishes a containing block — and any ancestor with a transform does.
   * Our page wrappers animate in with `animate-fade-up`, whose final keyframe
   * (`transform: none`) computes to `matrix(1,0,0,1,0,0)` and keeps that
   * containing block alive for good. Anchored there, dialogs centred on the
   * whole scrollable page instead of the screen and drifted off the top.
   * Portalling sidesteps the whole class of bug, whatever ancestors do later.
   */
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[88vh] w-full animate-pop overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-float",
          width
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-mute transition hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="mb-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
      {children}
    </p>
  );
}
