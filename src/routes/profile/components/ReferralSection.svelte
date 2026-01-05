<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { getReferralStats } from '../../stat/utils/api';
	import type { ReferralStats } from '../../stat/types';
	import { notifications } from '$lib/stores/notifications';

	let stats: ReferralStats | null = null;
	let referralLink = '';
	let loading = true;
	let activeTab: 'history' | 'leaderboard' = 'history';

	async function loadData() {
		loading = true;
		try {
			stats = await getReferralStats();
			if ($auth?.user?.id) {
				const response = await fetch('/api/stat/referral-code');
				if (response.ok) {
					const data = await response.json();
					if ($auth.isTelegram) {
						referralLink = `https://t.me/ysturasp_bot?start=${data.referralCode}`;
					} else {
						referralLink = `${window.location.origin}/stat?ref=${data.referralCode}`;
					}
				}
			}
		} catch (error) {
			console.error('Error loading referral data:', error);
		} finally {
			loading = false;
		}
	}

	function copyLink() {
		if (navigator.clipboard && referralLink) {
			navigator.clipboard.writeText(referralLink).then(() => {
				notifications.add('Ссылка скопирована!', 'success');
			});
		}
	}

	function maskEmail(email: string) {
		if (!email) return '***';
		const parts = email.split('@');
		const name = parts[0];
		if (name.length <= 2) return name + '********';
		return name.substring(0, 2) + '********';
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	onMount(loadData);
</script>

<div class="animate-in fade-in space-y-6 duration-500">
	<div class="space-y-4 rounded-3xl border border-white/5 bg-slate-800 p-2 shadow-xl md:p-4">
		<div class="mx-1">
			<div class="space-y-2">
				<h3 class="text-sm font-bold tracking-wider text-slate-500 uppercase">
					реферальная статистика
				</h3>
				<div class="flex items-baseline gap-8">
					<div class="flex flex-col">
						<span class="text-4xl leading-none font-bold text-white">
							{stats?.referralCount || 0}
						</span>
						<span
							class="mt-1 text-[10px] font-bold tracking-tight text-slate-500 uppercase"
							>приглашено</span
						>
					</div>
					<div class="flex flex-col">
						<span class="text-4xl leading-none font-bold text-white">
							{stats?.statsLimit || 10}
						</span>
						<span
							class="mt-1 text-[10px] font-bold tracking-tight text-slate-500 uppercase"
							>лимит просмотров</span
						>
					</div>
				</div>
			</div>

			<p class="max-w-xl text-sm leading-relaxed text-slate-400 lowercase">
				после перехода по вашей ссылке и авторизации, ваш реферал получит бонус к лимитам, а
				вы получите +10 просмотров к вашему ежемесячному лимиту. бонус действует постоянно
			</p>
		</div>

		<div class="relative max-w-md">
			<div
				class="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-900 px-4 py-3.5"
			>
				<input
					type="text"
					readonly
					value={referralLink || 'загрузка...'}
					class="flex-1 border-none bg-transparent text-sm font-medium text-slate-300 outline-none"
				/>
				<button
					on:click={copyLink}
					class="p-1 text-slate-500 transition-colors hover:text-white"
					disabled={!referralLink}
					aria-label="Копировать ссылку"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path
							d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
						></path></svg
					>
				</button>
			</div>
		</div>
	</div>

	<div class="pt-4">
		<div
			class="flex w-fit items-center gap-1 rounded-2xl border border-white/5 bg-slate-800 p-1"
		>
			<button
				on:click={() => (activeTab = 'history')}
				class="rounded-xl px-6 py-2.5 text-sm font-bold transition-all {activeTab ===
				'history'
					? 'bg-slate-700 text-white shadow-md'
					: 'text-slate-500 hover:text-slate-300'}"
			>
				История
			</button>
			<button
				on:click={() => (activeTab = 'leaderboard')}
				class="rounded-xl px-6 py-2.5 text-sm font-bold transition-all {activeTab ===
				'leaderboard'
					? 'bg-slate-700 text-white shadow-md'
					: 'text-slate-500 hover:text-slate-300'}"
			>
				Топ рефералов
			</button>
		</div>
		<div class="mt-4 h-px w-full bg-white/10"></div>
	</div>

	<div class="min-h-[300px]">
		{#if activeTab === 'history'}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
							<th class="px-2 py-4">Дата</th>
							<th class="px-2 py-4">Клиент</th>
							<th class="px-2 py-4 text-right">Действие</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5 border-t border-white/5">
						{#if loading}
							{#each Array(3) as _}
								<tr class="animate-pulse">
									<td class="px-2 py-4"
										><div class="h-4 w-20 rounded bg-white/5"></div></td
									>
									<td class="px-2 py-4"
										><div class="h-4 w-32 rounded bg-white/5"></div></td
									>
									<td class="px-2 py-4"
										><div class="ml-auto h-4 w-24 rounded bg-white/5"></div></td
									>
								</tr>
							{/each}
						{:else if stats?.history.length}
							{#each stats.history as item}
								<tr class="group transition-colors hover:bg-white/[0.02]">
									<td class="px-2 py-4">
										<span class="text-sm font-medium text-slate-400"
											>{formatDate(item.created_at)}</span
										>
									</td>
									<td class="px-2 py-4">
										<span class="text-sm font-medium text-white"
											>{maskEmail(item.email)}</span
										>
									</td>
									<td class="px-2 py-4 text-right">
										<span
											class="rounded-lg bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-400"
										>
											+10 views
										</span>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="3" class="py-12 text-center text-slate-600 italic"
									>История приглашений пока пуста</td
								>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead>
						<tr class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
							<th class="w-16 px-2 py-4">Ранг</th>
							<th class="px-2 py-4">Реферер</th>
							<th class="px-2 py-4 text-right">Приглашено</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-white/5 border-t border-white/5">
						{#if loading}
							{#each Array(5) as _}
								<tr class="animate-pulse">
									<td class="px-2 py-4"
										><div class="h-4 w-8 rounded bg-white/5"></div></td
									>
									<td class="px-2 py-4"
										><div class="h-4 w-32 rounded bg-white/5"></div></td
									>
									<td class="px-2 py-4"
										><div class="ml-auto h-4 w-12 rounded bg-white/5"></div></td
									>
								</tr>
							{/each}
						{:else if stats?.leaderboard.length}
							{#each stats.leaderboard as user, i}
								<tr class="group transition-colors hover:bg-white/[0.02]">
									<td class="px-2 py-4">
										<span
											class="font-mono text-xs {i < 3
												? 'font-bold text-blue-400'
												: 'text-slate-600'}"
										>
											#{i + 1}
										</span>
									</td>
									<td class="px-2 py-4">
										<span
											class="text-sm text-slate-300 transition-colors group-hover:text-white"
										>
											{maskEmail(user.email)}
										</span>
									</td>
									<td class="px-2 py-4 text-right">
										<span class="text-sm font-bold text-white"
											>{user.referral_count} чел.</span
										>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="3" class="py-12 text-center text-slate-600 italic"
									>Данных для рейтинга нет</td
								>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	.overflow-x-auto::-webkit-scrollbar {
		height: 4px;
	}
	.overflow-x-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 10px;
	}
</style>
