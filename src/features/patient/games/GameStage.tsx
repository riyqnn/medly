"use client";

import { Gamepad2 } from "lucide-react";
import { Sudoku } from "./Sudoku";
import { Memory } from "./Memory";

/**
 * Games are content rows like any other, so admins can publish or hide them
 * from the CMS. What marks one is an internal `media_url` — `/games/<slug>` —
 * instead of an external link. Third-party game sites all send
 * `X-Frame-Options: SAMEORIGIN`, so they can never be embedded; the only way a
 * game runs without throwing the patient into a browser is to be ours.
 */
const GAMES: Record<string, () => React.ReactElement> = {
  sudoku: Sudoku,
  memory: Memory,
};

export const isGamePath = (url: string) => url.startsWith("/games/");

export function GameStage({ path }: { path: string }) {
  const slug = path.replace(/^\/games\//, "").replace(/\/$/, "");
  const Game = GAMES[slug];

  if (!Game) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center text-center">
        <div>
          <Gamepad2 className="mx-auto mb-3 h-12 w-12 text-brand-200" strokeWidth={1.5} />
          <p className="text-xl font-bold text-ink-mute">Permainan ini belum tersedia.</p>
        </div>
      </div>
    );
  }

  return <Game />;
}
