// Maps a category id to an icon name from icons.ts — a purely visual lookup,
// kept out of the database.
const CATEGORY_ICON: Record<string, string> = {
	headlights: 'headlight',
	'fog-lights': 'foglight',
	drl: 'drl',
	'turn-signals': 'signal',
	'tail-lights': 'taillight',
	reverse: 'reverse',
	'side-markers': 'marker',
	'license-plate': 'plate',
	interior: 'cabin',
	underglow: 'underglow',
	'light-bars': 'bar',
	controllers: 'controller'
};

export function categoryIcon(categoryId: string): string {
	return CATEGORY_ICON[categoryId] ?? 'bolt';
}
