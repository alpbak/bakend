const CHANNEL_PATTERN = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_*-]+)*$/;

export function isValidChannel(channel: string): boolean {
  if (!channel || channel.length > 200) {
    return false;
  }

  return CHANNEL_PATTERN.test(channel);
}

export function matchesChannel(subscription: string, eventType: string): boolean {
  if (subscription === eventType) {
    return true;
  }

  if (subscription.endsWith(".*")) {
    const prefix = subscription.slice(0, -1);
    return eventType.startsWith(prefix);
  }

  return false;
}
