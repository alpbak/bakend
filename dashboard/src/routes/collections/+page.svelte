<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { apiFetch } from "$lib/api";
  import type { CollectionMeta } from "$lib/types";

  let items = $state<CollectionMeta[]>([]);
  let error = $state("");

  async function load() {
    try {
      const body = await apiFetch<{ items: CollectionMeta[] }>("/api/admin/collections");
      items = body.items;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load collections";
    }
  }

  async function remove(name: string) {
    if (!confirm(`Delete collection "${name}"?`)) {
      return;
    }

    try {
      await apiFetch(`/api/admin/collections/${name}`, { method: "DELETE" });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete collection";
    }
  }

  onMount(load);
</script>

<div class="header">
  <h1>Collections</h1>
  <a class="button primary" href="{base}/collections/new">New collection</a>
</div>

{#if error}
  <p class="error">{error}</p>
{/if}

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Fields</th>
      <th>Updated</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each items as item}
      <tr>
        <td><a href="{base}/collections/{item.name}">{item.name}</a></td>
        <td>{item.definition.fields.length}</td>
        <td>{new Date(item.updatedAt).toLocaleString()}</td>
        <td class="actions">
          <a class="button" href="{base}/collections/{item.name}">Edit</a>
          <button class="danger" type="button" onclick={() => remove(item.name)}>Delete</button>
        </td>
      </tr>
    {:else}
      <tr><td colspan="4" class="muted">No collections yet.</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
