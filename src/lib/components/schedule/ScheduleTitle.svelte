<script lang="ts">
	import { quintOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import type { SemesterInfo } from '$lib/utils/semester';

	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let type: 'group' | 'teacher' | 'audience' = 'group';
	export let weekNumber: number | undefined = undefined;
	export let availableSemesters: SemesterInfo[] = [];
	export let selectedSemester: SemesterInfo | null = null;
	export let onSemesterSelect: ((semester: SemesterInfo) => void) | undefined = undefined;
	export let onSubgroupsClick: (() => void) | undefined = undefined;

	const typeLabels = {
		group: 'Расписание группы',
		teacher: 'Расписание преподавателя',
		audience: 'Расписание аудитории'
	};

	let showSemesterOptions = false;

	function handleSemesterSelect(semester: SemesterInfo) {
		if (onSemesterSelect) {
			onSemesterSelect(semester);
		}
		showSemesterOptions = false;
	}

	function toggleSemesterOptions() {
		showSemesterOptions = !showSemesterOptions;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showSemesterOptions) {
			showSemesterOptions = false;
		}
	}
</script>

<div class="flex flex-col justify-center md:items-center">
	<h2
		class="rounded-lg p-4 text-center text-xl font-bold text-white shadow-lg transition sm:mr-0 sm:ml-0 md:mr-20 md:ml-20 md:pr-20 md:pl-20 md:text-xl lg:text-3xl"
		style="background: radial-gradient(rgba(0, 96, 255, 0.74) 10%, rgba(255, 255, 255, 0) 100%);"
	>
		{typeLabels[type]}
		{title}
		{#if subtitle || weekNumber || (availableSemesters.length > 0 && selectedSemester)}
			<p class="text-sm text-gray-400">
				{#if weekNumber}
					Неделя {weekNumber}<span class="separator-dot"
						>{availableSemesters.length > 0 || selectedSemester ? ' • ' : ''}</span
					>
				{/if}
				{#if availableSemesters.length > 1}
					<span class="relative inline-block">
						<button
							on:click={toggleSemesterOptions}
							class="group flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white focus:outline-none"
						>
							<span>{selectedSemester?.name || 'Текущий семестр'}</span>
							<svg
								class="h-4 w-4 transition-transform duration-200 {showSemesterOptions
									? 'rotate-180'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if showSemesterOptions}
							<div
								class="absolute top-full left-1/2 z-50 mt-2 min-w-48 -translate-x-1/2 transform rounded-xl bg-slate-800 p-3 shadow-2xl ring-1 ring-blue-500/50"
								transition:scale={{
									duration: 200,
									opacity: 0,
									start: 0.95,
									easing: quintOut
								}}
							>
								{#each availableSemesters as semester}
									<button
										on:click={() => handleSemesterSelect(semester)}
										class="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm text-white transition-all last:mb-0 hover:ring-2 hover:ring-blue-500/30 {semester.id ===
										selectedSemester?.id
											? 'bg-slate-700'
											: ''}"
									>
										{semester.name}
									</button>
								{/each}
							</div>
						{/if}
					</span>
				{:else if selectedSemester}
					<span>{selectedSemester.name}</span>
				{/if}
				{#if subtitle}
					{availableSemesters.length > 0 || selectedSemester || weekNumber
						? ' • '
						: ''}{subtitle}
				{/if}
			</p>
			{#if onSubgroupsClick}
				<button
					on:click={onSubgroupsClick}
					class="mx-auto flex items-center justify-center gap-1 text-sm text-gray-300 transition-colors hover:text-gray-100"
				>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
						></path>
					</svg>
					Настроить подгруппы
				</button>
			{/if}
		{/if}
	</h2>
</div>

<svelte:window
	on:click={(e) => {
		const target = e.target as Element;
		if (!target?.closest('.relative')) {
			showSemesterOptions = false;
		}
	}}
	on:keydown={handleKeydown}
/>

<style>
	@media (max-width: 400px) {
		.separator-dot {
			display: none;
		}
	}

	.separator-dot {
		display: inline;
	}
</style>
