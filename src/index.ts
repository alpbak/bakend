#!/usr/bin/env bun

import { start } from "./cli/start.ts";

function printUsage(): void {
  console.log(`Bakend — PocketBase + Functions + Jobs

Usage:
  bak start [--config <path>] [--watch]   Start the Bakend server
  bak dev [--config <path>]               Start with function hot reload
  bak --help                              Show this help message
`);
}

function parseArgs(argv: string[]): {
  command?: string;
  configPath?: string;
  watch: boolean;
  help: boolean;
} {
  const args = argv.slice(2);
  let command: string | undefined;
  let configPath: string | undefined;
  let watch = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      help = true;
      continue;
    }

    if (arg === "--config") {
      configPath = args[index + 1];
      if (!configPath) {
        throw new Error("Missing value for --config");
      }
      index += 1;
      continue;
    }

    if (arg === "--watch") {
      watch = true;
      continue;
    }

    if (!command) {
      command = arg;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { command, configPath, watch, help };
}

async function main(): Promise<void> {
  try {
    const { command, configPath, watch, help } = parseArgs(process.argv);

    if (help || !command) {
      printUsage();
      process.exit(help ? 0 : 1);
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

    console.error(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

await main();
