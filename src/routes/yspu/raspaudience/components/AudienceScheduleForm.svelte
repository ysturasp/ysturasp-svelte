<script lang="ts">
	import type { Audience } from '../api';
	import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';
	import { replaceState } from '$app/navigation';

	export let audiences: Audience[] = [];
	export let selectedAudience = '';
	export let onSubmit: () => void;
	export let isLoading = false;
	let error = false;

	function handleSubmit() {
		if (!selectedAudience) {
			error = true;
			return;
		}
		error = false;

		const params = new URLSearchParams(window.location.search);
		if (selectedAudience) {
			params.set('audience', selectedAudience);
		} else {
			params.delete('audience');
		}
		replaceState(`${window.location.pathname}?${params}`, {});

		onSubmit();
	}

	$: items = audiences.map((audience) => ({
		id: audience.id,
		displayValue: audience.number
	}));
</script>

<ScheduleCombobox
	{items}
	bind:selectedId={selectedAudience}
	onSubmit={handleSubmit}
	placeholder={isLoading ? 'Загрузка аудиторий...' : 'Выберите аудиторию'}
	paramName="audience"
	copyLinkMessage="Ссылка на расписание аудитории скопирована"
	submitButtonText="Показать расписание аудитории"
	copyButtonText="Скопировать ссылку на расписание аудитории"
	{error}
	{isLoading}
/>
