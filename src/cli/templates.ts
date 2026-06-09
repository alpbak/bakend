export function gitignoreTemplate(): string {
  return `bakend.db
storage/
.bakend-cache/
.DS_Store
`;
}

export function readmeTemplate(projectName: string): string {
  return `# ${projectName}

Bakend project — PocketBase + Functions + Jobs.

## Start

\`\`\`bash
bak start
\`\`\`

Open [http://localhost:8080/_/](http://localhost:8080/_/) for the admin dashboard.

## Docs

- [Getting started](https://alpbak.github.io/bakend/docs/user-guide/getting-started/)
- [Collections](https://alpbak.github.io/bakend/docs/user-guide/collections/)
`;
}

export function bakendJsonTemplate(jwtSecret: string): string {
  const config = {
    port: 8080,
    database: "./bakend.db",
    storage: "./storage",
    logLevel: "INFO",
    auth: {
      jwtSecret,
      accessTokenTtl: "15m",
      refreshTokenTtl: "7d",
    },
  };
  return `${JSON.stringify(config, null, 2)}\n`;
}
