<script lang="ts">
	import type { Teacher } from '../api';
	import SimpleCombobox from '$lib/components/schedule/SimpleCombobox.svelte';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import { formatWeekStartDate } from '$lib/utils/semester';
	import { page } from '$app/stores';
	import { replaceState } from '$app/navigation';

	export let teachers: Teacher[] = [];
	export let selectedTeacher = '';
	export let selectedWeek = 1;
	export let onSubmit: () => void;
	export let isLoading = false;
	export let submitButtonText = 'Показать расписание';
	export let copyButtonText = 'Скопировать ссылку на расписание';

	let teacherError = false;
	let weekError = false;
	let copied = false;

	$: if (selectedTeacher) teacherError = false;
	$: if (selectedWeekString) weekError = false;

	function copyScheduleLink() {
		const url = new URL(window.location.href);
		url.searchParams.set('teacher', selectedTeacher);
		url.searchParams.set('week', selectedWeek.toString());
		navigator.clipboard.writeText(url.toString());
		copied = true;
		setTimeout(() => (copied = false), 2000);
		replaceState(url, { noscroll: true });
	}

	function handleSubmit() {
		teacherError = false;
		weekError = false;

		setTimeout(() => {
			teacherError = !selectedTeacher;
			weekError = !selectedWeekString;

			if (!selectedTeacher || !selectedWeekString) {
				return;
			}

			const url = new URL(window.location.href);
			url.searchParams.set('teacher', selectedTeacher);
			url.searchParams.set('week', selectedWeek.toString());
			replaceState(url, { noscroll: true });
			onSubmit();
		}, 10);
	}

	const weeks = Array.from({ length: 18 }, (_, i) => {
		const weekNum = i + 1;
		const startDate = formatWeekStartDate(weekNum);
		return {
			value: weekNum,
			label: `Неделя ${weekNum} - ${startDate}`
		};
	});

	$: weekItems = weeks.map((week) => ({
		id: `week-${week.value}`,
		displayValue: week.label
	}));

	$: teacherItems = teachers.map((teacher) => ({
		id: teacher.name,
		displayValue: teacher.name
	}));

	let selectedWeekString = '';
	let isInitialized = false;
	let previousTeacher = '';
	let previousWeekString = '';

	$: {
		if (isInitialized) {
			if (selectedTeacher !== previousTeacher) {
				previousTeacher = selectedTeacher;

				if (selectedTeacher) {
					selectedWeekString = `week-${selectedWeek}`;
					previousWeekString = selectedWeekString;
					handleSubmit();
				} else {
					selectedWeekString = '';
					previousWeekString = '';
				}
			}

			if (selectedWeekString !== previousWeekString) {
				previousWeekString = selectedWeekString;

				if (selectedWeekString) {
					const weekMatch = selectedWeekString.match(/week-(\d+)/);
					if (weekMatch) {
						const newWeek = parseInt(weekMatch[1], 10);
						if (!isNaN(newWeek) && newWeek !== selectedWeek) {
							selectedWeek = newWeek;
							localStorage.setItem('lastWeek', selectedWeek.toString());

							const url = new URL(window.location.href);
							url.searchParams.set('week', selectedWeek.toString());
							window.history.replaceState({}, '', url.toString());
						}
					}
				} else {
					selectedWeek = 1;
					localStorage.removeItem('lastWeek');

					const url = new URL(window.location.href);
					url.searchParams.delete('week');
					window.history.replaceState({}, '', url.toString());
				}
			}
		}

		if (teachers.length > 0 && !isInitialized) {
			isInitialized = true;
			previousTeacher = selectedTeacher;
			if (!selectedWeekString && selectedWeek) {
				selectedWeekString = `week-${selectedWeek}`;
			}
			previousWeekString = selectedWeekString;
		}
	}
</script>

<div class="grid grid-cols-1 gap-4">
	<div>
		<label for="teacher-select" class="mb-2 block text-white">Преподаватель:</label>
		<SimpleCombobox
			id="teacher-select"
			items={teacherItems}
			bind:selectedId={selectedTeacher}
			placeholder={isLoading ? 'Загрузка преподавателей...' : 'Выберите преподавателя'}
			error={teacherError}
			{isLoading}
		/>
	</div>

	<div>
		<label for="week-select" class="mb-2 block text-white">Неделя:</label>
		<SimpleCombobox
			id="week-select"
			items={weekItems}
			bind:selectedId={selectedWeekString}
			placeholder="Выберите неделю"
			error={weekError}
			isLoading={false}
			clearAfterSelect={true}
		/>
	</div>

	<button
		type="button"
		on:click={handleSubmit}
		class="rounded-lg bg-blue-700 p-2 text-white transition-all hover:bg-blue-600"
		disabled={isLoading}
	>
		{isLoading ? 'Загрузка...' : submitButtonText}
	</button>

	<CopyLinkButton
		disabled={!selectedTeacher || !selectedWeek}
		params={{ teacher: selectedTeacher }}
		successMessage="Ссылка на расписание преподавателя скопирована"
	>
		{copyButtonText}
	</CopyLinkButton>
</div>
