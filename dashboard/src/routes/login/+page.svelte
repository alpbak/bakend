<script lang="ts">
  import { base } from "$app/paths";
  import { login } from "$lib/api";

  let email = $state("admin@example.com");
  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = "";

    try {
      const user = await login(email, password);
      if (user.role !== "admin") {
        throw new Error("Admin access required");
      }
      window.location.href = `${base}/`;
    } catch (err) {
      error = err instanceof Error ? err.message : "Login failed";
    } finally {
      loading = false;
    }
  }
</script>

<div class="login">
  <form class="card" onsubmit={handleSubmit}>
    <h1>Bakend Admin</h1>
    <p class="muted">Sign in with an admin account.</p>

    {#if error}
      <p class="error">{error}</p>
    {/if}

    <div class="field">
      <label for="email">Email</label>
      <input id="email" type="email" bind:value={email} required />
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input id="password" type="password" bind:value={password} required />
    </div>

    <button class="primary" type="submit" disabled={loading}>
      {loading ? "Signing in..." : "Sign in"}
    </button>
  </form>
</div>

<style>
  .login {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 1rem;
  }

  form {
    width: min(100%, 380px);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  h1 {
    margin: 0;
  }
</style>
