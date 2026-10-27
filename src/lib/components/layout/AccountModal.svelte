<!-- Login / sign-up / profile modal, opened from the header. Its forms post
     to the actions in routes/account/+page.server.ts. -->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { refreshAll } from '$app/navigation';
	import { page } from '$app/state';
	import type { ActionResult } from '$app/forms';
	import { enhanceWith, errorOf } from '#lib/actions.ts';
	import Icon from '#lib/components/Icon.svelte';
	import { monthYear } from '#lib/format.ts';
	import { initials } from '#lib/initials.ts';
	import { getI18n } from '#lib/state/i18n.svelte.ts';
	import { ui, type AccountView } from '#lib/state/ui.svelte.ts';
	import type { User } from '#lib/types.ts';

	const i18n = getI18n();
	const user = $derived(page.data.user as User | null);

	let message = $state<{ text: string; kind: 'error' | 'ok' } | null>(null);

	function setView(view: AccountView) {
		message = null;
		ui.accountView = view;
	}

	function close() {
		message = null;
		ui.accountModalOpen = false;
	}

	/** Shows the action's error, or runs `onSuccess` after reloading the page data. */
	const handle = (onSuccess: () => void) =>
		enhanceWith(async (result: ActionResult) => {
			const error = errorOf(result, i18n.t('checkout.errorGeneric'));
			if (error) {
				message = { text: error, kind: 'error' };
				return;
			}
			await refreshAll();
			onSuccess();
		});

	const inputClass =
		'w-full mt-1 bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-muted focus:outline-none focus:border-blue';
	const submitClass =
		'w-full py-3 rounded-full bg-blue hover:bg-blue-dark text-white font-semibold transition glow-ring';
</script>

{#snippet feedback()}
	{#if message}
		<p class="text-xs {message.kind === 'error' ? 'text-amber' : 'text-blue-glow'}">
			{message.text}
		</p>
	{/if}
{/snippet}

{#if ui.accountModalOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-50 bg-black/60" onclick={close}></div>

	<div
		class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
	>
		<div
			class="glow-border pointer-events-auto relative w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 sm:p-8"
		>
			<button
				class="absolute flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white/5 hover:text-white"
				style="top:1rem;right:1rem"
				aria-label={i18n.t('account.closeAria')}
				onclick={close}
			>
				<Icon name="close" class="h-5 w-5" />
			</button>

			{#if user && ui.accountView === 'profile'}
				<div class="mb-6 flex items-center gap-4">
					<div
						class="flex h-14 w-14 items-center justify-center rounded-full border border-blue/30 bg-blue/15 font-display text-lg font-bold text-blue-glow"
					>
						{initials(user.fullName)}
					</div>
					<div class="min-w-0">
						<p class="truncate font-display text-xl font-bold text-white">{user.fullName}</p>
						<p class="truncate text-xs text-muted">
							{i18n.t('account.memberSince')}
							{monthYear(user.createdAt, i18n.lang)}
						</p>
					</div>
				</div>
				{#if user.isAdmin}
					<a
						href="/admin"
						onclick={close}
						class="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-blue/30 bg-blue/15 py-2.5 text-sm font-semibold text-blue-glow transition hover:bg-blue/25 hover:text-white"
					>
						<Icon name="wrench" class="h-4 w-4" />
						{i18n.t('account.adminPanel')}
					</a>
				{/if}
				<form
					method="POST"
					action="/account?/profile"
					class="space-y-3"
					use:enhance={handle(
						() => (message = { text: i18n.t('account.changesSavedMsg'), kind: 'ok' })
					)}
				>
					<div>
						<label for="profile-name" class="text-xs font-semibold text-muted"
							>{i18n.t('account.fullName')}</label
						>
						<input
							id="profile-name"
							name="fullName"
							type="text"
							value={user.fullName}
							class={inputClass}
						/>
					</div>
					<div>
						<p class="text-xs font-semibold text-muted">{i18n.t('account.email')}</p>
						<p
							class="mt-1 w-full rounded-lg border border-white/5 bg-surface-2/50 px-4 py-3 text-sm text-muted"
						>
							{user.email}
						</p>
					</div>
					{@render feedback()}
					<button type="submit" class={submitClass}>{i18n.t('account.saveChanges')}</button>
				</form>
				<form method="POST" action="/account?/logout" use:enhance={handle(close)}>
					<button
						class="mt-3 w-full rounded-full border border-white/15 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
						>{i18n.t('account.logout')}</button
					>
				</form>
			{:else if ui.accountView === 'signup'}
				<h2 class="mb-1 font-display text-2xl font-bold tracking-wide text-white">
					{i18n.t('account.signupTitle')}
				</h2>
				<p class="mb-6 text-sm text-muted">{i18n.t('account.signupSubtitle')}</p>
				<form
					method="POST"
					action="/account?/register"
					class="space-y-3"
					use:enhance={handle(() => {
						ui.accountView = 'profile';
						message = { text: i18n.t('account.accountCreatedMsg'), kind: 'ok' };
					})}
				>
					<div>
						<label for="signup-name" class="text-xs font-semibold text-muted"
							>{i18n.t('account.fullName')}</label
						>
						<input
							id="signup-name"
							name="fullName"
							type="text"
							autocomplete="name"
							placeholder="Juan Pellot"
							class={inputClass}
						/>
					</div>
					<div>
						<label for="signup-email" class="text-xs font-semibold text-muted"
							>{i18n.t('account.email')}</label
						>
						<input
							id="signup-email"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="tu@correo.com"
							class={inputClass}
						/>
					</div>
					<div>
						<label for="signup-password" class="text-xs font-semibold text-muted"
							>{i18n.t('account.password')}</label
						>
						<input
							id="signup-password"
							name="password"
							type="password"
							autocomplete="new-password"
							placeholder={i18n.t('account.passwordMinPlaceholder')}
							class={inputClass}
						/>
					</div>
					{@render feedback()}
					<button type="submit" class={submitClass}>{i18n.t('account.createAccount')}</button>
				</form>
				<p class="mt-5 text-center text-sm text-muted">
					{i18n.t('account.alreadyHaveAccount')}
					<button
						class="font-semibold text-blue-glow transition hover:text-white"
						onclick={() => setView('login')}>{i18n.t('account.login')}</button
					>
				</p>
			{:else}
				<h2 class="mb-1 font-display text-2xl font-bold tracking-wide text-white">
					{i18n.t('account.loginTitle')}
				</h2>
				<p class="mb-6 text-sm text-muted">{i18n.t('account.loginSubtitle')}</p>
				<form
					method="POST"
					action="/account?/login"
					class="space-y-3"
					use:enhance={handle(() => {
						message = null;
						ui.accountView = 'profile';
					})}
				>
					<div>
						<label for="login-email" class="text-xs font-semibold text-muted"
							>{i18n.t('account.email')}</label
						>
						<input
							id="login-email"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="tu@correo.com"
							class={inputClass}
						/>
					</div>
					<div>
						<label for="login-password" class="text-xs font-semibold text-muted"
							>{i18n.t('account.password')}</label
						>
						<input
							id="login-password"
							name="password"
							type="password"
							autocomplete="current-password"
							placeholder={i18n.t('account.passwordPlaceholder')}
							class={inputClass}
						/>
					</div>
					{@render feedback()}
					<button type="submit" class={submitClass}>{i18n.t('account.enter')}</button>
				</form>
				<p class="mt-5 text-center text-sm text-muted">
					{i18n.t('account.newHere')}
					<button
						class="font-semibold text-blue-glow transition hover:text-white"
						onclick={() => setView('signup')}>{i18n.t('account.createAccountLink')}</button
					>
				</p>
			{/if}
		</div>
	</div>
{/if}
