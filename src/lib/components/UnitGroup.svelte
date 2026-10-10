<script lang="ts">
  import type { CellState } from "#lib/sudoku-types.ts";
  import { userExcludedCount, availableCount, isProcessed } from "#lib/sudoku-types.ts";
  import { rowCells, colCells, boxCells } from "#lib/sudoku-grid.ts";
  import Cell from "./Cell.svelte";

  let {
    groupIndex,
    kind,
    cells,
    hideDone,
    onOpenEditor,
  }: {
    groupIndex: number;
    kind: "row" | "col" | "box";
    cells: CellState[];
    hideDone: boolean;
    onOpenEditor: (cellIndex: number) => void;
  } = $props();

  let label = $derived(
    kind === "row"
      ? `Row ${groupIndex + 1}`
      : kind === "col"
        ? `Column ${groupIndex + 1}`
        : `Box ${groupIndex + 1}`,
  );

  let indices = $derived(
    kind === "row"
      ? rowCells(groupIndex)
      : kind === "col"
        ? colCells(groupIndex)
        : boxCells(groupIndex),
  );

  const isDone = (cellIndex: number) =>
    cells[cellIndex].confirmed !== null || isProcessed(cells[cellIndex]);

  let doneCount = $derived(indices.filter((i) => isDone(i)).length);
  let visible = $derived(indices.filter((i) => !hideDone || !isDone(i)));
  let allDone = $derived(indices.every((i) => isDone(i)));
</script>

<section>
  <div class="section-title">
    <h2>{label}</h2>
    <span>{doneCount}/9 complete</span>
  </div>
  {#if hideDone && allDone}
    <p class="muted">All completed ✓</p>
  {:else}
    <div class="cells">
      {#each visible as cellIndex (cellIndex)}
        <Cell
          {cellIndex}
          state={cells[cellIndex]}
          userExcludedCount={userExcludedCount(cells[cellIndex])}
          availableCount={availableCount(cellIndex, cells)}
          onOpenEditor={() => onOpenEditor(cellIndex)}
        />
      {/each}
    </div>
  {/if}
</section>

<style>
  .muted {
    color: var(--muted);
    font-size: 12px;
  }
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 18px 2px 9px;
  }
  .section-title h2 {
    font-size: 15px;
    margin: 0;
  }
  .section-title span {
    font-size: 12px;
    color: var(--muted);
  }
  .cells {
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 4px;
  }
</style>
