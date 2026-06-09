const DURATION_PATTERN = /^(\d+)([smhd])$/;

export function parseDuration(duration: string): number {
  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }

  const value = Number.parseInt(match[1]!, 10);
  const unit = match[2]!;

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

export function expiresAtFromNow(duration: string): string {
  return new Date(Date.now() + parseDuration(duration)).toISOString();
}
