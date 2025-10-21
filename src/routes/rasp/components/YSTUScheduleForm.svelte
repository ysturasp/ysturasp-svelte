<script lang="ts">
	import type { Institute, ScheduleData } from '../types';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import CalendarExportModal from './CalendarExportModal.svelte';
	import NotificationSettingsModal from './NotificationSettingsModal.svelte';
	import { hiddenSubjects } from '../stores';
	import {
		SEMESTER_WEEKS_COUNT,
		formatWeekStartDate,
		type SemesterInfo
	} from '$lib/utils/semester';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';

	let isCalendarModalOpen = false;
	let isNotificationModalOpen = false;
	let isTelegramMiniApp = false;

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
	export let scheduleData: ScheduleData | null = null;

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
			const currentWeek = selectedWeek;
			selectedInstitute = institute.name;
			setTimeout(() => {
				selectedGroup = group;
				selectedWeek = currentWeek;
			}, 0);
		}
	}

	$: isTelegramMiniApp = checkIsTelegramMiniApp();
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
						class="flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg bg-slate-700 px-1.5 text-[10px] text-blue-400 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:flex-row sm:items-center sm:gap-1 sm:text-[11px]"
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

					<button
						on:click={() => (isNotificationModalOpen = true)}
						disabled={!selectedGroup}
						class="flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg bg-slate-700 px-1.5 text-[10px] text-blue-400 transition-all hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:flex-row sm:items-center sm:gap-1 sm:text-[11px]"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 2a7 7 0 00-7 7v4.29l-1.71 1.7a1 1 0 00-.29.71v1a1 1 0 001 1h16a1 1 0 001-1v-1a1 1 0 00-.29-.71L19 13.29V9a7 7 0 00-7-7zM10 21a2 2 0 104 0"
							/>
						</svg>
						<span>Уведомления</span>
					</button>
				{/if}

				{#if showFavoriteButton}
					<button
						on:click={toggleFavorite}
						class="flex h-12 flex-col items-center justify-center gap-0.5 rounded-lg bg-slate-700 px-1.5 text-[10px] text-blue-400 transition-all hover:bg-slate-600 sm:h-8 sm:flex-row sm:items-center sm:gap-1 sm:text-[11px]"
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

	<NotificationSettingsModal
		isOpen={isNotificationModalOpen}
		onClose={() => (isNotificationModalOpen = false)}
		groupName={selectedGroup}
		hiddenSubjects={$hiddenSubjects[selectedGroup] || []}
		{scheduleData}
	/>

	{#if favoriteGroups.length > 0}
		<section class="mt-3 rounded-2xl bg-slate-900/40 p-3 ring-1 ring-slate-700/50">
			<div class="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
				<div class="flex items-center gap-2">
					<div class="rounded-lg bg-red-500/20 p-1.5">
						<svg class="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
							<path
								d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
							/>
						</svg>
					</div>
					<span class="text-sm font-medium text-white">Избранные</span>
					<span class="text-xs text-gray-400">({favoriteGroups.length})</span>
				</div>
				<div class="flex flex-wrap gap-1.5">
					{#each favoriteGroups as group}
						<button
							on:click={() => selectFavoriteGroup(group)}
							class="group relative rounded-xl bg-slate-700 px-3 py-1.5 text-xs text-white transition-all hover:bg-blue-600 hover:shadow-md"
						>
							<span class="relative z-10">{group}</span>
							<div
								class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-blue-500/0 transition-all group-hover:from-blue-500/10 group-hover:to-blue-500/20"
							></div>
						</button>
					{/each}
				</div>
			</div>
		</section>
	{/if}
</form>
