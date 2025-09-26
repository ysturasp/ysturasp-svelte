<script lang="ts">
	import type { Institute } from '../types';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import CalendarExportModal from './CalendarExportModal.svelte';
	import {
		SEMESTER_WEEKS_COUNT,
		formatWeekStartDate,
		type SemesterInfo
	} from '$lib/utils/semester';

	let isCalendarModalOpen = false;

	export let institutes: Institute[] = [];
	export let selectedInstitute = '';
	export let selectedGroup = '';
	export let selectedWeek = '1';
	export let onSubmit: () => void;
	export let isLoading = false;
	export let showFavoriteButton = false;
	export let isFavorite = false;
	export let favoriteGroups: string[] = [];
	export let submitButtonText = 'Показать расписание';
	export let copyButtonText = 'Копировать';
	export let selectedSemester: SemesterInfo | null = null;

	let isInitialized = false;
	let previousGroup = '';
	let previousInstitute = '';
	let previousWeek = '';
	let instituteError = false;
	let groupError = false;
	let weekError = false;
	let highlightInstitute = false;

	$: instituteItems = institutes
		.filter(
			(institute) =>
				institute.name !== 'Институт Магии и Игр' &&
				institute.name !== 'Химико-технологический факультет'
		)
		.map((institute) => ({
			id: institute.name,
			label: institute.name
		}));

	$: groupItems = selectedInstitute
		? institutes
				.find((inst) => inst.name === selectedInstitute)
				?.groups.map((group) => ({
					id: group,
					label: group
				})) || []
		: [];

	$: weeks = Array.from({ length: SEMESTER_WEEKS_COUNT }, (_, i) => {
		const weekNum = i + 1;
		const startDate = formatWeekStartDate(weekNum, selectedSemester || undefined);
		return {
			id: weekNum.toString(),
			label: `${weekNum} - ${startDate}`
		};
	});

	function handleGroupClick() {
		if (!selectedInstitute && !isLoading) {
			groupError = true;
			highlightInstitute = true;
			setTimeout(() => {
				groupError = false;
				highlightInstitute = false;
			}, 1000);
		}
	}

	function handleSubmit() {
		instituteError = false;
		groupError = false;
		weekError = false;

		setTimeout(() => {
			instituteError = !selectedInstitute;
			groupError = !selectedGroup;
			weekError = !selectedWeek;

			if (!selectedInstitute || !selectedGroup || !selectedWeek) {
				return;
			}

			if (selectedInstitute !== previousInstitute || selectedGroup !== previousGroup) {
				onSubmit();
			}
		}, 10);
	}

	$: {
		if (isInitialized) {
			if (selectedInstitute !== previousInstitute) {
				previousInstitute = selectedInstitute;
				selectedGroup = '';
				selectedWeek = '1';
			}

			if (selectedGroup !== previousGroup) {
				previousGroup = selectedGroup;

				if (selectedGroup) {
					onSubmit();
				}
			}

			if (selectedWeek !== previousWeek) {
				previousWeek = selectedWeek;
			}
		}

		if (institutes.length > 0 && !isInitialized) {
			isInitialized = true;
			previousGroup = selectedGroup;
			previousInstitute = selectedInstitute;
			previousWeek = selectedWeek;
		}
	}

	function toggleFavorite() {
		if (!selectedGroup) return;

		let favorites = JSON.parse(localStorage.getItem('favoriteGroups') || '[]');

		if (isFavorite) {
			favorites = favorites.filter((group: string) => group !== selectedGroup);
		} else {
			favorites.push(selectedGroup);
		}

		localStorage.setItem('favoriteGroups', JSON.stringify(favorites));
		favoriteGroups = favorites;
		isFavorite = !isFavorite;
	}

	function selectFavoriteGroup(group: string) {
		const institute = institutes.find((inst) => inst.groups.includes(group));
		if (institute) {
			selectedInstitute = institute.name;
			selectedGroup = group;
			onSubmit();
		}
	}
</script>

<form class="grid grid-cols-1 gap-1" on:submit|preventDefault={handleSubmit}>
	<div>
		<label for="institute-select" class="mb-1 block text-white">Институт:</label>
		<CustomSelect
			items={instituteItems}
			bind:selectedId={selectedInstitute}
			placeholder={isLoading ? 'Загрузка институтов...' : 'Выберите институт'}
			{isLoading}
			error={instituteError}
			highlight={highlightInstitute}
			searchPlaceholder="Поиск института..."
			width="100%"
		/>
	</div>

	<div>
		<label for="group-select" class="mb-1 block text-white">Группа:</label>
		<div
			role="button"
			tabindex="-1"
			on:click={handleGroupClick}
			on:keydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleGroupClick();
				}
			}}
		>
			<CustomSelect
				items={groupItems}
				bind:selectedId={selectedGroup}
				placeholder={selectedInstitute ? 'Выберите группу' : 'Сначала выберите институт'}
				{isLoading}
				error={groupError}
				disabled={!selectedInstitute || isLoading}
				searchPlaceholder="Поиск группы..."
				width="100%"
			/>
		</div>
	</div>

	<div>
		<label for="week-select" class="mb-1 block text-white">Неделя:</label>
		<CustomSelect
			items={weeks}
			bind:selectedId={selectedWeek}
			placeholder="Выберите неделю"
			isLoading={false}
			error={weekError}
			searchPlaceholder="Поиск недели..."
			width="100%"
		/>
	</div>

	<div class="mt-1 flex flex-col gap-2">
		<button
			type="submit"
			class="rounded-lg bg-blue-700 p-2 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
			disabled={isLoading}
		>
			{isLoading ? 'Загрузка...' : submitButtonText}
		</button>

		{#if (selectedInstitute && selectedGroup && selectedWeek) || showFavoriteButton}
			<div class="-mb-2 flex items-center justify-center gap-1 rounded-lg bg-slate-800">
				{#if selectedInstitute && selectedGroup && selectedWeek}
					<CopyLinkButton
						disabled={!selectedInstitute || !selectedGroup || !selectedWeek}
						params={{ institute: selectedInstitute, group: selectedGroup }}
						successMessage="Ссылка на расписание скопирована"
					>
						{copyButtonText}
					</CopyLinkButton>

					<button
						on:click={() => (isCalendarModalOpen = true)}
						disabled={!selectedGroup}
						class="flex h-8 items-center gap-1 rounded-lg bg-slate-700 px-1.5 text-[11px] text-blue-400 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						<span>Календарь</span>
					</button>
				{/if}

				{#if showFavoriteButton}
					<button
						on:click={toggleFavorite}
						class="flex h-8 items-center gap-1 rounded-lg bg-slate-700 px-1.5 text-[11px] text-blue-400 transition-all hover:bg-slate-600"
					>
						<svg
							class="h-4 w-4"
							fill={isFavorite ? 'currentColor' : 'none'}
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
							/>
						</svg>
						<span>{isFavorite ? 'В избранном' : 'В избранное'}</span>
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<CalendarExportModal
		isOpen={isCalendarModalOpen}
		onClose={() => (isCalendarModalOpen = false)}
		{selectedGroup}
	/>

	{#if favoriteGroups.length > 0}
		<section class="mt-2 rounded-lg bg-slate-800">
			<div class="flex items-center">
				<h2 class="text-2xl font-semibold text-white">❤️ Избранные группы</h2>
				<button type="button" class="ml-2 rounded-lg border-2 border-slate-600 text-3xl">
					❓
				</button>
			</div>
			<div class="mt-2 flex flex-wrap gap-2">
				{#each favoriteGroups as group}
					<button
						on:click={() => selectFavoriteGroup(group)}
						class="rounded bg-blue-600 px-3 py-1 text-sm text-white transition-all hover:bg-blue-700"
					>
						{group}
					</button>
				{/each}
			</div>
		</section>
	{/if}
</form>
