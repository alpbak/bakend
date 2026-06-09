<script lang="ts">
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { apiFetch } from "$lib/api";
  import type { CollectionMeta, FieldDefinition } from "$lib/types";

  const fieldTypes = ["string", "text", "integer", "float", "boolean", "datetime", "json", "relation", "file"];
  const permissionRules = ["public", "authenticated", "owner", "admin"];

  let collection = $state<CollectionMeta | null>(null);
  let records = $state<Record<string, unknown>[]>([]);
  let error = $state("");
  let recordJson = $state("{}");

  const collectionName = $derived($page.params.name ?? "");

  async function load() {
    error = "";
    try {
      collection = await apiFetch<CollectionMeta>(`/api/admin/collections/${collectionName}`);
      const recordBody = await apiFetch<{ items: Record<string, unknown>[] }>(
        `/api/${collectionName}`,
      );
      records = recordBody.items;
      recordJson = "{}";
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load collection";
    }
  }

  function addField() {
    if (!collection) return;
    collection.definition.fields = [...collection.definition.fields, { name: "", type: "string" }];
  }

  function removeField(index: number) {
    if (!collection) return;
    collection.definition.fields = collection.definition.fields.filter((_, i) => i !== index);
  }

  async function saveSchema(event: SubmitEvent) {
    event.preventDefault();
    if (!collection) return;

    try {
      await apiFetch(`/api/admin/collections/${collectionName}`, {
        method: "PUT",
        body: JSON.stringify(collection.definition),
      });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to update schema";
    }
  }

  async function createRecord(event: SubmitEvent) {
    event.preventDefault();
    try {
      const data = JSON.parse(recordJson) as Record<string, unknown>;
      await apiFetch(`/api/${collectionName}`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to create record";
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm(`Delete record ${id}?`)) return;
    try {
      await apiFetch(`/api/${collectionName}/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete record";
    }
  }

  onMount(load);
</script>

<h1>{collectionName}</h1>
<a class="muted" href="{base}/collections">← Back to collections</a>

{#if error}
  <p class="error">{error}</p>
{/if}

{#if collection}
  <form class="card" onsubmit={saveSchema}>
    <h2>Schema</h2>
    {#each collection.definition.fields as field, index}
      <div class="field-row">
        <input bind:value={field.name} required />
        <select bind:value={field.type}>
          {#each fieldTypes as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
        <label class="inline"><input type="checkbox" bind:checked={field.required} /> required</label>
        {#if field.type === "relation"}
          <input bind:value={field.collection} placeholder="target collection" />
        {/if}
        <button type="button" onclick={() => removeField(index)}>Remove</button>
      </div>
    {/each}

    <div class="actions">
      <button type="button" onclick={addField}>Add field</button>
      <button class="primary" type="submit">Save schema</button>
    </div>

    <h2>Permissions</h2>
    {#if !collection.definition.permissions}
      {@const _ = (collection.definition.permissions = {})}
    {/if}
    <div class="perm-grid">
      {#each ["create", "read", "update", "delete"] as operation}
        <div class="field">
          <label for="perm-{operation}">{operation}</label>
          <select
            id="perm-{operation}"
            bind:value={collection.definition.permissions![operation as keyof typeof collection.definition.permissions]}
          >
            <option value={undefined}>default (public)</option>
            {#each permissionRules as rule}
              <option value={rule}>{rule}</option>
            {/each}
          </select>
        </div>
      {/each}
    </div>
  </form>

  <section class="card records">
    <h2>Records</h2>
    <form class="record-form" onsubmit={createRecord}>
      <label for="record-json">Create record (JSON)</label>
      <textarea id="record-json" rows="4" bind:value={recordJson}></textarea>
      <button class="primary" type="submit">Create record</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Data</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each records as record}
          <tr>
            <td>{String(record.id)}</td>
            <td><pre>{JSON.stringify(record, null, 2)}</pre></td>
            <td>
              <button class="danger" type="button" onclick={() => deleteRecord(String(record.id))}>
                Delete
              </button>
            </td>
          </tr>
        {:else}
          <tr><td colspan="3" class="muted">No records.</td></tr>
        {/each}
      </tbody>
    </table>
  </section>
{/if}

<style>
  .field-row,
  .perm-grid {
    display: grid;
    gap: 0.5rem;
  }

  .field-row {
    grid-template-columns: 1fr 140px auto auto auto;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .perm-grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .inline {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
  }

  .records {
    margin-top: 1rem;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    font-size: 0.8rem;
  }

  .record-form {
    margin-bottom: 1rem;
  }
</style>
