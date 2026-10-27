// Search + sort + pagination for the admin tables, done in the browser over
// the rows the page loaded (same as the Angular version).

export type Sorter<T> = (a: T, b: T) => number;

export class Table<T> {
	#search = $state('');
	sortKey = $state('');
	sortDir = $state<'asc' | 'desc'>('asc');
	page = $state(1);

	constructor(
		private readonly opts: {
			rows: () => T[];
			searchFields: ((row: T) => string | null | undefined)[];
			sorters: Record<string, Sorter<T>>;
			sortKey: string;
			sortDir?: 'asc' | 'desc';
			/** Extra page-specific filter (status dropdown, etc.). */
			filter?: (row: T) => boolean;
			pageSize?: number;
		}
	) {
		this.sortKey = opts.sortKey;
		this.sortDir = opts.sortDir ?? 'asc';
	}

	get pageSize() {
		return this.opts.pageSize ?? 10;
	}

	get search() {
		return this.#search;
	}
	set search(value: string) {
		this.#search = value;
		this.page = 1;
	}

	filtered = $derived.by(() => {
		const q = this.#search.trim().toLowerCase();
		let rows = this.opts.rows().filter((row) => this.opts.filter?.(row) ?? true);
		if (q)
			rows = rows.filter((row) =>
				this.opts.searchFields.some((f) => (f(row) ?? '').toLowerCase().includes(q))
			);
		const sorter = this.opts.sorters[this.sortKey];
		if (!sorter) return rows;
		const sorted = [...rows].sort(sorter);
		return this.sortDir === 'asc' ? sorted : sorted.reverse();
	});

	pageCount = $derived.by(() => Math.max(1, Math.ceil(this.filtered.length / this.pageSize)));

	pageItems = $derived.by(() =>
		this.filtered.slice((this.page - 1) * this.pageSize, this.page * this.pageSize)
	);

	toggleSort = (key: string) => {
		if (this.sortKey === key) {
			this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			this.sortKey = key;
			this.sortDir = 'asc';
		}
	};
}
