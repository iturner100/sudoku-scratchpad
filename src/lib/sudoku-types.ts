import { CELL_COUNT } from "./sudoku-grid";
import { peersOf } from "./sudoku-grid";

/** Per-cell state for one of the 81 physical cells in the grid. */
export type CellState = {
  /** The confirmed digit (1-9) for this cell, or null if not confirmed. */
  confirmed: number | null;
  /** Manual pencil-mark excludes, length 9, index = digit - 1. */
  excluded: boolean[];
  /** Independent user "I've dealt with this cell" checklist flag. */
  processed: boolean;
};

export function freshCell(): CellState {
  return { confirmed: null, excluded: Array(9).fill(false), processed: false };
}

export function freshCells(): CellState[] {
  return Array.from({ length: CELL_COUNT }, freshCell);
}

export type Puzzle = { id: string; name: string; cells: CellState[] };

/**
 * Count of digits (1-9) still available for this cell: not manually
 * excluded, and not auto-locked because a peer (same row/column/box) is
 * already confirmed with that digit. Mirrors CellEditor's live status
 * derivation. Returns 0 if the cell itself is already confirmed.
 */
export function availableDigitCount(
  cellIndex: number,
  cells: CellState[],
): number {
  const cell = cells[cellIndex];
  if (cell.confirmed !== null) return 0;
  const peers = peersOf(cellIndex);
  let count = 0;
  for (let digit = 1; digit <= 9; digit++) {
    if (cell.excluded[digit - 1]) continue;
    if (peers.some((p) => cells[p].confirmed === digit)) continue;
    count++;
  }
  return count;
}
