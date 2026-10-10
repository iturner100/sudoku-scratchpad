<script lang="ts">
  import type { CellState } from "#lib/sudoku-types.ts";
  import { rowOf, colOf } from "#lib/sudoku-grid.ts";

  let {
    cellIndex,
    state,
    availableCount,
    onToggleProcessed,
    onOpenEditor,
  }: {
    cellIndex: number;
    state: CellState;
    availableCount: number;
    onToggleProcessed: () => void;
    onOpenEditor: () => void;
  } = $props();

  let label = $derived(
    `Row ${rowOf(cellIndex) + 1}, Column ${colOf(cellIndex) + 1}`,
  );

  const LONG_PRESS_MS = 500;
  const MOVE_TOLERANCE = 10;

  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let longPressFired = false;
  let startX = 0;
  let startY = 0;

  function clearTimer() {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function handlePointerDown(event: PointerEvent) {
    longPressFired = false;
    startX = event.clientX;
    startY = event.clientY;
    clearTimer();
    longPressTimer = setTimeout(() => {
      longPressFired = true;
      longPressTimer = null;
      onOpenEditor();
    }, LONG_PRESS_MS);
  }

  function handlePointerMove(event: PointerEvent) {
    if (longPressTimer === null) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.hypot(dx, dy) > MOVE_TOLERANCE) {
      clearTimer();
    }
  }

  function handlePointerUp() {
    clearTimer();
  }

  function handlePointerCancel() {
    clearTimer();
    longPressFired = false;
  }

  function handleClick(event: MouseEvent) {
    if (longPressFired) {
      longPressFired = false;
      event.preventDefault();
      return;
    }
    if (event.ctrlKey) {
      onOpenEditor();
      return;
    }
    onToggleProcessed();
  }
</script>

<button
  type="button"
  class="cell"
  class:confirmed={state.confirmed !== null}
  class:processed={state.processed}
  aria-label={label}
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onclick={handleClick}
>
  {#if state.confirmed !== null}
    <span class="digit">{state.confirmed}</span>
  {:else}
    <span class="available">{availableCount}</span>
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
  .cell.processed {
    background: var(--accent);
    border-color: var(--accent);
  }
  .digit {
    font-size: clamp(14px, 4vw, 20px);
    font-weight: 700;
    color: var(--ink);
  }
  .available {
    font-size: clamp(9px, 2.2vw, 12px);
    font-weight: 400;
    color: var(--muted);
  }
  .cell.confirmed {
    background: var(--panel);
    border-color: #2b9877;
  }
</style>
