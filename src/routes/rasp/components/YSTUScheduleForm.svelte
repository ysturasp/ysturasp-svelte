<script lang="ts">
	import type { Institute } from '../types';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import { SEMESTER_WEEKS_COUNT, formatWeekStartDate } from '$lib/utils/semester';

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
	export let copyButtonText = 'Скопировать ссылку на расписание';

	let isInitialized = false;
	let previousGroup = '';
	let previousInstitute = '';
	let instituteError = false;
	let groupError = false;
	let weekError = false;
	let highlightInstitute = false;

	$: instituteItems = institutes
		.filter((institute) => institute.name !== 'Институт Магии и Игр' && institute.name !== 'Химико-технологический факультет')
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
		const startDate = formatWeekStartDate(weekNum);
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

			onSubmit();
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
		}

		if (institutes.length > 0 && !isInitialized) {
			isInitialized = true;
			previousGroup = selectedGroup;
			previousInstitute = selectedInstitute;
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

	<button
		type="submit"
		class="my-1 rounded-lg bg-blue-700 p-2 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={isLoading}
	>
		{isLoading ? 'Загрузка...' : submitButtonText}
	</button>

	<div class="flex w-full items-center justify-between">
		{#if selectedInstitute && selectedGroup && selectedWeek}
			<CopyLinkButton
				disabled={!selectedInstitute || !selectedGroup || !selectedWeek}
				params={{ institute: selectedInstitute, group: selectedGroup }}
				successMessage="Ссылка на расписание скопирована"
			>
				{copyButtonText}
			</CopyLinkButton>
		{/if}

		{#if showFavoriteButton}
			<button
				on:click={toggleFavorite}
				class="flex items-center justify-center rounded-2xl border-2 border-yellow-500 p-2 text-white transition-all hover:bg-yellow-500"
			>
				<span class="align-middle text-3xl md:text-xl">{isFavorite ? '★' : '☆'}</span>
				<span class="ml-2 hidden align-middle text-sm md:inline">
					{isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
				</span>
			</button>
		{/if}
	</div>

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
