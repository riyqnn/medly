"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/utils";

/** Large, high-contrast glyphs — readable from a bed, no reading required. */
const FACES = ["🍎", "🌻", "🐦", "⛵", "🌙", "🍀", "🎈", "🐟", "☀️", "🍇"];

const PAIRS = 8;

type Card = { id: number; face: string };

function deal(): Card[] {
  const faces = [...FACES].sort(() => Math.random() - 0.5).slice(0, PAIRS);
  const deck = [...faces, ...faces].map((face, id) => ({ id, face }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/**
 * "Main lagi" remounts the board with a new key rather than resetting four
 * pieces of state by hand — a fresh game is a fresh board.
 */
export function Memory() {
  const [game, setGame] = useState(0);
  return <Board key={game} onNewGame={() => setGame((g) => g + 1)} />;
}

function Board({ onNewGame }: { onNewGame: () => void }) {
  const [deck] = useState(deal);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const done = matched.size === deck.length;

  function flip(i: number) {
    if (flipped.length === 2 || flipped.includes(i) || matched.has(i)) return;

    const next = [...flipped, i];
    setFlipped(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;
    if (deck[a].face === deck[b].face) {
      setMatched((prev) => new Set(prev).add(a).add(b));
      setFlipped([]);
    } else {
      // Long enough to actually register the two cards before they turn back.
      timer.current = setTimeout(() => setFlipped([]), 900);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="mx-auto grid min-h-0 w-full max-w-3xl flex-1 grid-cols-4 grid-rows-4 gap-2 sm:gap-3">
        {deck.map((card, i) => {
          const up = flipped.includes(i) || matched.has(i);
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              aria-label={up ? card.face : "Kartu tertutup"}
              className={cn(
                "grid min-h-0 place-items-center rounded-2xl border-2 text-[clamp(24px,6vh,52px)] transition-all duration-200 active:scale-95",
                up
                  ? "border-brand-300 bg-white shadow-card"
                  : "border-transparent bg-brand-500 shadow-lift hover:bg-brand-600",
                matched.has(i) && "border-brand-500 bg-brand-50"
              )}
            >
              <span className={cn("transition-opacity duration-150", up ? "opacity-100" : "opacity-0")}>
                {card.face}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-5">
        <p className="text-lg font-extrabold text-ink-soft">
          {done ? `Selesai dalam ${moves} langkah!` : `${moves} langkah`}
        </p>
        <button
          onClick={onNewGame}
          className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-white px-5 text-base font-extrabold text-ink-soft shadow-card transition active:scale-95 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        >
          <RotateCcw className="h-5 w-5" strokeWidth={2.4} /> Main lagi
        </button>
      </div>
    </div>
  );
}
