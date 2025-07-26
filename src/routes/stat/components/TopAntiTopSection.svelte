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
					<li class="skeleton-item">
						<div class="skeleton skeleton-title"></div>
						<div class="skeleton skeleton-text"></div>
					</li>
					<li class="skeleton-item">
						<div class="skeleton skeleton-title"></div>
						<div class="skeleton skeleton-text"></div>
					</li>
				{:else}
					{#each top10 as item}
						<li class="list-item">
							<div
								class="cursor-pointer font-semibold text-emerald-500"
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
					<li class="skeleton-item">
						<div class="skeleton skeleton-title"></div>
						<div class="skeleton skeleton-text"></div>
					</li>
					<li class="skeleton-item">
						<div class="skeleton skeleton-title"></div>
						<div class="skeleton skeleton-text"></div>
					</li>
				{:else}
					{#each antitop10 as item}
						<li class="list-item">
							<div
								class="cursor-pointer font-semibold text-red-500"
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

<style>
	.list-item {
		padding: 1rem;
		background-color: #111827;
		margin-bottom: 1rem;
		border-radius: 18px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		transition:
			background-color 0.3s,
			box-shadow 0.3s;
	}

	.skeleton {
		background-color: #555555;
		border-radius: 4px;
		margin-bottom: 8px;
		background-image: linear-gradient(
			90deg,
			rgba(255, 255, 255, 0),
			rgba(255, 255, 255, 0.5),
			rgba(255, 255, 255, 0)
		);
		background-size: 40px 100%;
		background-repeat: no-repeat;
		background-position: left -40px top 0;
		animation: shine 1s ease infinite;
	}

	.skeleton-title {
		height: 20px;
		width: 80%;
	}

	.skeleton-text {
		height: 16px;
		width: 60%;
	}

	@keyframes shine {
		to {
			background-position: right -40px top 0;
		}
	}
</style>
