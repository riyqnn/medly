"use client";

import { BookOpen, Mic, Music2, Sparkles } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import { BookReader } from "./BookReader";
import { AudioPlayer } from "./AudioPlayer";
import { GameStage, isGamePath } from "@/src/features/patient/games/GameStage";

export type MediaKind = "education" | "entertainment" | "spiritual";

export interface MediaItem {
  id: string;
  title: string;
  /** `content_type` for education, `category` for entertainment/spiritual. */
  type: string;
  media_url: string | null;
  body_text?: string | null;
  thumbnail_url?: string | null;
  subtitle?: string | null;
}

/** Which types stream straight from the source, and which need our proxy. */
const VIDEO = new Set(["VIDEO", "MOVIE", "RELAXATION_VIDEO"]);
const AUDIO = new Set(["MUSIC", "PODCAST", "MUROTTAL"]);
const DOCUMENT = new Set(["PDF", "MAGAZINE"]);
const BOOK = new Set(["EBOOK"]);

const AUDIO_ICONS: Record<string, typeof Music2> = {
  MUSIC: Music2,
  PODCAST: Mic,
  MUROTTAL: Sparkles,
};

/** Everything a "stage" type needs the full screen; prose types don't. */
export function needsStage(type: string, mediaUrl: string | null) {
  if (mediaUrl && isGamePath(mediaUrl)) return true;
  return VIDEO.has(type) || BOOK.has(type) || DOCUMENT.has(type);
}

/**
 * Renders one piece of content inside the bedside reader. Nothing here ever
 * navigates away: a patient who taps a film should not end up looking at a
 * browser, and may not know how to get back.
 */
export function MediaViewer({
  kind,
  admissionId,
  item,
}: {
  kind: MediaKind;
  admissionId: string;
  item: MediaItem;
}) {
  const { type, media_url, body_text, title } = item;

  // Routed through our origin so framing/CORS refusals upstream can't force a
  // new tab. Video and audio deliberately keep their direct URL.
  const proxied = `/api/patient/media/${kind}/${item.id}?admission_id=${admissionId}`;

  if (media_url && isGamePath(media_url)) {
    return <GameStage path={media_url} />;
  }

  if (media_url && VIDEO.has(type)) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center">
        <VideoPlayer src={media_url} poster={item.thumbnail_url} />
        {body_text && (
          <p className="mt-4 line-clamp-2 shrink-0 text-center text-base font-medium text-ink-mute">
            {body_text}
          </p>
        )}
      </div>
    );
  }

  if (media_url && BOOK.has(type)) {
    return <BookReader src={proxied} title={title} />;
  }

  if (media_url && DOCUMENT.has(type)) {
    return (
      <iframe
        src={proxied}
        title={title}
        className="min-h-0 flex-1 rounded-3xl border border-line bg-white shadow-card"
      />
    );
  }

  if (media_url && AUDIO.has(type)) {
    return (
      <AudioPlayer
        src={media_url}
        title={title}
        subtitle={item.subtitle ?? body_text ?? null}
        artwork={item.thumbnail_url}
        icon={AUDIO_ICONS[type] ?? Music2}
      />
    );
  }

  if (media_url && type === "INFOGRAPHIC") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={media_url} alt={title} className="w-full rounded-3xl" />
    );
  }

  if (body_text) {
    return <p className="whitespace-pre-wrap text-xl leading-relaxed text-ink-soft">{body_text}</p>;
  }

  return (
    <div className="grid place-items-center py-16 text-center">
      <BookOpen className="mb-3 h-12 w-12 text-brand-200" strokeWidth={1.5} />
      <p className="text-xl font-bold text-ink-mute">This content isn’t available yet.</p>
    </div>
  );
}
