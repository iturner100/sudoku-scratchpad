<script lang="ts">
  import { base } from "$app/paths";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register(`${base}/sw.js`, { scope: `${base}/` })
        .catch(console.warn);
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#142139" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="manifest" href="{base}/manifest.webmanifest" />
  <link rel="apple-touch-icon" href="{base}/icon.png" />
</svelte:head>

{@render children()}
