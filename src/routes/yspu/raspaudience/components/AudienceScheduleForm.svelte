<script lang="ts">
	import type { Audience } from '../api';
	import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';

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
	{error}
	{isLoading}
/>
