import { describe, expect, test } from "bun:test";
import { getNextRun, parseCron } from "../../../src/core/jobs/cron.ts";
import { JobsError } from "../../../src/core/jobs/types.ts";

describe("parseCron", () => {
  test("parses wildcard fields", () => {
    const cron = parseCron("* * * * *");
    expect(cron.minutes.size).toBe(60);
    expect(cron.hours.size).toBe(24);
    expect(cron.days.size).toBe(31);
    expect(cron.months.size).toBe(12);
    expect(cron.weekdays.size).toBe(7);
  });

  test("parses step expressions", () => {
    const cron = parseCron("*/5 * * * *");
    expect([...cron.minutes].sort((a, b) => a - b)).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
    ]);
  });

  test("parses ranges and lists", () => {
    const cron = parseCron("0 9-11,14 1,15 3,6 1");
    expect(cron.minutes.has(0)).toBe(true);
    expect(cron.hours.has(9)).toBe(true);
    expect(cron.hours.has(11)).toBe(true);
    expect(cron.hours.has(14)).toBe(true);
    expect(cron.days.has(1)).toBe(true);
    expect(cron.days.has(15)).toBe(true);
    expect(cron.months.has(3)).toBe(true);
    expect(cron.months.has(6)).toBe(true);
    expect(cron.weekdays.has(1)).toBe(true);
  });

  test("rejects invalid field counts", () => {
    expect(() => parseCron("* * *")).toThrow(JobsError);
  });

  test("rejects out-of-range values", () => {
    expect(() => parseCron("60 * * * *")).toThrow(JobsError);
    expect(() => parseCron("* 24 * * *")).toThrow(JobsError);
  });
});

describe("getNextRun", () => {
  test("finds next minute for every-minute schedule", () => {
    const after = new Date(2026, 0, 15, 10, 30, 45);
    const next = getNextRun("* * * * *", after);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getMonth()).toBe(0);
    expect(next.getDate()).toBe(15);
    expect(next.getHours()).toBe(10);
    expect(next.getMinutes()).toBe(31);
    expect(next.getSeconds()).toBe(0);
  });

  test("finds next run across hour boundary", () => {
    const after = new Date(2026, 0, 15, 10, 59, 0);
    const next = getNextRun("0 * * * *", after);
    expect(next.getHours()).toBe(11);
    expect(next.getMinutes()).toBe(0);
  });

  test("finds next run for specific daily schedule", () => {
    const after = new Date(2026, 0, 15, 2, 0, 0);
    const next = getNextRun("0 3 * * *", after);
    expect(next.getHours()).toBe(3);
    expect(next.getMinutes()).toBe(0);
    expect(next.getDate()).toBe(15);
  });

  test("finds next run for every-five-minutes schedule", () => {
    const after = new Date(2026, 0, 15, 10, 32, 0);
    const next = getNextRun("*/5 * * * *", after);
    expect(next.getMinutes()).toBe(35);
  });
});
