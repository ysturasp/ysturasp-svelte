<script lang="ts">
	import type { Teacher } from '../api';
	import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';
	import { replaceState } from '$app/navigation';

	export let teachers: Teacher[] = [];
	export let selectedTeacher = '';
	export let onSubmit: () => void;
	export let isLoading = false;
	let error = false;

	function handleSubmit() {
		if (!selectedTeacher) {
			error = true;
			return;
		}
		error = false;

		const params = new URLSearchParams(window.location.search);
		if (selectedTeacher) {
			params.set('teacher', selectedTeacher);
		} else {
			params.delete('teacher');
		}
		replaceState(`${window.location.pathname}?${params}`, {});

		onSubmit();
	}

	$: items = teachers.map((teacher) => ({
		id: teacher.name,
		displayValue: teacher.name
	}));
</script>

<ScheduleCombobox
	{items}
	bind:selectedId={selectedTeacher}
	onSubmit={handleSubmit}
	placeholder={isLoading ? 'Загрузка преподавателей...' : 'Выберите преподавателя'}
	paramName="teacher"
	copyLinkMessage="Ссылка на расписание преподавателя скопирована"
	submitButtonText="Показать расписание преподавателя"
	copyButtonText="Скопировать ссылку на расписание преподавателя"
	{error}
	{isLoading}
/>
