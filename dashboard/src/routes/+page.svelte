<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";

  let stats = $state({
    collections: 0,
    users: 0,
    files: 0,
    jobs: 0,
  });

  let error = $state("");

  onMount(async () => {
    try {
      const [collections, users, storage, jobs] = await Promise.all([
        apiFetch<{ items: unknown[] }>("/api/admin/collections"),
        apiFetch<{ total: number }>("/api/admin/users"),
        apiFetch<{ total: number }>("/api/admin/storage"),
        apiFetch<{ items: unknown[] }>("/api/admin/jobs"),
      ]);

      stats = {
        collections: collections.items.length,
        users: users.total,
        files: storage.total,
        jobs: jobs.items.length,
      };
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load overview";
    }
  });
</script>

<h1>Overview</h1>
<p class="muted">Administration dashboard for your Bakend instance.</p>

{#if error}
  <p class="error">{error}</p>
{/if}

<div class="grid">
  <div class="card"><strong>{stats.collections}</strong><span>Collections</span></div>
  <div class="card"><strong>{stats.users}</strong><span>Users</span></div>
  <div class="card"><strong>{stats.files}</strong><span>Files</span></div>
  <div class="card"><strong>{stats.jobs}</strong><span>Jobs</span></div>
</div>

<style>
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card strong {
    font-size: 1.75rem;
  }

  .card span {
    color: var(--muted);
    font-size: 0.9rem;
  }
</style>
