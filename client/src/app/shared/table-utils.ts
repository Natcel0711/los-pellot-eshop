export type SortDir = 'asc' | 'desc';
export type Sorter<T> = (a: T, b: T) => number;

// Sorts by a named comparator from `sorters`, returning `items` unchanged
// (well, a stable copy) when no key/matching sorter is set.
export function sortRows<T>(
  items: T[],
  key: string | null,
  dir: SortDir,
  sorters: Record<string, Sorter<T>>,
): T[] {
  if (!key || !sorters[key]) return items;
  const sorted = [...items].sort(sorters[key]);
  return dir === 'asc' ? sorted : sorted.reverse();
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(itemCount: number, pageSize: number): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

// Case-insensitive substring match across a set of string-producing getters —
// used to back the search box on every admin table.
export function matchesQuery<T>(item: T, query: string, fields: Array<(item: T) => string | null | undefined>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((getField) => (getField(item) ?? '').toLowerCase().includes(q));
}
