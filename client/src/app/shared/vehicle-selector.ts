import { VehicleYearTree } from './models';

// Pure query helpers over the year->make->model->trim tree, ported from
// js/data.js's wireVehicleSelectors — lets any field be picked first and
// narrows the others accordingly, order-independent.

export function availableYears(tree: VehicleYearTree[], make: string, model: string): number[] {
  return tree
    .filter((y) => {
      if (!make) return true;
      const m = y.makes.find((mk) => mk.make === make);
      if (!m) return false;
      if (!model) return true;
      return m.models.some((md) => md.model === model);
    })
    .map((y) => y.year)
    .sort((a, b) => b - a);
}

export function availableMakes(tree: VehicleYearTree[], year: string, model: string): string[] {
  const results = new Set<string>();
  for (const y of tree) {
    if (year && String(y.year) !== year) continue;
    for (const m of y.makes) {
      if (model && !m.models.some((md) => md.model === model)) continue;
      results.add(m.make);
    }
  }
  return [...results].sort((a, b) => a.localeCompare(b));
}

export function availableModels(tree: VehicleYearTree[], year: string, make: string): string[] {
  const results = new Set<string>();
  for (const y of tree) {
    if (year && String(y.year) !== year) continue;
    for (const m of y.makes) {
      if (make && m.make !== make) continue;
      for (const md of m.models) results.add(md.model);
    }
  }
  return [...results].sort((a, b) => a.localeCompare(b));
}

export function availableTrims(
  tree: VehicleYearTree[],
  year: string,
  make: string,
  model: string,
): string[] {
  if (!year || !make || !model) return [];
  const y = tree.find((y) => String(y.year) === year);
  const m = y?.makes.find((mk) => mk.make === make);
  const md = m?.models.find((md) => md.model === model);
  return md?.trims ?? [];
}
