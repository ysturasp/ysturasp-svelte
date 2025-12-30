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

<div
	class="relative flex min-h-[28px] w-full items-center justify-center md:w-auto md:min-w-[240px]"
>
	{#if activeBanner === 'aeza'}
		<a
			href="https://aeza.net/?ref=538988"
			target="_blank"
			rel="noopener noreferrer"
			class="group absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-sm transition-opacity hover:opacity-80 md:w-[240px] md:py-2"
			on:click={() => {
				reachGoal('aeza_affiliate_click');
				handleNavClick();
			}}
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 232 56"
				class="h-4 w-auto"
				aria-label="Aeza"
			>
				<path
					d="M.971 16.321v21.921c0 3.257 0 4.885.275 6.238a13.746 13.746 0 0 0 10.737 10.737c1.353.275 2.981.275 6.238.275h20.124c4.876 0 7.314 0 9.276-.678a12.371 12.371 0 0 0 7.655-7.655c.678-1.962.678-4.4.678-9.276V16.32c0-1.92 0-2.879-.096-3.685A13.746 13.746 0 0 0 43.828.605C43.02.509 42.06.509 40.141.509H16.68c-4.71 0-7.066 0-8.937.732a10.653 10.653 0 0 0-6.041 6.041C.97 9.153.97 11.542.97 16.322Z"
					fill="#E1E1E1"
				/>
				<rect x="2.346" y="1.883" width="48.11" height="48.11" rx="10.309" fill="#fff" />
				<path
					d="M23.09 43.581c3.6 0 5.933-1.57 7.122-3.84h.19v3.38h6.41V26.686c0-5.807-4.918-8.25-10.344-8.25-5.838 0-9.677 2.792-10.613 7.234l6.25.508c.46-1.618 1.904-2.808 4.332-2.808 2.3 0 3.617 1.158 3.617 3.157v.095c0 1.57-1.666 1.777-5.902 2.19-4.823.444-9.154 2.062-9.154 7.503 0 4.823 3.443 7.266 8.091 7.266Zm1.935-4.664c-2.078 0-3.57-.968-3.57-2.824 0-1.904 1.57-2.84 3.95-3.173 1.476-.206 3.887-.555 4.696-1.094v2.585c0 2.555-2.11 4.506-5.076 4.506Z"
					fill="#000"
				/>
				<path
					d="M59.39 16.321v21.922c0 3.256 0 4.884.275 6.237a13.746 13.746 0 0 0 10.738 10.738c1.353.274 2.98.274 6.237.274h20.124c4.876 0 7.314 0 9.277-.678a12.372 12.372 0 0 0 7.655-7.655c.677-1.962.677-4.4.677-9.276V16.321c0-1.919 0-2.878-.095-3.685A13.747 13.747 0 0 0 102.247.605c-.807-.096-1.766-.096-3.686-.096H75.1c-4.71 0-7.065 0-8.936.732a10.653 10.653 0 0 0-6.042 6.041c-.731 1.871-.731 4.26-.731 9.04Z"
					fill="#E1E1E1"
				/>
				<rect x="60.766" y="1.883" width="48.11" height="48.11" rx="10.309" fill="#fff" />
				<path
					d="M85.616 43.597c6.028 0 10.09-2.935 11.041-7.456l-6.25-.412c-.682 1.856-2.427 2.823-4.68 2.823-3.38 0-5.52-2.236-5.52-5.87v-.015H96.8V30.81c0-8.281-5.013-12.374-11.454-12.374-7.17 0-11.819 5.092-11.819 12.612 0 7.726 4.585 12.548 12.089 12.548Zm-5.41-15.118c.143-2.777 2.253-4.998 5.251-4.998 2.935 0 4.966 2.095 4.982 4.998H80.206Zm2.554-12.866h4.775l4.839-7.218h-6.25l-3.364 7.218Z"
					fill="#000"
				/>
				<path
					d="M117.809 16.321v21.922c0 3.256 0 4.884.275 6.237a13.745 13.745 0 0 0 10.737 10.738c1.353.274 2.981.274 6.238.274h20.124c4.876 0 7.314 0 9.276-.678a12.37 12.37 0 0 0 7.655-7.655c.678-1.962.678-4.4.678-9.276V16.321c0-1.919 0-2.878-.096-3.685A13.745 13.745 0 0 0 160.665.605c-.806-.096-1.766-.096-3.685-.096h-23.462c-4.71 0-7.065 0-8.936.732a10.652 10.652 0 0 0-6.041 6.041c-.732 1.871-.732 4.26-.732 9.04Z"
					fill="#E1E1E1"
				/>
				<rect x="119.184" y="1.884" width="48.11" height="48.11" rx="10.309" fill="#fff" />
				<path
					d="M133.091 43.173h20.547V37.76h-11.65v-.175l11.236-14.45v-4.41h-19.719v5.412h11.554v.175L133.091 39.13v4.043Z"
					fill="#000"
				/>
				<path
					d="M176.229 16.321v21.922c0 3.256 0 4.884.275 6.237a13.746 13.746 0 0 0 10.738 10.738c1.353.274 2.981.274 6.237.274h20.124c4.876 0 7.314 0 9.276-.678a12.374 12.374 0 0 0 7.656-7.655c.677-1.962.677-4.4.677-9.276V16.321c0-1.919 0-2.878-.095-3.685A13.747 13.747 0 0 0 219.086.605c-.807-.096-1.767-.096-3.686-.096H191.939c-4.71 0-7.066 0-8.937.732a10.655 10.655 0 0 0-6.041 6.041c-.732 1.871-.732 4.26-.732 9.04Z"
					fill="#E1E1E1"
				/>
				<rect x="177.604" y="1.883" width="48.11" height="48.11" rx="10.309" fill="#fff" />
				<path
					d="M198.347 43.581c3.601 0 5.933-1.57 7.123-3.84h.19v3.38h6.41V26.686c0-5.807-4.918-8.25-10.344-8.25-5.838 0-9.677 2.792-10.613 7.234l6.25.508c.461-1.618 1.904-2.808 4.331-2.808 2.301 0 3.617 1.158 3.617 3.157v.095c0 1.57-1.665 1.777-5.901 2.19-4.823.444-9.154 2.062-9.154 7.503 0 4.823 3.443 7.266 8.091 7.266Zm1.936-4.664c-2.079 0-3.57-.968-3.57-2.824 0-1.904 1.571-2.84 3.95-3.173 1.476-.206 3.887-.555 4.696-1.094v2.585c0 2.555-2.11 4.506-5.076 4.506Z"
					fill="#000"
				/>
			</svg>
			<span class="text-center text-xs whitespace-nowrap text-slate-700">
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
			class="absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-2.5 py-1.5 text-xs text-blue-200 transition-colors hover:bg-blue-700 md:w-[240px] md:py-2 md:text-sm"
			on:click={() => handleNavClick()}
			in:fade={{ duration: 300 }}
			out:fade={{ duration: 300 }}
		>
			<span class="text-center leading-tight font-medium"> Поиск туалетов в Г корпусе </span>
		</a>
	{/if}

	{#if activeBanner === 'apps'}
		<a
			href="/apps"
			class="group absolute top-1/2 left-1/2 flex w-full -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1.5 text-xs text-amber-900 shadow-sm transition-colors hover:bg-amber-200 hover:shadow-md md:w-[240px] md:py-2 md:text-sm"
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
			<span class="text-center leading-tight font-medium"> Все сервисы ysturasp </span>
		</a>
	{/if}
</div>
