<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { FunctionTrigger } from "$lib/types";

  let items = $state<FunctionTrigger[]>([]);
  let error = $state("");

  onMount(async () => {
    try {
      const body = await apiFetch<{ items: FunctionTrigger[] }>("/api/admin/functions");
      items = body.items;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load functions";
    }
  });
</script>

<h1>Functions</h1>
<p class="muted">Registered function triggers (read-only).</p>

{#if error}
  <p class="error">{error}</p>
{/if}

<table>
  <thead>
    <tr>
      <th>Collection</th>
      <th>Type</th>
      <th>Event</th>
      <th>File</th>
    </tr>
  </thead>
  <tbody>
    {#each items as item}
      <tr>
        <td>{item.collection}</td>
        <td>{item.type}</td>
        <td>{item.eventType}</td>
        <td><code>{item.filePath}</code></td>
      </tr>
    {:else}
      <tr><td colspan="4" class="muted">No function triggers registered.</td></tr>
    {/each}
  </tbody>
</table>
