<script lang="ts">
	import type { Auditorium, Route } from '../types';

	export let routeStart: Auditorium | null = null;
	export let routeEnd: Auditorium | null = null;
	export let currentRoute: Route | null = null;
	export let auditoriums: Auditorium[] = [];
	export let onStartChange: (aud: Auditorium | null) => void = () => {};
	export let onEndChange: (aud: Auditorium | null) => void = () => {};
	export let onSwap: () => void = () => {};

	let startSearch = '';
	let endSearch = '';
	let startFiltered: Auditorium[] = [];
	let endFiltered: Auditorium[] = [];
	let startDropdownOpen = false;
	let endDropdownOpen = false;

	function filterAuditoriums(query: string): Auditorium[] {
		if (!query.trim()) return [];
		const lower = query.toLowerCase();
		return auditoriums.filter((aud) => aud.name.toLowerCase().includes(lower)).slice(0, 10);
	}

	function handleStartInput(e: Event) {
		const target = e.target as HTMLInputElement;
		startSearch = target.value;
		startFiltered = filterAuditoriums(startSearch);
		startDropdownOpen = startFiltered.length > 0;
	}

	function handleEndInput(e: Event) {
		const target = e.target as HTMLInputElement;
		endSearch = target.value;
		endFiltered = filterAuditoriums(endSearch);
		endDropdownOpen = endFiltered.length > 0;
	}

	function selectStart(aud: Auditorium) {
		onStartChange(aud);
		startSearch = aud.name;
		startFiltered = [];
		startDropdownOpen = false;
	}

	function selectEnd(aud: Auditorium) {
		onEndChange(aud);
		endSearch = aud.name;
		endFiltered = [];
		endDropdownOpen = false;
	}

	function clearStart() {
		onStartChange(null);
		startSearch = '';
		startFiltered = [];
		startDropdownOpen = false;
	}

	function clearEnd() {
		onEndChange(null);
		endSearch = '';
		endFiltered = [];
		endDropdownOpen = false;
	}

	function handleSwap() {
		onSwap();

		startFiltered = [];
		endFiltered = [];
		startDropdownOpen = false;
		endDropdownOpen = false;
	}

	$: startSearch = routeStart ? routeStart.name : '';
	$: endSearch = routeEnd ? routeEnd.name : '';
</script>

<div class="fixed bottom-4 left-1/2 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
	<div
		class="rounded-3xl bg-slate-900/95 px-2.5 py-2 shadow-lg ring-1 ring-blue-500/30 backdrop-blur-sm"
	>
		{#if currentRoute}
			<div class="mb-3 flex items-center justify-between rounded-lg bg-blue-500/10 px-3 py-2">
				<div class="flex items-center gap-4">
					<span class="text-sm text-white">
						Маршрут: <span class="font-semibold"
							>{Math.max(1, currentRoute.instructions.length)}</span
						> шагов
					</span>
					{#if currentRoute.totalDistance > 0}
						<span class="text-xs text-gray-400">
							~{Math.round(currentRoute.totalDistance)} м
						</span>
					{/if}
				</div>
				{#if currentRoute.instructions.length > 0}
					<details class="text-xs text-blue-400">
						<summary class="cursor-pointer hover:text-blue-300">Инструкции</summary>
						<ul class="mt-2 space-y-1 text-gray-300">
							{#each currentRoute.instructions as instruction}
								<li>• {instruction}</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{/if}

		<div class="flex items-center gap-2">
			<div class="relative min-w-0 flex-1">
				<div class="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2">
					<div class="h-3 w-3 rounded-full bg-green-500"></div>
					<input
						type="text"
						placeholder="Откуда"
						bind:value={startSearch}
						on:input={handleStartInput}
						on:focus={() => {
							if (startSearch) {
								startFiltered = filterAuditoriums(startSearch);
								startDropdownOpen = startFiltered.length > 0;
							}
						}}
						class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
					/>
					{#if routeStart}
						<button
							on:click={clearStart}
							class="text-gray-400 transition-colors hover:text-white"
							aria-label="Очистить"
						>
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					{/if}
				</div>
				{#if startDropdownOpen && startFiltered.length > 0}
					<div
						class="absolute right-0 bottom-full left-0 mb-2 max-h-48 overflow-y-auto rounded-lg bg-slate-800 shadow-lg"
					>
						{#each startFiltered as aud}
							<button
								on:click={() => selectStart(aud)}
								class="w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
							>
								{aud.name}
								{#if aud.floor}
									<span class="text-xs text-gray-400"> (Этаж {aud.floor})</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button
				on:click={handleSwap}
				class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-gray-400 transition-all hover:bg-slate-700 hover:text-white"
				aria-label="Поменять местами"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
					></path>
				</svg>
			</button>

			<div class="relative min-w-0 flex-1">
				<div class="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2">
					<div class="h-3 w-3 rounded-full bg-amber-500"></div>
					<input
						type="text"
						placeholder="Куда"
						bind:value={endSearch}
						on:input={handleEndInput}
						on:focus={() => {
							if (endSearch) {
								endFiltered = filterAuditoriums(endSearch);
								endDropdownOpen = endFiltered.length > 0;
							}
						}}
						class="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
					/>
					{#if routeEnd}
						<button
							on:click={clearEnd}
							class="text-gray-400 transition-colors hover:text-white"
							aria-label="Очистить"
						>
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					{/if}
				</div>
				{#if endDropdownOpen && endFiltered.length > 0}
					<div
						class="absolute right-0 bottom-full left-0 mb-2 max-h-48 overflow-y-auto rounded-lg bg-slate-800 shadow-lg"
					>
						{#each endFiltered as aud}
							<button
								on:click={() => selectEnd(aud)}
								class="w-full px-3 py-2 text-left text-sm text-white transition-colors hover:bg-slate-700"
							>
								{aud.name}
								{#if aud.floor}
									<span class="text-xs text-gray-400"> (Этаж {aud.floor})</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
