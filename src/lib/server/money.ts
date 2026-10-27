// The database stores money as whole cents; pages work in dollars.

export function toDollars(cents: number): number {
	return cents / 100;
}

export function toCents(dollars: number): number {
	return Math.round(dollars * 100);
}
