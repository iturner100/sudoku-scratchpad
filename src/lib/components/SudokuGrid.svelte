<script lang="ts">
  import type { CellState } from "#lib/sudoku-types.ts";
  import { userExcludedCount, availableCount } from "#lib/sudoku-types.ts";
  import { CELL_COUNT, rowOf, colOf } from "#lib/sudoku-grid.ts";
  import Cell from "./Cell.svelte";

  let {
    cells,
    onOpenEditor,
  }: {
    cells: CellState[];
    onOpenEditor: (cellIndex: number) => void;
  } = $props();

  let indices = $derived(Array.from({ length: CELL_COUNT }, (_, i) => i));
</script>

<div class="board">
  <div class="grid">
    {#each indices as cellIndex (cellIndex)}
      <div
        class="cell-wrap"
        class:box-right={colOf(cellIndex) % 3 === 2 && colOf(cellIndex) !== 8}
        class:box-bottom={rowOf(cellIndex) % 3 === 2 &&
          rowOf(cellIndex) !== 8}
      >
        <Cell
          {cellIndex}
          state={cells[cellIndex]}
          userExcludedCount={userExcludedCount(cellIndex, cells)}
          availableCount={availableCount(cellIndex, cells)}
          onOpenEditor={() => onOpenEditor(cellIndex)}
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .board {
    border: 2px solid var(--ink);
    border-radius: 8px;
    overflow: hidden;
    padding: 2px;
    background: var(--border);
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 2px;
    background: var(--border);
  }
  .cell-wrap {
    display: contents;
  }
  .cell-wrap.box-right :global(.cell) {
    border-right: 3px solid var(--ink);
  }
  .cell-wrap.box-bottom :global(.cell) {
    border-bottom: 3px solid var(--ink);
  }
</style>
