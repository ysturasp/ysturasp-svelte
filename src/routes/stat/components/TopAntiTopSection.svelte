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

<section class="mt-8 rounded-2xl bg-slate-800 p-6">
	<h2 class="mb-4 text-2xl font-semibold text-white">📊 Рейтинг предметов</h2>
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div>
			<h3 class="mb-2 text-xl font-bold text-emerald-400">🏆 Лучшие предметы</h3>
			<ul class="space-y-4">
				{#if isLoading}
					<li class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md">
						<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-gray-600"></div>
						<div class="h-4 w-3/5 animate-pulse rounded bg-gray-600"></div>
					</li>
					<li class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md">
						<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-gray-600"></div>
						<div class="h-4 w-3/5 animate-pulse rounded bg-gray-600"></div>
					</li>
				{:else}
					{#each top10 as item}
						<li
							class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md transition-all duration-300 hover:shadow-xl"
						>
							<div
								class="cursor-pointer font-semibold text-emerald-500 transition-colors duration-200 hover:text-emerald-400"
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
								{item.position}. {item.subject}
							</div>
							<div class="text-slate-400">
								Средний балл: {item.average.toFixed(2)}
							</div>
							<div class="text-slate-400">Оценок: {item.count}</div>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
		<div>
			<h3 class="mb-2 text-xl font-bold text-red-400">👎 Худшие предметы</h3>
			<ul class="space-y-4">
				{#if isLoading}
					<li class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md">
						<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-gray-600"></div>
						<div class="h-4 w-3/5 animate-pulse rounded bg-gray-600"></div>
					</li>
					<li class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md">
						<div class="mb-2 h-5 w-4/5 animate-pulse rounded bg-gray-600"></div>
						<div class="h-4 w-3/5 animate-pulse rounded bg-gray-600"></div>
					</li>
				{:else}
					{#each antitop10 as item}
						<li
							class="mb-4 rounded-2xl bg-gray-900 p-4 shadow-md transition-all duration-300 hover:shadow-xl"
						>
							<div
								class="cursor-pointer font-semibold text-red-500 transition-colors duration-200 hover:text-red-400"
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
								{item.position}. {item.subject}
							</div>
							<div class="text-slate-400">
								Средний балл: {item.average.toFixed(2)}
							</div>
							<div class="text-slate-400">Оценок: {item.count}</div>
						</li>
					{/each}
				{/if}
			</ul>
		</div>
	</div>
</section>
