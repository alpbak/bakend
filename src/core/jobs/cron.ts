import { JobsError } from "./types.ts";

type CronField = {
  min: number;
  max: number;
};

const FIELDS: CronField[] = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 6 },
];

function parseFieldPart(part: string, field: CronField): Set<number> {
  const values = new Set<number>();

  if (part === "*") {
    for (let value = field.min; value <= field.max; value += 1) {
      values.add(value);
    }
    return values;
  }

  const stepMatch = part.match(/^\*\/(\d+)$/);
  if (stepMatch) {
    const step = Number(stepMatch[1]);
    if (!Number.isInteger(step) || step < 1) {
      throw new JobsError(`Invalid cron step: ${part}`);
    }

    for (let value = field.min; value <= field.max; value += step) {
      values.add(value);
    }
    return values;
  }

  const rangeStepMatch = part.match(/^(\d+)-(\d+)(?:\/(\d+))?$/);
  if (rangeStepMatch) {
    const start = Number(rangeStepMatch[1]);
    const end = Number(rangeStepMatch[2]);
    const step = rangeStepMatch[3] ? Number(rangeStepMatch[3]) : 1;

    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      !Number.isInteger(step) ||
      step < 1 ||
      start < field.min ||
      end > field.max ||
      start > end
    ) {
      throw new JobsError(`Invalid cron range: ${part}`);
    }

    for (let value = start; value <= end; value += step) {
      values.add(value);
    }
    return values;
  }

  const value = Number(part);
  if (!Number.isInteger(value) || value < field.min || value > field.max) {
    throw new JobsError(`Invalid cron value: ${part}`);
  }

  values.add(value);
  return values;
}

function parseField(expression: string, field: CronField): Set<number> {
  const values = new Set<number>();

  for (const part of expression.split(",")) {
    if (!part) {
      throw new JobsError(`Invalid cron field: ${expression}`);
    }

    for (const value of parseFieldPart(part, field)) {
      values.add(value);
    }
  }

  if (values.size === 0) {
    throw new JobsError(`Invalid cron field: ${expression}`);
  }

  return values;
}

export interface ParsedCron {
  minutes: Set<number>;
  hours: Set<number>;
  days: Set<number>;
  months: Set<number>;
  weekdays: Set<number>;
}

export function parseCron(schedule: string): ParsedCron {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new JobsError(`Cron expression must have 5 fields: ${schedule}`);
  }

  return {
    minutes: parseField(parts[0]!, FIELDS[0]!),
    hours: parseField(parts[1]!, FIELDS[1]!),
    days: parseField(parts[2]!, FIELDS[2]!),
    months: parseField(parts[3]!, FIELDS[3]!),
    weekdays: parseField(parts[4]!, FIELDS[4]!),
  };
}

function matchesCron(cron: ParsedCron, date: Date): boolean {
  return (
    cron.minutes.has(date.getMinutes()) &&
    cron.hours.has(date.getHours()) &&
    cron.days.has(date.getDate()) &&
    cron.months.has(date.getMonth() + 1) &&
    cron.weekdays.has(date.getDay())
  );
}

export function getNextRun(schedule: string, after: Date = new Date()): Date {
  const cron = parseCron(schedule);
  const candidate = new Date(after.getTime());
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  const limit = after.getTime() + 366 * 24 * 60 * 60 * 1000;

  while (candidate.getTime() <= limit) {
    if (matchesCron(cron, candidate)) {
      return new Date(candidate.getTime());
    }

    candidate.setMinutes(candidate.getMinutes() + 1);
  }

  throw new JobsError(`No next run found for cron expression: ${schedule}`);
}
