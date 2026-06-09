import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { bakendJsonTemplate, gitignoreTemplate, readmeTemplate } from "./templates.ts";

export interface InitOptions {
  name?: string;
  cwd?: string;
}

function isDirectoryEmpty(dir: string): boolean {
  if (!existsSync(dir)) {
    return true;
  }

  const entries = readdirSync(dir).filter((entry) => entry !== ".git");
  return entries.length === 0;
}

function resolveProjectDir(options: InitOptions): string {
  const cwd = resolve(options.cwd ?? process.cwd());

  if (options.name) {
    return resolve(cwd, options.name);
  }

  return cwd;
}

export function initProject(options: InitOptions = {}): string {
  const projectDir = resolveProjectDir(options);
  const projectName = options.name ?? projectDir.split("/").pop() ?? "myapp";

  if (existsSync(projectDir) && !isDirectoryEmpty(projectDir)) {
    throw new Error(`Directory is not empty: ${projectDir}`);
  }

  mkdirSync(join(projectDir, "collections"), { recursive: true });
  mkdirSync(join(projectDir, "functions"), { recursive: true });
  mkdirSync(join(projectDir, "jobs"), { recursive: true });

  const jwtSecret = randomUUID();
  writeFileSync(join(projectDir, "bakend.json"), bakendJsonTemplate(jwtSecret), "utf8");
  writeFileSync(join(projectDir, ".gitignore"), gitignoreTemplate(), "utf8");
  writeFileSync(join(projectDir, "README.md"), readmeTemplate(projectName), "utf8");

  return projectDir;
}
