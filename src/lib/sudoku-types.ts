import { CELL_COUNT } from "./sudoku-grid";

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
