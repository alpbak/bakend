export function printUsage(): void {
  console.log(`Bakend — PocketBase + Functions + Jobs

Usage:
  bak init [name]                         Create a new Bakend project
  bak start [--config <path>] [--watch]   Start the Bakend server
  bak dev [--config <path>]               Start with function and job hot reload
  bak functions list                      List registered function triggers
  bak jobs list                           List registered jobs
  bak jobs runs <name>                    Show recent runs for a job
  bak migrate status [--config <path>]    Diff collections/*.json vs database
  bak migrate apply [--config <path>]     Apply collection JSON files to database
  bak migrate export [--config <path>]    Export database schemas to collections/*.json
  bak backup create [--output <path>]     Create backup archive of database and storage
  bak backup restore <archive> [--force]  Restore from backup archive
  bak storage prune [--config <path>]     Remove orphan files not referenced by records
  bak version                             Print Bakend version
  bak --help                              Show this help message
`);
}
