<script lang="ts">
	import { fade } from 'svelte/transition';
	import { reachGoal } from '$lib/utils/metrika';
	import { onMount, onDestroy } from 'svelte';

	export let currentPage: 'students' | 'teachers' | 'audiences' = 'students';
	export let university: 'ystu' | 'yspu' = 'ystu';
	export let handleNavClick: () => void;

	let activeBanner: 'aeza' | 'toilets' = 'aeza';
	let bannerInterval: ReturnType<typeof setInterval> | null = null;

	onMount(() => {
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
