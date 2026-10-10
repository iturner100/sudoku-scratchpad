<script lang="ts">
  import type { Mark } from "#lib/sudoku-types.ts";

  let {
    key,
    groupName,
    number,
    digits,
    values,
    done,
    onToggle,
  }: {
    key: string;
    groupName: string;
    number: number;
    digits: number[];
    values: Mark[];
    done: boolean;
    onToggle: (index: number) => void;
  } = $props();
</script>

<div class:finished={done} class="unit">
  <div class="unit-name">
    <b>{key}</b><small
      >{done ? "Done" : `${values.filter((v) => v !== 0).length}/9`}</small
    >
  </div>
  <div class="digits">
    {#each digits as digit (digit)}{@const status = values[digit - 1]}<button
        class="digit"
        class:excluded={status === 1}
        class:confirmed={status === 2}
        aria-label={`${groupName} ${number}, ${digit}, ${["available", "excluded", "confirmed"][status]}`}
        onclick={() => onToggle(digit - 1)}
        ><span>{digit}</span>{#if status === 1}<i>×</i
          >{:else if status === 2}<i>✓</i>{/if}</button
      >{/each}
  </div>
</div>

<style>
  .unit {
    display: flex;
    align-items: center;
    gap: 7px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 7px 6px;
    margin: 5px 0;
  }
  .unit.finished {
    border-color: #2b9877;
  }
  .unit-name {
    width: 32px;
    flex-shrink: 0;
    text-align: center;
  }
  .unit-name b {
    display: block;
    font-size: 12px;
  }
  .unit-name small {
    font-size: 9px;
    color: var(--muted);
  }
  .digits {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(9, minmax(0, 1fr));
    gap: 3px;
    min-width: 0;
  }
  .digit {
    position: relative;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: var(--soft);
    font-size: clamp(12px, 3.6vw, 18px);
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
  .digit.confirmed {
    background: #d4f5e7;
    color: #076447;
  }
  .digit i {
    position: absolute;
    right: 1px;
    top: -3px;
    font-size: 10px;
    font-style: normal;
  }
  .digit.excluded i {
    display: none;
  }
  :global(.dark) .digit.confirmed {
    background: #175642;
    color: #b4ffe0;
  }
  @media (min-width: 500px) {
    .unit {
      padding: 9px 12px;
      gap: 12px;
    }
    .unit-name {
      width: 42px;
    }
    .digits {
      gap: 6px;
    }
    .digit {
      font-size: 18px;
    }
  }
</style>
