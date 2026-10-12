import { CELL_COUNT } from "./sudoku-grid";
import { peersOf } from "./sudoku-grid";

/** Per-cell state for one of the 81 physical cells in the grid. */
export type CellState = {
	/** The confirmed digit (1-9) for this cell, or null if not confirmed. */
	confirmed: number | null;
	/** Values the user has explicitly excluded, length 9, index = digit - 1. */
	userExcluded: boolean[];
};

export function freshCell(): CellState {
	return { confirmed: null, userExcluded: Array(9).fill(false) };
}

export function freshCells(): CellState[] {
	return Array.from({ length: CELL_COUNT }, freshCell);
}

export type Puzzle = { id: string; name: string; cells: CellState[] };

/**
 * Values auto-excluded for this cell because a peer (same row/column/box)
 * is already confirmed with that digit. Computed live from the puzzle's
 * current cells every call - never stored.
 */
export function autoExcludedOf(cellIndex: number, cells: CellState[]): boolean[] {
	const peers = peersOf(cellIndex);
	return Array.from({ length: 9 }, (_, i) => {
		const digit = i + 1;
		return peers.some((p) => cells[p].confirmed === digit);
	});
}

/**
 * Effective excluded set for this cell: explicitly excluded by the user,
 * OR auto-excluded because a peer is confirmed with that digit.
 */
export function excludedOf(cellIndex: number, cells: CellState[]): boolean[] {
	const auto = autoExcludedOf(cellIndex, cells);
	const cell = cells[cellIndex];
	return auto.map((isAuto, i) => isAuto || cell.userExcluded[i]);
}

/** A cell is "processed" once the user has manually excluded any digit. */
export function isProcessed(cell: CellState): boolean {
	return cell.userExcluded.some(Boolean);
}

/**
 * Count of digits (1-9) explicitly excluded by the user for this cell.
 */
export function userExcludedCount(cellIndex: number, cells: CellState[]): number {
	const cell = cells[cellIndex];
	
	const autoExcluded = autoExcludedOf(cellIndex, cells).flatMap((value, index) => value ? [index + 1] : []);
	const userExcluded = cell.userExcluded.flatMap((value, index) => value ? [index + 1] : []);
	const remaining = userExcluded.filter(ue => !autoExcluded.includes(ue));

	return remaining.length;
}

/**
 * Count of digits (1-9) "available" for this cell before considering the
 * user's own manual excludes - i.e. not auto-excluded by a confirmed peer.
 * This is the pool of candidates the user is choosing among.
 */
export function availableCount(cellIndex: number, cells: CellState[]): number {
	return autoExcludedOf(cellIndex, cells).filter((excluded) => !excluded).length;
}
