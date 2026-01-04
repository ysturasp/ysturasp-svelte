<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { SubjectStats, InstituteId } from '../types';
	import { getTopAntiTop } from '../utils/api';

	const dispatch = createEventDispatcher<{
		viewAgain: { subject: string };
	}>();

	let top10: SubjectStats[] = [];
	let antitop10: SubjectStats[] = [];
	let isLoading = true;

	async function fetchData(institute: InstituteId) {
		try {
			const data = await getTopAntiTop(institute);
			top10 = data.top10;
			antitop10 = data.antitop10;
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
		} finally {
			isLoading = false;
		}
	}

	export function updateData(institute: InstituteId) {
		isLoading = true;
		fetchData(institute);
	}

	onMount(() => {
		fetchData('btn-digital-systems');
	});
</script>

<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<h2 class="text-2xl font-semibold text-white md:text-3xl">Рейтинг предметов</h2>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div class="flex flex-col gap-3">
			<h4
				class="border-b border-white/10 pb-2 text-[20px] font-bold tracking-wider text-slate-500 uppercase"
			>
				Лучшие предметы
			</h4>
			<div class="flex flex-col">
				{#if isLoading}
					{#each Array(10) as _}
						<div
							class="group flex items-baseline justify-between border-l-2 border-transparent py-1.5 pl-3 text-sm"
						>
							<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-slate-700"></div>
							<div class="h-4 w-3/5 animate-pulse rounded bg-slate-700"></div>
						</div>
					{/each}
				{:else}
					{#each top10 as item, i}
						{@const isTop3 = item.position <= 3}
						<div
							class="group flex items-baseline justify-between border-l-2 {isTop3
								? 'border-emerald-500/50'
								: 'border-transparent'} cursor-pointer py-1.5 pl-3 text-sm transition-all hover:border-emerald-500/30 hover:bg-slate-800/30"
							aria-label="Открыть модальное окно с предметом"
							role="button"
							tabindex="0"
							on:click={() => dispatch('viewAgain', { subject: item.subject })}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									dispatch('viewAgain', { subject: item.subject });
								}
							}}
						>
							<div class="flex min-w-0 items-baseline gap-3 overflow-hidden">
								<span
									class="w-5 font-mono text-[10px] {isTop3
										? 'font-bold text-emerald-400'
										: 'text-slate-600'} transition-colors group-hover:text-slate-400"
									>{item.position}.</span
								>
								<span
									class="truncate font-medium text-slate-300 transition-colors group-hover:text-white"
									>{item.subject}</span
								>
							</div>
							<div class="ml-2 flex items-baseline gap-1">
								<span class="font-mono text-xs text-slate-600">x{item.count}</span>
								<span
									class="w-10 text-right font-mono font-bold {isTop3
										? 'text-emerald-400'
										: 'text-slate-400'}">{item.average.toFixed(2)}</span
								>
							</div>
						</div>
						{#if i === 2 && top10.length > 3}
							<div class="my-1 border-t border-white/5"></div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>

		<div class="flex flex-col gap-3">
			<h4
				class="border-b border-white/10 pb-2 text-[20px] font-bold tracking-wider text-slate-500 uppercase"
			>
				Худшие предметы
			</h4>
			<div class="flex flex-col">
				{#if isLoading}
					{#each Array(10) as _}
						<div
							class="group flex items-baseline justify-between border-l-2 border-transparent py-1.5 pl-3 text-sm"
						>
							<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-slate-700"></div>
							<div class="h-4 w-3/5 animate-pulse rounded bg-slate-700"></div>
						</div>
					{/each}
				{:else}
					{#each antitop10 as item, i}
						{@const isBottom3 = item.position <= 3}
						<div
							class="group flex items-baseline justify-between border-l-2 {isBottom3
								? 'border-rose-500/50'
								: 'border-transparent'} cursor-pointer py-1.5 pl-3 text-sm transition-all hover:border-rose-500/30 hover:bg-slate-800/30"
							aria-label="Открыть модальное окно с предметом"
							role="button"
							tabindex="0"
							on:click={() => dispatch('viewAgain', { subject: item.subject })}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									dispatch('viewAgain', { subject: item.subject });
								}
							}}
						>
							<div class="flex min-w-0 items-baseline gap-3 overflow-hidden">
								<span
									class="w-5 font-mono text-[10px] {isBottom3
										? 'font-bold text-rose-400'
										: 'text-slate-600'} transition-colors group-hover:text-slate-400"
									>{item.position}.</span
								>
								<span
									class="truncate font-medium text-slate-300 transition-colors group-hover:text-white"
									>{item.subject}</span
								>
							</div>
							<div class="ml-2 flex items-baseline gap-1">
								<span class="font-mono text-xs text-slate-600">x{item.count}</span>
								<span
									class="w-10 text-right font-mono font-bold {isBottom3
										? 'text-rose-400'
										: 'text-slate-400'}">{item.average.toFixed(2)}</span
								>
							</div>
						</div>
						{#if i === 2 && antitop10.length > 3}
							<div class="my-1 border-t border-white/5"></div>
						{/if}
					{/each}
				{/if}
			</div>
		</div>
	</div>
</section>
