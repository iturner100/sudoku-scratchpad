<script lang="ts">
  import { onMount } from "svelte";
  import type { CellState, Puzzle } from "#lib/sudoku-types.ts";
  import { freshCells } from "#lib/sudoku-types.ts";
  import UnitGroup from "#lib/components/UnitGroup.svelte";
  import CellEditor from "#lib/components/CellEditor.svelte";

  const sections: { kind: "row" | "col" | "box"; name: string }[] = [
    { kind: "row", name: "Rows" },
    { kind: "col", name: "Columns" },
    { kind: "box", name: "3×3 Boxes" },
  ];

  const fresh = (name: string): Puzzle => ({
    id: crypto.randomUUID(),
    name,
    cells: freshCells(),
  });

  let puzzles = $state<Puzzle[]>([]),
    selected = $state(""),
    hideDone = $state(false),
    dark = $state(false),
    loaded = $state(false);
  let history = $state<
    { id: string; cellIndex: number; previous: CellState }[]
  >([]);
  let action = $state<"new" | "rename" | "reset" | "delete" | null>(null),
    entry = $state("");
  let editingCellIndex = $state<number | null>(null);

  let active = $derived(puzzles.find((p) => p.id === selected));
  let count = $derived(
    active ? active.cells.filter((c) => c.confirmed !== null).length : 0,
  );

  function snapshot(cellIndex: number, previous: CellState) {
    history = [...history.slice(-99), { id: selected, cellIndex, previous }];
  }

  function writeCell(cellIndex: number, next: CellState) {
    puzzles = puzzles.map((p) =>
      p.id === selected
        ? {
            ...p,
            cells: p.cells.map((c, i) => (i === cellIndex ? next : c)),
          }
        : p,
    );
  }

  function handleCellChange(cellIndex: number, next: CellState) {
    if (!active) return;
    const previous = active.cells[cellIndex];
    snapshot(cellIndex, previous);
    writeCell(cellIndex, next);
  }

  function openEditor(cellIndex: number) {
    editingCellIndex = cellIndex;
  }

  function closeEditor() {
    editingCellIndex = null;
  }

  function undo() {
    const i = history.findLastIndex((h) => h.id === selected);
    if (i < 0) return;
    const h = history[i];
    history = history.filter((_, j) => i !== j);
    writeCell(h.cellIndex, h.previous);
  }

  function confirm() {
    if (action === "new") {
      const p = fresh(entry.trim() || `Puzzle ${puzzles.length + 1}`);
      puzzles = [...puzzles, p];
      selected = p.id;
      history = [];
    } else if (action === "rename" && entry.trim()) {
      puzzles = puzzles.map((p) =>
        p.id === selected ? { ...p, name: entry.trim() } : p,
      );
    } else if (action === "reset") {
      puzzles = puzzles.map((p) =>
        p.id === selected ? { ...p, cells: freshCells() } : p,
      );
      history = [];
    } else if (action === "delete") {
      puzzles = puzzles.filter((p) => p.id !== selected);
      if (!puzzles.length) puzzles = [fresh("Puzzle 1")];
      selected = puzzles[0].id;
      history = [];
    }
    action = null;
  }

  onMount(() => {
    try {
      const data = JSON.parse(
        localStorage.getItem("sudoku-scratchpad-v2") || "null",
      );
      if (data && Array.isArray(data.puzzles)) {
        puzzles = data.puzzles.map((p: Puzzle) => ({
          ...p,
          cells: p.cells.map((c: any) => ({
            confirmed: c.confirmed ?? null,
            userExcluded: c.userExcluded ?? c.excluded ?? Array(9).fill(false),
          })),
        }));
        selected = data.selected;
        hideDone = !!data.hideDone;
        dark = !!data.dark;
      }
    } catch (e) {
      console.warn(e);
    }
    if (!puzzles.length) puzzles = [fresh("Puzzle 1")];
    if (!puzzles.some((p) => p.id === selected)) selected = puzzles[0].id;
    loaded = true;
  });
  $effect(() => {
    if (loaded)
      try {
        localStorage.setItem(
          "sudoku-scratchpad-v2",
          JSON.stringify({ puzzles, selected, hideDone, dark }),
        );
      } catch (e) {
        console.warn("Save failed", e);
      }
  });
</script>

<svelte:head
  ><title>Sudoku Scratchpad</title><meta
    name="description"
    content="Track your deductions while solving Sudoku on paper"
  /></svelte:head
>
<div class:dark class="app">
  <main>
    <header>
      <div>
        <p class="eyebrow">PAPER PUZZLE COMPANION</p>
        <h1>Sudoku Scratchpad</h1>
        <p class="muted">Your deductions, all 81 cells.</p>
      </div>
      <button
        class="appearance"
        onclick={() => (dark = !dark)}
        aria-label="Toggle dark mode">{dark ? "☀" : "☾"}</button
      >
    </header>
    {#if active}
      <div class="panel picker">
        <div class="grow">
          <label for="puzzle">Current puzzle</label><select
            id="puzzle"
            bind:value={selected}
            onchange={() => (history = [])}
            >{#each puzzles as p (p.id)}<option value={p.id}>{p.name}</option
              >{/each}</select
          >
        </div>
        <button
          class="primary"
          onclick={() => {
            entry = "";
            action = "new";
          }}>+ New</button
        ><button
          onclick={() => {
            entry = active?.name ?? "";
            action = "rename";
          }}>Rename</button
        >
      </div>
      <div class="panel summary">
        <div>
          <strong>{count} / 81 confirmed</strong><span class="muted"
            >Tap a cell to edit its candidates and confirm a digit.</span
          >
        </div>
        <div class="bar">
          <div style={`width:${(count / 81) * 100}%`}></div>
        </div>
      </div>
      <div class="controls">
        <label class="toggle"
          ><input type="checkbox" bind:checked={hideDone} /> Hide completed units</label
        ><button
          onclick={undo}
          disabled={!history.some((h) => h.id === selected)}>↶ Undo</button
        >
      </div>
      <div class="legend">
        <span>Not processed</span><span>Processed</span><span>Confirmed digit</span>
      </div>
      {#each sections as section (section.kind)}
        <h2 class="section-heading">{section.name}</h2>
        {#each Array.from({ length: 9 }, (_, i) => i) as groupIndex (groupIndex)}
          <UnitGroup
            {groupIndex}
            kind={section.kind}
            cells={active.cells}
            {hideDone}
            onOpenEditor={openEditor}
          />
        {/each}
      {/each}
      <footer>
        <button onclick={() => (action = "reset")}>Reset puzzle</button><button
          class="danger-link"
          onclick={() => (action = "delete")}>Delete puzzle</button
        >
        <p class="muted">
          Automatically saved on this device. Works offline after first visit.
        </p>
      </footer>
    {/if}
  </main>
  {#if action}<div class="backdrop">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Puzzle action"
      >
        <h2>
          {action === "new"
            ? "New puzzle"
            : action === "rename"
              ? "Rename puzzle"
              : action === "reset"
                ? "Reset puzzle?"
                : "Delete puzzle?"}
        </h2>
        {#if action === "new" || action === "rename"}<label for="entry"
            >Puzzle name</label
          ><input
            id="entry"
            bind:value={entry}
            onkeydown={(e) => {
              if (e.key === "Enter") confirm();
            }}
          />{:else}<p>
            {action === "reset"
              ? "All markings will be cleared."
              : "This puzzle and its markings will be deleted."} This cannot be undone.
          </p>{/if}
        <div class="dialog-actions">
          <button onclick={() => (action = null)}>Cancel</button><button
            class:danger={action === "reset" || action === "delete"}
            class="primary"
            disabled={action === "rename" && !entry.trim()}
            onclick={confirm}
            >{action === "new"
              ? "Create"
              : action === "rename"
                ? "Save"
                : action === "reset"
                  ? "Reset"
                  : "Delete"}</button
          >
        </div>
      </div>
    </div>{/if}
  {#if editingCellIndex !== null && active}<div class="backdrop">
      <div
        class="dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Edit cell"
      >
        <CellEditor
          cellIndex={editingCellIndex}
          puzzle={active}
          onChange={(next) => handleCellChange(editingCellIndex!, next)}
        />
        <div class="dialog-actions">
          <button class="primary" onclick={closeEditor}>Close</button>
        </div>
      </div>
    </div>{/if}
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }
  :global(body) {
    margin: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
  :global(button),
  :global(input),
  :global(select) {
    font: inherit;
  }
  .app {
    --bg: #f3f6fa;
    --panel: #fff;
    --ink: #17253b;
    --muted: #66788f;
    --border: #dce4ee;
    --soft: #edf2f8;
    --accent: #245ac0;
    min-height: 100vh;
    background: var(--bg);
    color: var(--ink);
    padding: 20px 12px 45px;
  }
  .dark {
    --bg: #101a2b;
    --panel: #1c2a40;
    --ink: #ecf2ff;
    --muted: #b0bfd2;
    --border: #3c4b61;
    --soft: #2b3a52;
    --accent: #8cb4ff;
  }
  main {
    max-width: 620px;
    margin: auto;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 20px;
  }
  h1 {
    font-size: 26px;
    letter-spacing: -0.7px;
    margin: 0;
  }
  .eyebrow {
    color: var(--accent);
    font-size: 10px;
    letter-spacing: 0.14em;
    font-weight: 800;
    margin: 0 0 6px;
  }
  .muted {
    color: var(--muted);
    font-size: 12px;
  }
  header .muted {
    margin: 5px 0 0;
  }
  button {
    cursor: pointer;
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--ink);
    border-radius: 9px;
    padding: 9px 11px;
    font-size: 13px;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .appearance {
    font-size: 20px;
  }
  .panel {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 12px;
  }
  .picker {
    display: flex;
    align-items: end;
    gap: 8px;
    flex-wrap: wrap;
  }
  .grow {
    flex: 1;
    min-width: 145px;
  }
  label {
    display: block;
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 5px;
  }
  select,
  .dialog input {
    width: 100%;
    border: 1px solid var(--border);
    background: var(--panel);
    color: var(--ink);
    padding: 10px;
    border-radius: 8px;
  }
  .primary {
    background: #245ac0;
    color: white;
    border-color: #245ac0;
  }
  .summary strong {
    display: block;
    font-size: 17px;
  }
  .summary .muted {
    display: block;
    margin-top: 5px;
  }
  .bar {
    height: 7px;
    background: var(--soft);
    border-radius: 20px;
    overflow: hidden;
    margin-top: 12px;
  }
  .bar div {
    height: 100%;
    background: #268a6a;
  }
  .controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin: 18px 0;
  }
  .toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    font-size: 13px;
    color: var(--ink);
  }
  .toggle input {
    width: 17px;
    height: 17px;
    accent-color: #245ac0;
  }
  .legend {
    display: flex;
    gap: 15px;
    font-size: 11px;
    color: var(--muted);
    margin: 0 0 18px;
  }
  .section-heading {
    font-size: 19px;
    margin: 28px 2px 0;
  }
  footer {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
    margin: 26px 0;
  }
  footer p {
    flex-basis: 100%;
    text-align: center;
  }
  .danger-link {
    color: #c54a52;
  }
  .backdrop {
    position: fixed;
    inset: 0;
    background: #0009;
    display: grid;
    place-items: center;
    padding: 18px;
  }
  .dialog {
    background: var(--panel);
    padding: 24px;
    border-radius: 15px;
    width: min(100%, 360px);
    box-shadow: 0 15px 45px #0004;
  }
  .dialog h2 {
    margin: 0 0 16px;
    font-size: 20px;
  }
  .dialog p {
    font-size: 14px;
  }
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }
  .danger {
    background: #b93844;
    color: white;
    border-color: #b93844;
  }
</style>
