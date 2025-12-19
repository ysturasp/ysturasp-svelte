<script lang="ts">
	import { fade } from 'svelte/transition';
	import { reachGoal } from '$lib/utils/metrika';
	import { onMount, onDestroy } from 'svelte';

	export let currentPage: 'students' | 'teachers' | 'audiences' = 'students';
	export let university: 'ystu' | 'yspu' = 'ystu';
	export let handleNavClick: () => void;

	type BannerType = 'aeza' | 'toilets' | 'apps';
	let activeBanner: BannerType = 'aeza';
	let bannerInterval: ReturnType<typeof setInterval> | null = null;
	const bannerOrder: BannerType[] = ['aeza', 'toilets', 'apps'];
	let bannerIndex = 0;

	onMount(() => {
		bannerInterval = setInterval(() => {
			bannerIndex = (bannerIndex + 1) % bannerOrder.length;
			activeBanner = bannerOrder[bannerIndex];
		}, 5000);
	});

	onDestroy(() => {
		if (bannerInterval) {
			clearInterval(bannerInterval);
			bannerInterval = null;
		}
	});
</script>

<div class="relative flex w-full min-h-[28px] items-center justify-center md:w-auto md:min-w-[240px]">
	{#if activeBanner === 'aeza'}
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
	{#if activeBanner === 'toilets' && university === 'ystu'}
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

	{#if activeBanner === 'apps'}
		<a
			href="/apps"
			class="group absolute left-1/2 top-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-lg bg-amber-100 px-2.5 py-1.5 md:py-2 text-xs text-amber-900 border border-amber-300 shadow-sm hover:bg-amber-200 hover:shadow-md transition-colors md:w-[240px] md:text-sm"
			on:click={() => handleNavClick()}
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
		>
			<svg
				class="h-4 w-4 text-amber-700 transition-transform duration-200 ease-out group-hover:scale-110"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<rect x="3" y="3" width="7" height="7" rx="1.5" />
				<rect x="14" y="3" width="7" height="7" rx="1.5" />
				<rect x="3" y="14" width="7" height="7" rx="1.5" />
				<rect x="14" y="14" width="7" height="7" rx="1.5" />
			</svg>
			<span class="font-medium leading-tight text-center">
				Все сервисы ysturasp
			</span>
		</a>
	{/if}
</div>
