export interface ParsedArgs {
  command?: string;
  subcommand?: string;
  positional: string[];
  configPath?: string;
  watch: boolean;
  help: boolean;
  force: boolean;
  output?: string;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let command: string | undefined;
  let subcommand: string | undefined;
  const positional: string[] = [];
  let configPath: string | undefined;
  let watch = false;
  let help = false;
  let force = false;
  let output: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) {
      continue;
    }

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

    if (arg === "--force" || arg === "-f") {
      force = true;
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      output = args[index + 1];
      if (!output) {
        throw new Error("Missing value for --output");
      }
      index += 1;
      continue;
    }

    if (!command) {
      command = arg;
      continue;
    }

    if (!subcommand && !arg.startsWith("-")) {
      subcommand = arg;
      continue;
    }

    if (!arg.startsWith("-")) {
      positional.push(arg);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { command, subcommand, positional, configPath, watch, help, force, output };
}
