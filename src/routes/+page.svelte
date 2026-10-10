<script lang="ts">
  import { onMount } from "svelte";
  type Mark = 0 | 1 | 2;
  type Puzzle = { id: string; name: string; marks: Record<string, Mark[]> };
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
        <section>
          <div class="section-title">
            <h2>{group.name}</h2>
            <span
              >{digits.filter((n) => done(active!, group.id + n)).length}/9
              complete</span
            >
          </div>
          {#each digits.filter((n) => !hideDone || !done(active!, group.id + n)) as n (n)}
            {@const key = group.id + n}
            <div class:finished={done(active!, key)} class="unit">
              <div class="unit-name">
                <b>{key}</b><small
                  >{done(active!, key)
                    ? "Done"
                    : `${values(active!, key).filter((v) => v !== 0).length}/9`}</small
                >
              </div>
              <div class="digits">
                {#each digits as digit (digit)}{@const status = values(
                    active!,
                    key,
                  )[digit - 1]}<button
                    class="digit"
                    class:excluded={status === 1}
                    class:confirmed={status === 2}
                    aria-label={`${group.name} ${n}, ${digit}, ${["available", "excluded", "confirmed"][status]}`}
                    onclick={() => change(key, digit - 1)}
                    ><span>{digit}</span>{#if status === 1}<i>×</i
                      >{:else if status === 2}<i>✓</i>{/if}</button
                  >{/each}
              </div>
            </div>
          {/each}
          {#if hideDone && digits.every((n) => done(active!, group.id + n))}<p
              class="muted"
            >
              All completed ✓
            </p>{/if}
        </section>
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
  .section-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 24px 2px 9px;
  }
  .section-title h2 {
    font-size: 17px;
    margin: 0;
  }
  .section-title span {
    font-size: 12px;
    color: var(--muted);
  }
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
  .dark .digit.confirmed {
    background: #175642;
    color: #b4ffe0;
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
