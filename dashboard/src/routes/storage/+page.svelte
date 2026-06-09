<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { FileMetadata } from "$lib/types";

  let items = $state<FileMetadata[]>([]);
  let error = $state("");
  let visibility = $state("protected");

  async function load() {
    try {
      const body = await apiFetch<{ items: FileMetadata[] }>("/api/admin/storage");
      items = body.items;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load files";
    }
  }

  async function upload(event: SubmitEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("visibility", visibility);

    try {
      const token = sessionStorage.getItem("bakend_token");
      const response = await fetch("/api/storage/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: data,
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Upload failed");
      }

      form.reset();
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Upload failed";
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this file?")) return;
    try {
      await apiFetch(`/api/storage/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete file";
    }
  }

  onMount(load);
</script>

<h1>Storage</h1>

{#if error}
  <p class="error">{error}</p>
{/if}

<form class="card upload" onsubmit={upload}>
  <div class="field">
    <label for="file">Upload file</label>
    <input id="file" type="file" required />
  </div>
  <div class="field">
    <label for="visibility">Visibility</label>
    <select id="visibility" bind:value={visibility}>
      <option value="protected">protected</option>
      <option value="public">public</option>
    </select>
  </div>
  <button class="primary" type="submit">Upload</button>
</form>

<table>
  <thead>
    <tr>
      <th>Filename</th>
      <th>Size</th>
      <th>Visibility</th>
      <th>Created</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each items as file}
      <tr>
        <td>
          <a href="/api/storage/{file.id}" target="_blank" rel="noreferrer">{file.filename}</a>
        </td>
        <td>{file.size} bytes</td>
        <td>{file.visibility}</td>
        <td>{new Date(file.createdAt).toLocaleString()}</td>
        <td>
          <button class="danger" type="button" onclick={() => remove(file.id)}>Delete</button>
        </td>
      </tr>
    {:else}
      <tr><td colspan="5" class="muted">No files.</td></tr>
    {/each}
  </tbody>
</table>

<style>
  .upload {
    margin-bottom: 1rem;
  }
</style>
