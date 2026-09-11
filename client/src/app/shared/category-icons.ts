// Maps a category id (js/data.js's CATEGORIES ids) to an icon name from
// shared/icons.ts. Kept separate from the Category model since it's a purely
// presentational lookup, not data returned by the API.
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
  controllers: 'controller',
};

export function categoryIcon(categoryId: string): string {
  return CATEGORY_ICON[categoryId] ?? 'bolt';
}
