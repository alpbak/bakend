<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { JobInfo, JobRun } from "$lib/types";

  let items = $state<JobInfo[]>([]);
  let runs = $state<Record<string, JobRun[]>>({});
  let error = $state("");

  async function load() {
    try {
      const body = await apiFetch<{ items: JobInfo[] }>("/api/admin/jobs");
      items = body.items;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load jobs";
    }
  }

  async function toggleRuns(name: string) {
    if (runs[name]) {
      const next = { ...runs };
      delete next[name];
      runs = next;
      return;
    }

    try {
      const body = await apiFetch<{ items: JobRun[] }>(`/api/admin/jobs/${name}/runs`);
      runs = { ...runs, [name]: body.items };
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load runs";
    }
  }

  onMount(load);
</script>

<h1>Jobs</h1>
<p class="muted">Scheduled jobs and recent run history.</p>

{#if error}
  <p class="error">{error}</p>
{/if}

{#each items as job}
  <section class="card job">
    <div class="job-header">
      <div>
        <strong>{job.name}</strong>
        <div class="muted">{job.schedule}</div>
        <code>{job.filePath}</code>
      </div>
      <button type="button" onclick={() => toggleRuns(job.name)}>
        {runs[job.name] ? "Hide runs" : "Show runs"}
      </button>
    </div>

    {#if runs[job.name]}
      <table>
        <thead>
          <tr>
            <th>Started</th>
            <th>Status</th>
            <th>Attempt</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {#each runs[job.name] as run}
            <tr>
              <td>{new Date(run.startedAt).toLocaleString()}</td>
              <td>{run.status}</td>
              <td>{run.attempt}</td>
              <td>{run.error ?? ""}</td>
            </tr>
          {:else}
            <tr><td colspan="4" class="muted">No runs yet.</td></tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
{:else}
  <p class="muted">No jobs registered.</p>
{/each}

<style>
  .job {
    margin-bottom: 1rem;
  }

  .job-header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: start;
    margin-bottom: 0.75rem;
  }
</style>
