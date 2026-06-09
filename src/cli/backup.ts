import { $ } from "bun";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { loadProjectConfig } from "../core/config/load-project.ts";

function defaultBackupPath(projectDir: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join(projectDir, `bakend-backup-${stamp}.tar.gz`);
}

export async function backupCreate(configPath: string, outputPath?: string): Promise<string> {
  const { projectDir, config } = loadProjectConfig({ configPath });
  const databasePath = config.database;
  const storagePath = config.storage;
  const archivePath = outputPath
    ? resolve(projectDir, outputPath)
    : defaultBackupPath(projectDir);

  if (!existsSync(databasePath)) {
    throw new Error(`Database file not found: ${databasePath}`);
  }

  mkdirSync(dirname(archivePath), { recursive: true });

  const stagingDir = join(projectDir, `.bakend-backup-${Date.now()}`);
  mkdirSync(stagingDir, { recursive: true });

  try {
    await $`cp ${databasePath} ${join(stagingDir, basename(databasePath))}`.quiet();

    if (existsSync(storagePath)) {
      await $`cp -R ${storagePath} ${join(stagingDir, "storage")}`.quiet();
    } else {
      mkdirSync(join(stagingDir, "storage"), { recursive: true });
    }

    await $`tar -czf ${archivePath} -C ${stagingDir} .`.quiet();
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }

  return archivePath;
}

export async function backupRestore(
  configPath: string,
  archivePath: string,
  force: boolean,
): Promise<void> {
  const { projectDir, config } = loadProjectConfig({ configPath });
  const databasePath = config.database;
  const storagePath = config.storage;
  const resolvedArchive = resolve(projectDir, archivePath);

  if (!existsSync(resolvedArchive)) {
    throw new Error(`Backup archive not found: ${resolvedArchive}`);
  }

  if (!force && (existsSync(databasePath) || existsSync(storagePath))) {
    throw new Error(
      "Target database or storage already exists. Re-run with --force to overwrite.",
    );
  }

  const stagingDir = join(projectDir, `.bakend-restore-${Date.now()}`);
  mkdirSync(stagingDir, { recursive: true });

  try {
    await $`tar -xzf ${resolvedArchive} -C ${stagingDir}`.quiet();

    const extractedDb = join(stagingDir, basename(databasePath));
    const extractedStorage = join(stagingDir, "storage");

    if (!existsSync(extractedDb)) {
      throw new Error(`Backup archive is missing database file: ${basename(databasePath)}`);
    }

    mkdirSync(dirname(databasePath), { recursive: true });
    await $`cp ${extractedDb} ${databasePath}`.quiet();

    if (existsSync(storagePath)) {
      rmSync(storagePath, { recursive: true, force: true });
    }

    if (existsSync(extractedStorage)) {
      await $`cp -R ${extractedStorage} ${storagePath}`.quiet();
    } else {
      mkdirSync(storagePath, { recursive: true });
    }
  } finally {
    rmSync(stagingDir, { recursive: true, force: true });
  }
}
