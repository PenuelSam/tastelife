/**
 * Fixed scatter layout for the 14 slots of every lane (12-column grid).
 * col: grid-column; mt: extra top offset in px; ar: aspect ratio.
 */
export type Slot = { col: string; mt: number; ar: string };

export const DESKTOP_SLOTS: Slot[] = [
  { col: "1 / span 4", mt: 0, ar: "3 / 4" },
  { col: "6 / span 2", mt: 80, ar: "2 / 3" },
  { col: "9 / span 3", mt: 0, ar: "4 / 5" },
  { col: "2 / span 2", mt: 40, ar: "1 / 1" },
  { col: "5 / span 3", mt: 0, ar: "3 / 4" },
  { col: "10 / span 3", mt: 100, ar: "2 / 3" },
  { col: "1 / span 3", mt: 60, ar: "4 / 5" },
  { col: "6 / span 4", mt: 0, ar: "3 / 2" },
  { col: "11 / span 2", mt: 20, ar: "3 / 4" },
  { col: "3 / span 2", mt: 0, ar: "2 / 3" },
  { col: "7 / span 2", mt: 90, ar: "1 / 1" },
  { col: "9 / span 4", mt: 30, ar: "3 / 4" },
  { col: "1 / span 2", mt: 0, ar: "3 / 4" },
  { col: "5 / span 3", mt: 50, ar: "4 / 5" },
];

export const MOBILE_SLOTS: Slot[] = [
  { col: "1 / span 7", mt: 0, ar: "3 / 4" },
  { col: "8 / span 5", mt: 70, ar: "2 / 3" },
  { col: "2 / span 6", mt: 10, ar: "4 / 5" },
  { col: "9 / span 4", mt: 0, ar: "1 / 1" },
  { col: "1 / span 5", mt: 30, ar: "2 / 3" },
  { col: "7 / span 6", mt: 0, ar: "3 / 4" },
  { col: "3 / span 7", mt: 20, ar: "4 / 5" },
  { col: "1 / span 5", mt: 0, ar: "1 / 1" },
  { col: "7 / span 6", mt: 50, ar: "2 / 3" },
  { col: "2 / span 6", mt: 0, ar: "3 / 4" },
  { col: "8 / span 5", mt: 40, ar: "4 / 5" },
  { col: "1 / span 7", mt: 0, ar: "3 / 2" },
  { col: "8 / span 5", mt: 30, ar: "3 / 4" },
  { col: "3 / span 6", mt: 0, ar: "2 / 3" },
];

/** Parallax speed per slot; mobile uses half. */
export const PARALLAX = [0.1, -0.06, 0.14, -0.1, 0.04, 0.12, -0.08, 0.08, -0.12, 0.06, -0.04, 0.1, -0.07, 0.09];

/** "3 / 4" → 0.75 */
export function ratio(ar: string): number {
  const [w, h] = ar.split("/").map((n) => parseFloat(n));
  return w / h;
}
