// Which panels are open (account modal, cart drawer, mobile menu, search
// bar) — shared between the header and the components it opens. Only ever
// changed by clicks in the browser, so one shared copy is safe.

export type AccountView = 'login' | 'signup' | 'profile';

class UiState {
	accountModalOpen = $state(false);
	accountView = $state<AccountView>('login');
	cartDrawerOpen = $state(false);
	mobileMenuOpen = $state(false);
	searchBarOpen = $state(false);

	openAccountModal(view: AccountView = 'login') {
		this.accountView = view;
		this.accountModalOpen = true;
	}
}

export const ui = new UiState();

// ---- Toast messages ----

interface ToastEntry {
	id: number;
	message: string;
	leaving: boolean;
}

let nextId = 1;

class Toasts {
	list = $state<ToastEntry[]>([]);

	show(message: string) {
		const id = nextId++;
		this.list.push({ id, message, leaving: false });
		setTimeout(() => {
			const entry = this.list.find((t) => t.id === id);
			if (entry) entry.leaving = true;
			setTimeout(() => (this.list = this.list.filter((t) => t.id !== id)), 300);
		}, 2200);
	}
}

export const toast = new Toasts();

// ---- Loading bar: counts form submissions in flight ----

class Loading {
	pending = $state(0);

	start() {
		this.pending++;
	}

	stop() {
		this.pending = Math.max(0, this.pending - 1);
	}
}

export const loading = new Loading();
