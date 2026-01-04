<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { SubjectStats, InstituteId } from '../types';
	import { getTopAntiTop } from '../utils/api';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

	const dispatch = createEventDispatcher<{
		viewAgain: { subject: string };
	}>();

	let top10: SubjectStats[] = [];
	let antitop10: SubjectStats[] = [];
	let isLoading = true;
	let currentInstitute: InstituteId = 'btn-digital-systems';

	const institutesList = [
		{ value: 'btn-digital-systems', label: 'Институт цифровых систем' },
		{ value: 'btn-architecture-design', label: 'Институт архитектуры и дизайна' },
		{ value: 'btn-civil-transport', label: 'Институт инженеров строительства и транспорта' },
		{ value: 'btn-chemistry', label: 'Институт химии и химической технологии' },
		{ value: 'btn-economics-management', label: 'Институт экономики и менеджмента' },
		{ value: 'btn-engineering-machinery', label: 'Институт инженерии и машиностроения' }
	];

	let filters = {
		course: 0,
		minGrades: 5
	};

	const minGradesOptions = [
		{ id: 5, label: '5+' },
		{ id: 10, label: '10+' },
		{ id: 25, label: '25+' },
		{ id: 50, label: '50+' },
		{ id: 100, label: '100+' },
		{ id: 200, label: '200+' }
	];

	async function fetchData() {
		isLoading = true;
		try {
			const data = await getTopAntiTop(currentInstitute, {
				course: filters.course || undefined,
				minGrades: filters.minGrades
			});
			top10 = data.top10;
			antitop10 = data.antitop10;
		} catch (error) {
			console.error('Ошибка загрузки данных:', error);
		} finally {
			isLoading = false;
		}
	}

	export function updateData(institute: InstituteId) {
		currentInstitute = institute;
		fetchData();
	}

	function handleFilterChange() {
		fetchData();
	}

	onMount(() => {
		fetchData();
	});
</script>

<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
		<div class="flex flex-col">
			<h2 class="text-xl font-bold tracking-tight text-white md:text-2xl">
				рейтинг предметов
			</h2>
			<span class="text-xs font-medium text-slate-400">
				{institutesList.find((i) => i.value === currentInstitute)?.label || ''}
			</span>
		</div>

		<div class="flex w-full flex-wrap items-center gap-3 md:w-auto">
			<div class="flex min-w-[200px] flex-1 flex-col gap-1 md:flex-initial">
				<span class="text-[9px] font-bold tracking-wider text-slate-500 uppercase"
					>курс</span
				>
				<div
					class="flex h-[40px] items-center gap-0.5 rounded-xl border border-[#334155] bg-[#1e293b] p-1"
				>
					{#each [0, 1, 2, 3, 4] as course}
						<button
							on:click={() => {
								filters.course = course;
								handleFilterChange();
							}}
							class="flex h-full flex-1 items-center justify-center rounded-lg text-[10px] font-bold transition-all {filters.course ===
							course
								? 'bg-[#334155] text-white shadow-sm'
								: 'text-slate-500 hover:text-slate-300'}"
						>
							{course === 0 ? 'все' : course}
						</button>
					{/each}
				</div>
			</div>

			<div class="flex min-w-[100px] flex-1 flex-col gap-1 md:flex-initial">
				<span class="text-[9px] font-bold tracking-wider text-slate-500 uppercase"
					>мин. оценок</span
				>
				<CustomSelect
					items={minGradesOptions}
					bind:selectedId={filters.minGrades}
					on:select={handleFilterChange}
					width="100%"
					maxHeight="250px"
					searchable={false}
				/>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
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
