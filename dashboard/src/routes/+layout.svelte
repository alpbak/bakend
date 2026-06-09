<script lang="ts">
  import "../app.css";
  import { base } from "$app/paths";
  import { page } from "$app/stores";
  import { logout } from "$lib/api";

  let { children, data } = $props();

  const nav = [
    { href: `${base}/`, label: "Overview" },
    { href: `${base}/collections`, label: "Collections" },
    { href: `${base}/users`, label: "Users" },
    { href: `${base}/storage`, label: "Storage" },
    { href: `${base}/functions`, label: "Functions" },
    { href: `${base}/jobs`, label: "Jobs" },
    { href: `${base}/logs`, label: "Logs" },
  ];

  const isLogin = $derived($page.url.pathname.endsWith("/login"));
</script>

{#if isLogin}
  {@render children()}
{:else}
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">Bakend</div>
      <nav>
        {#each nav as item}
          <a href={item.href} class:active={$page.url.pathname === item.href}>{item.label}</a>
        {/each}
      </nav>
      <div class="sidebar-footer">
        <div class="muted">{data.user?.email}</div>
        <button
          type="button"
          onclick={() => {
            logout();
            window.location.href = `${base}/login`;
          }}
        >
          Log out
        </button>
      </div>
    </aside>
    <main class="content">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  .shell {
    display: grid;
    grid-template-columns: 220px 1fr;
    min-height: 100vh;
  }

  .sidebar {
    background: #111827;
    color: white;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .brand {
    font-weight: 700;
    font-size: 1.1rem;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  nav a {
    color: #d1d5db;
    padding: 0.45rem 0.6rem;
    border-radius: 6px;
  }

  nav a.active,
  nav a:hover {
    background: #1f2937;
    color: white;
    text-decoration: none;
  }

  .sidebar-footer {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .content {
    padding: 1.25rem;
  }
</style>
