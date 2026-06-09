#!/usr/bin/env bun

import { parseArgs } from "./cli/args.ts";
import { backupCreate, backupRestore } from "./cli/backup.ts";
import { functionsList } from "./cli/functions-cmd.ts";
import { initProject } from "./cli/init.ts";
import { jobsList, jobsRuns } from "./cli/jobs-cmd.ts";
import {
  migrateApply,
  migrateExport,
  migrateStatus,
  printMigrateStatus,
} from "./cli/migrate.ts";
import { openProject } from "./cli/project-context.ts";
import { printStoragePruneResult, storagePrune } from "./cli/storage-cmd.ts";
import { start } from "./cli/start.ts";
import { printUsage } from "./cli/usage.ts";
import { VERSION } from "./version.ts";

async function main(): Promise<void> {
  try {
    const parsed = parseArgs(process.argv);

    if (parsed.help || !parsed.command) {
      printUsage();
      process.exit(parsed.help ? 0 : 1);
      return;
    }

    const { command, subcommand, positional, configPath, watch, force, output } = parsed;

    if (command === "init") {
      const projectName = subcommand && !subcommand.startsWith("-") ? subcommand : positional[0];
      const projectDir = initProject({ name: projectName });
      console.log(`Created Bakend project at ${projectDir}`);
      return;
    }

    if (command === "start") {
      await start({ configPath, watch });
      return;
    }

    if (command === "dev") {
      await start({ configPath, watch: true });
      return;
    }

    if (command === "version") {
      console.log(VERSION);
      return;
    }

    if (command === "functions") {
      if (subcommand !== "list") {
        throw new Error('Usage: bak functions list');
      }

      const context = await openProject({ configPath, loadJobs: false });
      try {
        functionsList(context);
      } finally {
        context.close();
      }
      return;
    }

    if (command === "jobs") {
      const context = await openProject({ configPath, loadFunctions: false });

      try {
        if (subcommand === "list") {
          jobsList(context);
          return;
        }

        if (subcommand === "runs") {
          const name = positional[0];
          if (!name) {
            throw new Error("Usage: bak jobs runs <name>");
          }
          jobsRuns(context, name);
          return;
        }

        throw new Error("Usage: bak jobs list | bak jobs runs <name>");
      } finally {
        context.close();
      }
    }

    if (command === "migrate") {
      const context = await openProject({
        configPath,
        loadFunctions: false,
        loadJobs: false,
      });

      try {
        if (subcommand === "status") {
          printMigrateStatus(migrateStatus(context));
          return;
        }

        if (subcommand === "apply") {
          const applied = migrateApply(context);
          if (applied.length === 0) {
            console.log("No collection changes to apply.");
          } else {
            for (const line of applied) {
              console.log(line);
            }
          }
          return;
        }

        if (subcommand === "export") {
          const exported = migrateExport(context);
          if (exported.length === 0) {
            console.log("No collections to export.");
          } else {
            console.log(`Exported ${exported.length} collection(s): ${exported.join(", ")}`);
          }
          return;
        }

        throw new Error("Usage: bak migrate status | apply | export");
      } finally {
        context.close();
      }
    }

    if (command === "backup") {
      if (subcommand === "create") {
        const archivePath = await backupCreate(configPath ?? "./bakend.json", output);
        console.log(`Backup created: ${archivePath}`);
        return;
      }

      if (subcommand === "restore") {
        const archive = positional[0];
        if (!archive) {
          throw new Error("Usage: bak backup restore <archive> [--force]");
        }
        await backupRestore(configPath ?? "./bakend.json", archive, force);
        console.log("Backup restored.");
        return;
      }

      throw new Error("Usage: bak backup create | bak backup restore <archive>");
    }

    if (command === "storage") {
      if (subcommand !== "prune") {
        throw new Error("Usage: bak storage prune");
      }

      const context = await openProject({
        configPath,
        loadFunctions: false,
        loadJobs: false,
      });

      try {
        const removed = await storagePrune(context);
        printStoragePruneResult(removed);
      } finally {
        context.close();
      }
      return;
    }

    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

await main();
