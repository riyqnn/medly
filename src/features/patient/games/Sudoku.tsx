"use client";

import { useCallback, useState } from "react";
import { Check, Eraser, Lightbulb, RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Grid = number[]; // 81 cells, 0 = empty

const LEVELS = {
  Mudah: 40,
  Sedang: 32,
  Sulit: 26,
} as const;
type Level = keyof typeof LEVELS;

const shuffled = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

function legal(g: Grid, i: number, v: number) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === v && r * 9 + k !== i) return false;
    if (g[k * 9 + c] === v && k * 9 + c !== i) return false;
    const bi = (br + Math.floor(k / 3)) * 9 + bc + (k % 3);
    if (g[bi] === v && bi !== i) return false;
  }
  return true;
}

/** Fills an empty grid by backtracking in random order — the finished puzzle. */
function solve(g: Grid): boolean {
  const i = g.indexOf(0);
  if (i === -1) return true;
  for (const v of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
    if (legal(g, i, v)) {
      g[i] = v;
      if (solve(g)) return true;
      g[i] = 0;
    }
  }
  return false;
}

/** Counts up to 2 solutions — enough to know whether the puzzle is unique. */
function countSolutions(g: Grid, cap = 2): number {
  const i = g.indexOf(0);
  if (i === -1) return 1;
  let n = 0;
  for (let v = 1; v <= 9 && n < cap; v++) {
    if (legal(g, i, v)) {
      g[i] = v;
      n += countSolutions(g, cap - n);
      g[i] = 0;
    }
  }
  return n;
}

/**
 * Digs holes out of a solved grid, keeping every puzzle uniquely solvable —
 * a puzzle with two answers marks a correct move wrong, which is worse than
 * no puzzle at all.
 */
function generate(clues: number): { puzzle: Grid; solution: Grid } {
  const solution: Grid = new Array(81).fill(0);
  solve(solution);

  const puzzle = [...solution];
  let remaining = 81;
  for (const i of shuffled(Array.from({ length: 81 }, (_, k) => k))) {
    if (remaining <= clues) break;
    const saved = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions([...puzzle]) !== 1) puzzle[i] = saved;
    else remaining--;
  }
  return { puzzle, solution };
}

/**
 * Changing difficulty or asking for a new puzzle remounts the board, so play
 * state can't survive into a grid it doesn't belong to.
 */
export function Sudoku() {
  const [level, setLevel] = useState<Level>("Mudah");
  const [seed, setSeed] = useState(0);
  return (
    <Board
      key={`${level}-${seed}`}
      level={level}
      onLevel={setLevel}
      onNewPuzzle={() => setSeed((s) => s + 1)}
    />
  );
}

function Board({
  level,
  onLevel,
  onNewPuzzle,
}: {
  level: Level;
  onLevel: (l: Level) => void;
  onNewPuzzle: () => void;
}) {
  // Generation backtracks over the whole grid; never redo it on a re-render.
  const [{ puzzle, solution }] = useState(() => generate(LEVELS[level]));

  const [cells, setCells] = useState<Grid>(puzzle);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const given = useCallback((i: number) => puzzle[i] !== 0, [puzzle]);
  const solved = cells.every((v, i) => v === solution[i]);

  function place(v: number) {
    if (selected === null || given(selected)) return;
    setCells((c) => c.map((x, i) => (i === selected ? v : x)));
    setChecked(false);
  }

  function hint() {
    const empty = cells.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (!empty.length) return;
    const i = empty[Math.floor(Math.random() * empty.length)];
    setCells((c) => c.map((x, k) => (k === i ? solution[i] : x)));
    setSelected(i);
  }

  const selectedValue = selected !== null ? cells[selected] : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-4 sm:flex-row sm:items-stretch sm:justify-center sm:gap-8">
      <div className="flex min-h-0 items-center">
        <div
          className={cn(
            "grid aspect-square h-full max-h-full w-auto max-w-full grid-cols-9 overflow-hidden rounded-2xl border-4 border-ink bg-ink",
            solved && "ring-4 ring-brand-400"
          )}
          style={{ gap: 1 }}
        >
          {cells.map((v, i) => {
            const r = Math.floor(i / 9);
            const c = i % 9;
            const isGiven = given(i);
            const wrong = checked && v !== 0 && v !== solution[i];
            const peer =
              selected !== null &&
              (Math.floor(selected / 9) === r ||
                selected % 9 === c ||
                (Math.floor(Math.floor(selected / 9) / 3) === Math.floor(r / 3) &&
                  Math.floor((selected % 9) / 3) === Math.floor(c / 3)));
            const twin = selectedValue !== 0 && v === selectedValue;

            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  "grid place-items-center bg-white text-[clamp(14px,3.2vh,30px)] font-extrabold transition-colors",
                  // The 3×3 blocks are drawn with margins, so the board reads
                  // as nine boxes rather than eighty-one squares.
                  c % 3 === 0 && c !== 0 && "ml-[3px]",
                  r % 3 === 0 && r !== 0 && "mt-[3px]",
                  isGiven ? "text-ink" : "text-brand-600",
                  peer && "bg-brand-50",
                  twin && v !== 0 && "bg-brand-100",
                  selected === i && "bg-brand-200",
                  wrong && "bg-red-100 text-red-600"
                )}
              >
                {v !== 0 ? v : ""}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-col justify-center gap-4 sm:w-64">
        <div className="flex gap-2">
          {(Object.keys(LEVELS) as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => onLevel(l)}
              className={cn(
                "flex-1 rounded-2xl border px-2 py-2.5 text-sm font-extrabold transition active:scale-95",
                level === l
                  ? "border-brand-500 bg-brand-500 text-white shadow-lift"
                  : "border-line bg-white text-ink-soft shadow-card hover:border-brand-300"
              )}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => place(n)}
              className="grid h-14 place-items-center rounded-2xl border border-line bg-white text-2xl font-extrabold text-ink shadow-card transition active:scale-90 hover:border-brand-300 hover:bg-brand-50"
            >
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <GameButton onClick={() => place(0)} icon={Eraser} label="Hapus" />
          <GameButton onClick={hint} icon={Lightbulb} label="Bantuan" />
          <GameButton onClick={() => setChecked(true)} icon={Check} label="Periksa" />
          <GameButton onClick={onNewPuzzle} icon={RotateCcw} label="Baru" />
        </div>

        <p
          className={cn(
            "text-center text-base font-extrabold",
            solved ? "text-brand-600" : "text-ink-mute"
          )}
        >
          {solved ? "Selesai! Semua benar." : "Pilih kotak, lalu tekan angka."}
        </p>
      </div>
    </div>
  );
}

function GameButton({
  onClick,
  icon: Icon,
  label,
}: {
  onClick: () => void;
  icon: typeof Check;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-line bg-white text-sm font-extrabold text-ink-soft shadow-card transition active:scale-90 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} /> {label}
    </button>
  );
}
