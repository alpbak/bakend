<script lang="ts">
  import { base } from "$app/paths";
  import { apiFetch } from "$lib/api";
  import type { CollectionDefinition, FieldDefinition } from "$lib/types";

  let name = $state("");
  let fields = $state<FieldDefinition[]>([{ name: "title", type: "string", required: true }]);
  let error = $state("");

  const fieldTypes = ["string", "text", "integer", "float", "boolean", "datetime", "json", "relation", "file"];

  function addField() {
    fields = [...fields, { name: "", type: "string" }];
  }

  function removeField(index: number) {
    fields = fields.filter((_, i) => i !== index);
  }

  async function save(event: SubmitEvent) {
    event.preventDefault();
    error = "";

    const definition: CollectionDefinition = {
      name,
      fields: fields.filter((field) => field.name.trim().length > 0),
    };

    try {
      await apiFetch("/api/admin/collections", {
        method: "POST",
        body: JSON.stringify(definition),
      });
      window.location.href = `${base}/collections/${name}`;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to create collection";
    }
  }
</script>

<h1>New collection</h1>

{#if error}
  <p class="error">{error}</p>
{/if}

<form class="card" onsubmit={save}>
  <div class="field">
    <label for="name">Name</label>
    <input id="name" bind:value={name} pattern="[a-z][a-z0-9_]*" required />
  </div>

  <h2>Fields</h2>
  {#each fields as field, index}
    <div class="field-row">
      <input bind:value={field.name} placeholder="field_name" required />
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
    <button class="primary" type="submit">Create</button>
  </div>
</form>

<style>
  .field-row {
    display: grid;
    grid-template-columns: 1fr 140px auto auto auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .inline {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin: 0;
    white-space: nowrap;
  }
</style>
