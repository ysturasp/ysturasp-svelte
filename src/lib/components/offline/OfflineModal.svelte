<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { offlineStore, isOnline } from '$lib/stores/offline';
	import { onMount } from 'svelte';

	export let isOpen = false;
	export let onClose: () => void = () => {};

	let lastOnlineTime: Date | null = null;
	let cacheStatus: 'loading' | 'ready' | 'error' = 'loading';
	let offlineFeatures: string[] = [];

	$: if ($offlineStore) {
		lastOnlineTime = $offlineStore.lastOnlineTime;
		cacheStatus = $offlineStore.cacheStatus;
	}

	onMount(() => {
		offlineFeatures = [
			'Просмотр расписания на группу или преподавателя (если ранее загружено)',
			'Просмотр ранее просмотренных страниц (когда был интернет)',
			'Навигация по страницам сайта',
			'Работа с настройками приложения',
			'Просмотр информации о кампусе',
			'Копирование ссылок на расписание'
		];
	});

	function handleRetryConnection() {
		offlineStore.checkOnlineStatus();
	}

	function formatLastOnlineTime(date: Date | null): string {
		if (!date) return 'Неизвестно';

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / (1000 * 60));
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		if (diffMinutes < 1) return 'Только что';
		if (diffMinutes < 60) return `${diffMinutes} мин назад`;
		if (diffHours < 24) return `${diffHours} ч назад`;
		return `${diffDays} дн назад`;
	}

	function handleDismiss() {
		offlineStore.dismissOfflineModal();
		onClose();
	}
</script>

<BottomModal
	{isOpen}
	title="🔌 Режим офлайн"
	subtitle="Интернет-соединение недоступно"
	subtitleClass="text-orange-400"
	onClose={handleDismiss}
>
	<div class="space-y-4">
		<div class="rounded-lg border border-orange-500/30 bg-orange-900/30 p-4">
			<div class="mb-3 flex items-center gap-3">
				<div class="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20">
					<svg
						class="h-5 w-5 text-orange-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div>
					<h3 class="font-semibold text-orange-200">Соединение потеряно</h3>
					<p class="text-sm text-orange-300">
						Последний раз онлайн: {formatLastOnlineTime(lastOnlineTime)}
					</p>
				</div>
			</div>
			<button
				on:click={handleRetryConnection}
				class="flex items-center gap-2 rounded-lg bg-orange-600 px-3 py-2 text-sm text-white transition-all hover:bg-orange-500"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
				Проверить соединение
			</button>
		</div>

		{#if cacheStatus === 'ready'}
			<div class="space-y-3">
				<h4 class="font-medium text-white">Что работает в офлайн-режиме:</h4>
				<div class="space-y-2">
					{#each offlineFeatures as feature}
						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							<span class="text-sm text-gray-300">{feature}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-lg border border-blue-500/30 bg-blue-900/30 p-4">
				<div class="flex items-start gap-3">
					<svg
						class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="text-sm text-blue-200">
						<p class="mb-1 font-medium">Ограничения офлайн-режима:</p>
						<ul class="list-inside list-disc space-y-1 text-blue-300">
							<li>Нельзя создавать новые таски в linear</li>
							<li>Нельзя загружать новое расписание</li>
							<li>Онлайн-счетчик пользователей недоступен</li>
							<li>Обновления данных заблокированы</li>
						</ul>
					</div>
				</div>
			</div>
		{:else if cacheStatus === 'loading'}
			<div class="rounded-lg border border-yellow-500/30 bg-yellow-900/30 p-4">
				<div class="flex items-center gap-3">
					<div class="h-5 w-5 animate-spin text-yellow-400">
						<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
					</div>
					<div>
						<h3 class="font-semibold text-yellow-200">Подготовка офлайн-режима</h3>
						<p class="text-sm text-yellow-300">Кэширование ресурсов...</p>
					</div>
				</div>
			</div>
		{:else}
			<div class="rounded-lg border border-red-500/30 bg-red-900/30 p-4">
				<div class="flex items-center gap-3">
					<svg
						class="h-5 w-5 text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
					<div>
						<h3 class="font-semibold text-red-200">Офлайн-режим недоступен</h3>
						<p class="text-sm text-red-300">Ошибка при кэшировании ресурсов</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<div slot="footer">
		<button
			on:click={handleDismiss}
			class="w-full rounded-lg bg-blue-700 p-3 text-white transition-all hover:bg-blue-600"
		>
			Понятно, продолжить работу
		</button>
	</div>
</BottomModal>
