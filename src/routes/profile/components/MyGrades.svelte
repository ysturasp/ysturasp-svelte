<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { slide, fade } from 'svelte/transition';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import Checkbox from '$lib/components/ui/Checkbox.svelte';

	const dispatch = createEventDispatcher();

	interface Mark {
		inDiplom: number;
		markName: string | null;
		mark: number;
		semester: number;
		controlTypeName: string;
		years: string;
		course: number;
		lessonName: string;
		creditUnit: number;
		hasDebt: number;
	}

	let marks: Mark[] = [];
	let isLoading = true;
	let error: string | null = null;
	let selectedSemester: number | 'all' = 'all';
	let onlyDiplom = false;
	let averageMark = '0.00';

	async function fetchMarks() {
		isLoading = true;
		error = null;
		try {
			const response = await fetch('/api/auth/ystu/marks');
			if (response.ok) {
				marks = await response.json();
				marks = marks.sort((a, b) => {
					if (a.course !== b.course) return b.course - a.course;
					return b.semester - a.semester;
				});
			} else {
				const data = await response.json();
				error = data.error || 'Ошибка загрузки оценок';
			}
		} catch (e) {
			error = 'Сетевая ошибка при загрузке оценок';
		} finally {
			isLoading = false;
		}
	}

	onMount(() => {
		if ($auth.academicUser) {
			fetchMarks();
		}
	});

	$: filteredMarks = marks
		.filter((m) => (selectedSemester === 'all' ? true : m.semester === selectedSemester))
		.filter((m) => (onlyDiplom ? m.inDiplom === 1 : true));

	$: semesters = [...new Set(marks.map((m) => m.semester))].sort((a, b) => b - a);

	$: selectItems = [
		{ id: 'all', label: 'Все семестры' },
		...semesters.map((sem) => ({ id: sem, label: `${sem} семестр` }))
	];

	$: counts = {
		5: marks.filter((m) => m.mark === 5 || m.markName?.toLowerCase().includes('отлично'))
			.length,
		4: marks.filter((m) => m.mark === 4 || m.markName?.toLowerCase().includes('хорошо')).length,
		3: marks.filter((m) => m.mark === 3 || m.markName?.toLowerCase().includes('удовл')).length,
		2: marks.filter((m) => m.mark === 2 || (m.mark > 0 && m.mark < 3)).length,
		0: marks.filter((m) => m.mark === 0 && m.markName?.toLowerCase().includes('зачет')).length
	};

	$: {
		const numericMarks = filteredMarks.filter((m) => m.mark > 0);
		averageMark =
			numericMarks.length > 0
				? (
						filteredMarks.reduce((acc, m) => acc + (m.mark || 0), 0) /
						numericMarks.length
					).toFixed(2)
				: '0.00';
	}

	$: validMarks = marks.filter((m) => m.mark > 0);
	$: credits = marks.filter(
		(m) => m.mark === 0 && m.markName?.toLowerCase().includes('зачет')
	).length;

	$: dispatch('averageUpdate', {
		average: parseFloat(averageMark),
		total: validMarks.length,
		credits: credits,
		grades: validMarks.length,
		counts
	});

	function handleSemesterSelect(event: CustomEvent) {
		selectedSemester = event.detail.id;
	}

	function getMarkColor(mark: number, name: string | null) {
		if (mark === 5 || name?.toLowerCase().includes('отлично')) return 'text-emerald-400';
		if (mark === 4 || name?.toLowerCase().includes('хорошо')) return 'text-blue-400';
		if (mark === 3 || name?.toLowerCase().includes('удовл')) return 'text-amber-400';
		if (mark === 0 && name?.toLowerCase().includes('зачет')) return 'text-emerald-400';
		if (mark > 0) return 'text-rose-400';
		return 'text-slate-500';
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<h2 class="text-xl font-bold tracking-tight text-white md:text-2xl">Мои оценки</h2>
			<p class="mt-1 text-xs font-medium tracking-wider text-slate-400 uppercase">
				История успеваемости
			</p>
		</div>

		{#if marks.length > 0}
			<div class="flex flex-row items-center gap-3">
				<CustomSelect
					items={selectItems}
					selectedId={selectedSemester}
					on:select={handleSemesterSelect}
					width="180px"
					searchable={false}
				/>
				<Checkbox
					bind:checked={onlyDiplom}
					label="Только в диплом"
					labelClass="text-slate-400 text-[11px] font-bold tracking-wider uppercase"
				/>
			</div>
		{/if}
	</div>

	{#if isLoading}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2" transition:fade>
			{#each Array(6) as _}
				<div class="h-16 animate-pulse rounded-xl bg-slate-800/40"></div>
			{/each}
		</div>
	{:else if error}
		<div class="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center">
			<p class="font-medium text-rose-400">{error}</p>
			<button
				on:click={fetchMarks}
				class="mt-3 rounded-lg bg-rose-500 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-rose-400"
			>
				Попробовать снова
			</button>
		</div>
	{:else}
		<div class="space-y-1">
			<div
				class="mb-2 flex items-center justify-between border-b border-white/5 px-1 pb-2 text-[10px] font-black tracking-widest text-slate-500 uppercase"
			>
				<div class="flex-1">Дисциплина</div>
				<div class="w-24 pl-4 text-right">Оценка</div>
			</div>

			{#each filteredMarks as mark}
				<div
					class="group flex items-center justify-between border-b border-white/5 px-1 py-2 transition-colors last:border-0 hover:bg-white/[0.02]"
					transition:slide={{ duration: 150 }}
				>
					<div class="min-w-0 flex-1">
						<div class="mb-0.5 flex flex-wrap items-center gap-2">
							<span
								class="text-[9px] font-black tracking-tighter text-slate-600 uppercase"
							>
								{mark.semester} СЕМ
							</span>
							<span class="text-[9px] font-bold text-slate-500 uppercase">
								{mark.controlTypeName}
							</span>
							{#if mark.inDiplom === 1}
								<span
									class="inline-flex items-center gap-1 text-[9px] font-semibold tracking-wider text-amber-300/70 uppercase"
									title="Эта оценка учитывается в приложении к диплому"
								>
									<span class="h-1.5 w-1.5 rounded-full bg-amber-400/70"></span>
									в дипломе
								</span>
							{/if}
						</div>
						<h4
							class="truncate text-xs font-bold tracking-tight text-slate-300 uppercase transition-colors group-hover:text-white"
						>
							{mark.lessonName}
						</h4>
					</div>
					<div class="pl-4 text-right">
						<div class="flex flex-col items-end gap-0.5">
							<div
								class="text-sm font-black {getMarkColor(
									mark.mark,
									mark.markName
								)} uppercase"
							>
								{mark.markName || (mark.mark > 0 ? mark.mark : '—')}
							</div>

							<div
								class="text-[9px] font-bold tracking-tighter text-slate-600 uppercase"
							>
								{mark.years}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
