<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { RecentlyViewedItem, InstituteId } from '../types';
	import { recentlyViewedStore } from '../stores/recentlyViewedStore';

	const dispatch = createEventDispatcher<{
		viewAgain: { subject: string; institute: InstituteId };
	}>();

	let recentlyViewed: RecentlyViewedItem[] = [];

	function loadRecentlyViewed() {
		recentlyViewedStore.loadFromStorage();
	}

	function getInstituteName(instituteId: InstituteId): string {
		switch (instituteId) {
			case 'btn-digital-systems':
				return 'Институт Цифровых Систем';
			case 'btn-architecture-design':
				return 'Институт Архитектуры и Дизайна';
			case 'btn-civil-transport':
				return 'Институт Инженеров Строительства и Транспорта';
			case 'btn-chemistry':
				return 'Институт Химии и Химической Технологии';
			case 'btn-economics-management':
				return 'Институт Экономики и Менеджмента';
			case 'btn-engineering-machinery':
				return 'Институт Инженерии и Машиностроения';
			default:
				return '';
		}
	}

	function handleViewAgain(item: RecentlyViewedItem) {
		dispatch('viewAgain', { subject: item.discipline, institute: item.institute });
	}

	onMount(loadRecentlyViewed);

	recentlyViewedStore.subscribe((value) => {
		recentlyViewed = value;
	});
</script>

{#if recentlyViewed.length > 0}
	<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
		<div class="mb-4 border-b border-slate-700 pb-4">
			<h2 class="text-2xl font-semibold text-white md:text-3xl">Недавно просмотренные</h2>
		</div>

		<div
			class="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent overflow-x-auto pb-2"
		>
			<div class="flex gap-3">
				{#each recentlyViewed as item}
					<button
						class="group flex min-w-[200px] flex-col gap-2 rounded-xl bg-slate-700/40 p-4 text-left transition-all hover:bg-slate-700/60 hover:shadow-lg"
						aria-label="Открыть статистику предмета {item.discipline}"
						on:click={() => handleViewAgain(item)}
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleViewAgain(item);
							}
						}}
					>
						<div class="flex items-start justify-between gap-2">
							<h3
								class="truncate text-sm font-semibold text-white transition-colors group-hover:text-blue-400"
							>
								{item.discipline}
							</h3>
							<svg
								class="h-4 w-4 flex-shrink-0 text-slate-500 transition-colors group-hover:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								></path>
							</svg>
						</div>
						<p class="line-clamp-1 text-xs text-slate-400">
							{getInstituteName(item.institute)}
						</p>
						<div class="flex items-center gap-3 pt-1">
							<div class="flex items-center gap-1.5">
								<span class="text-xs text-slate-500">Средний балл</span>
								<span
									class="font-mono text-sm font-bold {item.stats.average >= 4
										? 'text-emerald-400'
										: item.stats.average >= 3
											? 'text-blue-400'
											: 'text-slate-400'}"
									>{item.stats.average.toFixed(2)}</span
								>
							</div>
							<span class="text-slate-600">•</span>
							<span class="font-mono text-xs text-slate-500"
								>{item.stats.totalCount} оценок</span
							>
						</div>
					</button>
				{/each}
			</div>
		</div>
	</section>
{/if}
