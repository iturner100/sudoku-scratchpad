<script lang="ts">
  import { onMount } from "svelte";
  import type { Mark, Puzzle } from "#lib/sudoku-types.ts";
  import UnitGroup from "#lib/components/UnitGroup.svelte";
  const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const groups = [
    { id: "R", name: "Rows" },
    { id: "C", name: "Columns" },
    { id: "B", name: "3×3 Boxes" },
  ];
  const fresh = (name: string): Puzzle => ({
    id: crypto.randomUUID(),
    name,
    marks: {},
  });
  let puzzles = $state<Puzzle[]>([]),
    selected = $state(""),
    hideDone = $state(false),
    dark = $state(false),
    loaded = $state(false);
  let history = $state<{ id: string; key: string; previous: Mark[] }[]>([]);
  let action = $state<"new" | "rename" | "reset" | "delete" | null>(null),
    entry = $state("");
  let active = $derived(puzzles.find((p) => p.id === selected));
  const values = (p: Puzzle, key: string): Mark[] =>
    p.marks[key] ?? [0, 0, 0, 0, 0, 0, 0, 0, 0];
  const done = (p: Puzzle, key: string) =>
    values(p, key).filter((x) => x === 2).length === 1 &&
    values(p, key).every((x) => x !== 0);
  let count = $derived(
    active
      ? groups.reduce(
          (total, g) =>
            total + digits.filter((n) => done(active!, g.id + n)).length,
          0,
        )
      : 0,
  );
  function change(key: string, index: number) {
    if (!active) return;
    const previous = [...values(active, key)];
    const next = [...previous] as Mark[];
    next[index] = ((next[index] + 1) % 3) as Mark;
    history = [...history.slice(-99), { id: selected, key, previous }];
    puzzles = puzzles.map((p) =>
      p.id === selected ? { ...p, marks: { ...p.marks, [key]: next } } : p,
    );
  }
  function undo() {
    const i = history.findLastIndex((h) => h.id === selected);
    if (i < 0) return;
    const h = history[i];
    history = history.filter((_, j) => i !== j);
    puzzles = puzzles.map((p) =>
      p.id === selected
        ? { ...p, marks: { ...p.marks, [h.key]: h.previous } }
        : p,
    );
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
        p.id === selected ? { ...p, marks: {} } : p,
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
        localStorage.getItem("sudoku-scratchpad-v1") || "null",
      );
      if (data && Array.isArray(data.puzzles)) {
        puzzles = data.puzzles;
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
          "sudoku-scratchpad-v1",
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
        <p class="muted">Your deductions, all 27 units.</p>
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
          <strong>{count} / 27 completed</strong><span class="muted"
            >Tap digits: available → excluded → confirmed</span
          >
        </div>
        <div class="bar">
          <div style={`width:${(count / 27) * 100}%`}></div>
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
        <span>○ Available</span><span>× Excluded</span><span>✓ Confirmed</span>
      </div>
      {#each groups as group (group.id)}
        <UnitGroup
          {group}
          {digits}
          {hideDone}
          values={(key: string) => values(active!, key)}
          done={(key: string) => done(active!, key)}
          onToggle={(key: string, index: number) => change(key, index)}
        />
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
