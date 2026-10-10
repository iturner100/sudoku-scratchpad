<script lang="ts">
  import type { CellState } from "#lib/sudoku-types.ts";
  import { rowOf, colOf } from "#lib/sudoku-grid.ts";

  let {
    cellIndex,
    state,
    userExcludedCount,
    availableCount,
    onOpenEditor,
  }: {
    cellIndex: number;
    state: CellState;
    userExcludedCount: number;
    availableCount: number;
    onOpenEditor: () => void;
  } = $props();

  let label = $derived(
    `Row ${rowOf(cellIndex) + 1}, Column ${colOf(cellIndex) + 1}`,
  );
</script>

<button
  type="button"
  class="cell"
  class:confirmed={state.confirmed !== null}
  aria-label={label}
  onclick={onOpenEditor}
>
  {#if state.confirmed !== null}
    <span class="digit">{state.confirmed}</span>
  {:else if userExcludedCount > 0}
    <span class="exclusions">{userExcludedCount} / {availableCount}</span>
  {:else}
    <span class="exclusions">{availableCount}</span>
  {/if}
</button>

<style>
  .cell {
    position: relative;
    aspect-ratio: 1;
    min-width: 40px;
    min-height: 40px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--soft);
    touch-action: manipulation;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .digit {
    font-size: clamp(14px, 4vw, 20px);
    font-weight: 700;
    color: var(--ink);
  }
  .exclusions {
    font-size: clamp(9px, 2.2vw, 12px);
    font-weight: 400;
    color: var(--muted);
  }
  .cell.confirmed {
    background: var(--panel);
    border-color: #2b9877;
  }
</style>
