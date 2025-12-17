<script lang="ts">
	import type { SemesterInfo } from '$lib/utils/semester';
	import { getCurrentSemester } from '$lib/utils/semester';
	import ScheduleSettings from './ScheduleSettings.svelte';
	import { hapticFeedback, init } from '@tma.js/sdk-svelte';
	import { onDestroy, onMount } from 'svelte';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/stores/settings';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
	import { reachGoal } from '$lib/utils/metrika';
	import { fade } from 'svelte/transition';

	export let selectedSemester: SemesterInfo | null = null;
	export let onSemesterChange: (semester: SemesterInfo) => void;
	export let currentPage: 'students' | 'teachers' | 'audiences' = 'students';
	export let university: 'ystu' | 'yspu' = 'ystu';

	let isSettingsOpen = false;
	let currentSettings: Settings;
	let isTelegram = false;
	let activeBanner: 'aeza' | 'toilets' = 'aeza';
	let bannerInterval: ReturnType<typeof setInterval> | null = null;

	settings.subscribe((value) => {
		currentSettings = value;
	});

	$: prefix = university === 'yspu' ? '/yspu' : '';

	function handleSettingsSave(event: CustomEvent) {
		const settings = event.detail;
	}

	function handleClick() {
		if (isTelegram && currentSettings?.hapticFeedback) {
			hapticFeedback.impactOccurred.ifAvailable('medium');
		}
		isSettingsOpen = true;
	}

	function handleNavClick() {
		if (isTelegram && currentSettings?.hapticFeedback) {
			hapticFeedback.impactOccurred.ifAvailable('medium');
		}
	}

	onMount(() => {
		isTelegram = checkIsTelegramMiniApp();
		if (isTelegram) {
			try {
				init();
			} catch (error) {
				console.warn('Not in Telegram Mini App:', error);
			}
		}

		bannerInterval = setInterval(() => {
			activeBanner = activeBanner === 'aeza' ? 'toilets' : 'aeza';
		}, 5000);
	});

	onDestroy(() => {
		if (bannerInterval) {
			clearInterval(bannerInterval);
			bannerInterval = null;
		}
	});
</script>

<div class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
		<div class="rounded-2xl bg-slate-900/95 p-1.5 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-sm">
		<div class="flex flex-col items-center gap-1.5 md:flex-row">
				{#if selectedSemester && selectedSemester.id !== getCurrentSemester().id}
					<button
						class="flex w-full items-center justify-center rounded-lg bg-amber-500/90 px-2.5 py-1 text-sm transition-opacity hover:opacity-80 md:w-auto md:justify-start md:py-2"
						on:click={() => onSemesterChange(getCurrentSemester())}
					>
						<span class="text-black">{selectedSemester.name}</span>
						<span class="mr-1 ml-1 text-black/60">→</span>
						<span class="text-black/60">текущий</span>
					</button>

					<div class="hidden h-4 w-[1px] bg-slate-700/50 md:block"></div>
				{:else}
					<div class="relative flex w-full min-h-[28px] items-center justify-center md:w-auto md:min-w-[240px]">
						{#if activeBanner === 'aeza' || currentPage !== 'students' || university !== 'ystu'}
							<a
								href="https://aeza.net/?ref=538988"
								target="_blank"
								rel="noopener noreferrer"
								class="group absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 md:py-2 text-sm transition-opacity hover:opacity-80 md:w-[240px]"
								on:click={() => {
									reachGoal('aeza_affiliate_click');
									handleNavClick();
								}}
								in:fade={{ duration: 300 }}
								out:fade={{ duration: 300 }}
							>
								<img
									src="https://my.aeza.net/assets/images/logo-dark.svg"
									alt="Aeza"
									class="h-4 w-auto"
								/>
								<span class="text-xs whitespace-nowrap text-center text-slate-700">
									🤝 Серверы от €4.94/мес
								</span>

								<div
									class="absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 translate-y-1 transform rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-all duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 md:block"
								>
									Партнёрское предложение
								</div>
							</a>
						{/if}
						{#if activeBanner === 'toilets' && currentPage === 'students' && university === 'ystu'}
							<a
								href="/toilets"
								class="absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-2.5 py-1.5 md:py-2 text-xs text-blue-200 transition-colors hover:bg-blue-700 md:w-[240px] md:text-sm"
								on:click={() => handleNavClick()}
								in:fade={{ duration: 300 }}
								out:fade={{ duration: 300 }}
							>
								<span class="font-medium leading-tight text-center">
									Поиск туалетов в Г корпусе
								</span>
							</a>
						{/if}
					</div>

					<div class="hidden h-4 w-[1px] bg-slate-700/50 md:block"></div>
				{/if}

			<div class="flex items-center gap-1.5">
				<a
					href="{prefix}/rasp"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'students'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
					on:click={() => handleNavClick()}
				>
					<span class="text-lg">👨‍💻‍</span>
					<span class="text-xs md:text-sm">Студенты</span>
				</a>

				<a
					href="{prefix}/raspprep"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'teachers'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
					on:click={() => handleNavClick()}
				>
					<span class="text-lg">👨‍🏫</span>
					<span class="text-xs md:text-sm">Преподы</span>
				</a>

				<a
					href="{prefix}/raspaudience"
					class="flex items-center gap-1.5 rounded-xl px-2.5 py-1 {currentPage ===
					'audiences'
						? 'bg-blue-500/10 text-white'
						: 'text-white/70 transition-all hover:bg-slate-800 hover:text-white'}"
					on:click={() => handleNavClick()}
				>
					<span class="text-lg">🏛️</span>
					<span class="text-xs md:text-sm">Аудитории</span>
				</a>
			</div>

			<div class="h-[1px] w-full bg-slate-700/50 md:hidden"></div>

			<button
				class="flex w-full items-center justify-center gap-1.5 rounded-xl text-white/70 transition-all hover:bg-slate-800 hover:text-white md:hidden md:w-auto"
				on:click={handleClick}
			>
				<span class="text-lg">⚙️</span>
				<span class="text-xs md:text-sm">Настройки</span>
			</button>
		</div>
	</div>
</div>

<button
	class="fixed right-4 bottom-4 z-50 hidden items-center gap-1.5 rounded-xl bg-slate-900/95 px-2.5 py-1.5 text-white/70 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-sm transition-all hover:bg-slate-800 hover:text-white md:flex"
	on:click={handleClick}
>
	<span class="text-lg">⚙️</span>
	<span class="text-xs md:text-sm">Настройки</span>
</button>

<ScheduleSettings
	isOpen={isSettingsOpen}
	on:close={() => (isSettingsOpen = false)}
	on:save={handleSettingsSave}
	{currentPage}
	{university}
/>
