<script lang="ts">
  import { asset, resolve } from "$app/paths";
  import { onMount } from "svelte";

  let { children } = $props();

  onMount(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker
        .register(asset("sw.js"), { scope: resolve("/") })
        .catch(console.warn);
  });
</script>

<svelte:head>
  <meta name="theme-color" content="#142139" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <link rel="manifest" href={asset("manifest.webmanifest")} />
  <link rel="apple-touch-icon" href={asset("icon.png")} />
</svelte:head>

{@render children()}
