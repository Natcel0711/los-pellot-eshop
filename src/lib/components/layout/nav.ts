export const NAV_LINKS = [
	{ path: '/', labelKey: 'nav.home' },
	{ path: '/products', labelKey: 'nav.products' },
	{ path: '/vehicle', labelKey: 'nav.vehicle' },
	{ path: '/installation', labelKey: 'nav.installation' },
	{ path: '/contact', labelKey: 'nav.contact' }
];

/** Like Angular's routerLinkActive: "/" must match exactly, others also match sub-pages. */
export function isActive(path: string, pathname: string): boolean {
	return path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(path + '/');
}
