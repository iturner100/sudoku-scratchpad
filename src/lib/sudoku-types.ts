export type Mark = 0 | 1 | 2;
export type Puzzle = { id: string; name: string; marks: Record<string, Mark[]> };
