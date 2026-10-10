<script lang="ts">
  import type { Mark } from "#lib/sudoku-types.ts";
  import UnitItem from "./UnitItem.svelte";

  let {
    group,
    digits,
    hideDone,
    values,
    done,
    onToggle,
  }: {
    group: { id: string; name: string };
    digits: number[];
    hideDone: boolean;
    values: (key: string) => Mark[];
    done: (key: string) => boolean;
    onToggle: (key: string, index: number) => void;
  } = $props();
</script>

<section>
  <div class="section-title">
    <h2>{group.name}</h2>
    <span
      >{digits.filter((n) => done(group.id + n)).length}/9
      complete</span
    >
  </div>
  {#each digits.filter((n) => !hideDone || !done(group.id + n)) as n (n)}
    {@const key = group.id + n}
    <UnitItem
      {key}
      groupName={group.name}
      number={n}
      {digits}
      values={values(key)}
      done={done(key)}
      onToggle={(index) => onToggle(key, index)}
    />
  {/each}
  {#if hideDone && digits.every((n) => done(group.id + n))}<p
      class="muted"
    >
      All completed ✓
    </p>{/if}
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
</style>
