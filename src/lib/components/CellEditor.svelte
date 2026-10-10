<script lang="ts">
  import type { CellState, Puzzle } from "#lib/sudoku-types.ts";
  import { autoExcludedOf } from "#lib/sudoku-types.ts";
  import { rowOf, colOf } from "#lib/sudoku-grid.ts";

  let {
    cellIndex,
    puzzle,
    onChange,
  }: {
    cellIndex: number;
    puzzle: Puzzle;
    onChange: (next: CellState) => void;
  } = $props();

  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  let state = $derived(puzzle.cells[cellIndex]);
  let autoExcluded = $derived(autoExcludedOf(cellIndex, puzzle.cells));

  type Status = "available" | "excluded" | "confirmed" | "locked-excluded";

  function statusOf(digit: number): Status {
    const s = state;
    if (s.confirmed === digit) return "confirmed";
    if (s.confirmed !== null) return "locked-excluded";
    if (autoExcluded[digit - 1]) return "locked-excluded";
    return s.userExcluded[digit - 1] ? "excluded" : "available";
  }

  function toggle(digit: number) {
    const status = statusOf(digit);
    if (status === "locked-excluded") return;

    if (status === "confirmed") {
      onChange({
        ...state,
        confirmed: null,
        userExcluded: Array(9).fill(false),
      });
      return;
    }

    if (status === "available") {
      const userExcluded = [...state.userExcluded];
      userExcluded[digit - 1] = true;
      onChange({ ...state, userExcluded });
      return;
    }

    // status === "excluded" -> confirm it
    onChange({ ...state, confirmed: digit });
  }
</script>

<div class="editor">
  <h3>Row {rowOf(cellIndex) + 1}, Column {colOf(cellIndex) + 1}</h3>
  <div class="digits">
    {#each digits as digit (digit)}
      {@const status = statusOf(digit)}
      <button
        type="button"
        class="digit"
        class:excluded={status === "excluded" || status === "locked-excluded"}
        class:confirmed={status === "confirmed"}
        class:locked={status === "locked-excluded"}
        disabled={status === "locked-excluded"}
        aria-label={`${digit}, ${status}`}
        onclick={() => toggle(digit)}
        ><span>{digit}</span>{#if status === "locked-excluded"}<i>🔒</i
          >{:else if status === "confirmed"}<i>✓</i>{/if}</button
      >
    {/each}
  </div>
</div>

<style>
  .editor {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  h3 {
    margin: 0;
    font-size: 15px;
  }
  .digits {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .digit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: var(--soft);
    font-size: clamp(16px, 6vw, 24px);
    font-weight: 600;
    min-width: 0;
    touch-action: manipulation;
  }
  .digit.excluded {
    color: var(--muted);
    opacity: 0.55;
  }
  .digit.excluded span {
    text-decoration: line-through;
  }
  .digit.locked {
    cursor: not-allowed;
  }
  .digit.confirmed {
    background: #d4f5e7;
    color: #076447;
  }
  .digit i {
    font-size: 13px;
    font-style: normal;
    line-height: 1;
  }
  :global(.dark) .digit.confirmed {
    background: #175642;
    color: #b4ffe0;
  }
</style>
