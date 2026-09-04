/**
 * Return a calendar date in the user's local timezone.
 *
 * Date#toISOString() uses UTC, which can move a study log to the previous
 * or next day for users outside UTC. Date-only values in the tracker should
 * always be based on the local calendar instead.
 */
export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysUntilDateKey(dateKey: string, from: Date = new Date()): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  if (![year, month, day].every(Number.isFinite)) return 0;

  const target = new Date(year, month - 1, day);
  if (Number.isNaN(target.getTime())) return 0;

  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
}