<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

	interface SessionItem {
		id: string;
		deviceName: string | null;
		ipAddress: string | null;
		userAgent: string | null;
		createdAt: string;
		lastSeen: string;
		expiresAt: string;
		revokedAt: string | null;
		isCurrent: boolean;
		isActive: boolean;
	}

	let sessions: SessionItem[] = [];
	let activeSessions: SessionItem[] = [];
	let currentSessionId: string | null = null;
	let loading = true;
	let error = '';
	let actionLoading = false;
	let revoking: Record<string, boolean> = {};

	async function loadSessions() {
		loading = true;
		error = '';
		try {
			const response = await fetch('/api/auth/sessions');
			if (!response.ok) {
				throw new Error('Не удалось загрузить сессии');
			}
			const data = await response.json();
			sessions = data.sessions;
			currentSessionId = data.currentSessionId;
			activeSessions = data.sessions.filter((session: SessionItem) => session.isActive);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка';
		} finally {
			loading = false;
		}
	}

	$: activeSessions = sessions.filter((session) => session.isActive);

	onMount(() => {
		loadSessions();
	});

	function formatDate(value: string) {
		try {
			return new Intl.DateTimeFormat('ru-RU', {
				dateStyle: 'medium',
				timeStyle: 'short'
			}).format(new Date(value));
		} catch {
			return value;
		}
	}

	async function postAction(body: Record<string, unknown>) {
		const response = await fetch('/api/auth/sessions', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!response.ok) {
			const data = await response.json().catch(() => ({}));
			throw new Error(data.error || 'Не удалось выполнить действие');
		}
		return response.json();
	}

	async function handleRevoke(sessionId: string) {
		revoking = { ...revoking, [sessionId]: true };
		try {
			const data = await postAction({ action: 'revoke', sessionId });
			await loadSessions();
			if (data.revokedCurrent) {
				await auth.checkAuth();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка';
		} finally {
			const { [sessionId]: _, ...rest } = revoking;
			revoking = rest;
		}
	}

	async function handleRevokeOthers() {
		actionLoading = true;
		try {
			await postAction({ action: 'revokeOthers' });
			await loadSessions();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка';
		} finally {
			actionLoading = false;
		}
	}

	async function handleRevokeAll() {
		actionLoading = true;
		try {
			const data = await postAction({ action: 'revokeAll' });
			await auth.checkAuth();
			if (!data.revokedCurrent) {
				await loadSessions();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка';
		} finally {
			actionLoading = false;
		}
	}
</script>

<div>
	{#if loading}
		<div class="py-6 text-center text-slate-400">Загрузка...</div>
	{:else if error}
		<div class="rounded-lg bg-red-500/10 p-4 text-red-400">{error}</div>
	{:else if activeSessions.length === 0}
		<div class="py-6 text-center text-slate-400">Активных сессий нет</div>
	{:else}
		<div class="space-y-4">
			{#each activeSessions as session}
				<div
					class="flex flex-col gap-3 border-b border-slate-700 pb-4 last:border-0 md:flex-row md:items-center md:justify-between"
				>
					<div class="flex-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="text-base font-medium text-white">
								{session.deviceName || 'Неизвестное устройство'}
							</span>
							{#if session.isCurrent}
								<span
									class="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300"
								>
									Текущая
								</span>
							{/if}
						</div>
						<p class="mt-1 text-sm text-slate-400">
							{session.ipAddress || 'IP неизвестен'} · {formatDate(session.lastSeen)}
						</p>
					</div>
					<button
						class="rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
						on:click={() => handleRevoke(session.id)}
						disabled={session.revokedAt !== null || revoking[session.id]}
					>
						{session.isCurrent ? 'Выйти здесь' : 'Выйти'}
					</button>
				</div>
			{/each}
		</div>

		<div class="mt-6 flex flex-col gap-2 border-t border-slate-700 pt-4 md:flex-row">
			<button
				class="rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
				on:click={handleRevokeOthers}
				disabled={actionLoading || activeSessions.length <= 1}
			>
				Выйти из других устройств
			</button>
			<button
				class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
				on:click={handleRevokeAll}
				disabled={actionLoading}
			>
				Выйти везде
			</button>
		</div>
	{/if}
</div>
