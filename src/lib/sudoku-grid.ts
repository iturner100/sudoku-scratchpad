/**
 * Index/group/peer math for a 9x9 Sudoku grid, 0-based, row-major.
 * Cell index = row * 9 + col.
 * Boxes are numbered 0-8, flowing across then down (box 0 = top-left,
 * box 2 = top-right, box 3 = middle-left, ... box 8 = bottom-right).
 */

export const GRID_SIZE = 9;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;

export function index(row: number, col: number): number {
  return row * GRID_SIZE + col;
}

export function rowOf(i: number): number {
  return Math.floor(i / GRID_SIZE);
}

export function colOf(i: number): number {
  return i % GRID_SIZE;
}

export function boxOf(i: number): number {
  const r = rowOf(i);
  const c = colOf(i);
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

export function rowCells(row: number): number[] {
  return Array.from({ length: GRID_SIZE }, (_, col) => index(row, col));
}

export function colCells(col: number): number[] {
  return Array.from({ length: GRID_SIZE }, (_, row) => index(row, col));
}

export function boxCells(box: number): number[] {
  const boxRow = Math.floor(box / 3) * 3;
  const boxCol = (box % 3) * 3;
  const cells: number[] = [];
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      cells.push(index(boxRow + dr, boxCol + dc));
    }
  }
  return cells;
}

/** The 20 other cells sharing this cell's row, column, or box. */
export function peersOf(i: number): number[] {
  const seen = new Set<number>();
  for (const cell of rowCells(rowOf(i))) seen.add(cell);
  for (const cell of colCells(colOf(i))) seen.add(cell);
  for (const cell of boxCells(boxOf(i))) seen.add(cell);
  seen.delete(i);
  return [...seen];
}
