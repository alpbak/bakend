export function generateRecordId(): string {
  return `rec_${crypto.randomUUID()}`;
}
