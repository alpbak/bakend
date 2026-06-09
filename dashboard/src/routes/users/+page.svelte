<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch, type AuthUser } from "$lib/api";

  let items = $state<AuthUser[]>([]);
  let error = $state("");

  async function load() {
    try {
      const body = await apiFetch<{ items: AuthUser[] }>("/api/admin/users");
      items = body.items;
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to load users";
    }
  }

  async function updateRole(user: AuthUser, role: string) {
    try {
      await apiFetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to update user";
    }
  }

  async function remove(user: AuthUser) {
    if (!confirm(`Delete user ${user.email}?`)) return;
    try {
      await apiFetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to delete user";
    }
  }

  onMount(load);
</script>

<h1>Users</h1>

{#if error}
  <p class="error">{error}</p>
{/if}

<table>
  <thead>
    <tr>
      <th>Email</th>
      <th>Role</th>
      <th>Created</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {#each items as user}
      <tr>
        <td>{user.email}</td>
        <td>
          <select value={user.role} onchange={(e) => updateRole(user, e.currentTarget.value)}>
            <option value="admin">admin</option>
            <option value="authenticated">authenticated</option>
            <option value="public">public</option>
          </select>
        </td>
        <td>{new Date(user.createdAt).toLocaleString()}</td>
        <td>
          <button class="danger" type="button" onclick={() => remove(user)}>Delete</button>
        </td>
      </tr>
    {:else}
      <tr><td colspan="4" class="muted">No users.</td></tr>
    {/each}
  </tbody>
</table>
