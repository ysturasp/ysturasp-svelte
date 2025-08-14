<script lang="ts">
	import type { Direction, Course } from '$lib/types/schedule';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

	export let directions: Direction[];
	export let selectedDirection = '';
	export let selectedGroup = '';
	export let onSubmit: () => void;
	export let onDirectionChange: () => void;
	export let scheduleShown = false;
	export let isLoading = false;

	export let selectedDirectionLabel = '';
	export let selectedGroupLabel = '';

	let showErrors = false;
	let showGroupError = false;
	let highlightDirection = false;

	$: directionItems =
		directions?.map((direction) => ({
			id: direction.id,
			label: direction.name
		})) || [];

	$: groupItems =
		selectedDirection && directions
			? Object.entries(directions.find((d) => d.id === selectedDirection)?.courses || {}).map(
					([key, course]) => ({
						id: key,
						label: (course as Course).name
					})
				)
			: [];

	function handleDirectionSelect(event: CustomEvent) {
		selectedDirection = event.detail.id;
		selectedDirectionLabel = event.detail.label;
		selectedGroup = '';
		selectedGroupLabel = '';
		onDirectionChange();
		showErrors = false;
		showGroupError = false;
		highlightDirection = false;
	}

	function handleGroupSelect(event: CustomEvent) {
		selectedGroup = event.detail.id;
		selectedGroupLabel = event.detail.label;
		showErrors = false;
		showGroupError = false;
		highlightDirection = false;
	}

	function handleGroupClick() {
		if (!selectedDirection && !isLoading) {
			showGroupError = true;
			highlightDirection = true;
			setTimeout(() => {
				showGroupError = false;
				highlightDirection = false;
			}, 1000);
		}
	}

	function handleSubmit() {
		if (!selectedDirection || !selectedGroup) {
			showErrors = true;
			return;
		}
		onSubmit();
	}
</script>

<form class="grid grid-cols-1 gap-1" on:submit|preventDefault={handleSubmit}>
	<div>
		<span class="mb-1 block text-white">Профиль:</span>
		<CustomSelect
			items={directionItems}
			bind:selectedId={selectedDirection}
			placeholder={isLoading ? 'Загрузка профилей...' : 'Выберите профиль'}
			on:select={handleDirectionSelect}
			width="100%"
			searchPlaceholder="Поиск профиля..."
			error={showErrors && !selectedDirection}
			highlight={highlightDirection}
			{isLoading}
			disabled={isLoading}
		/>
	</div>

	<div>
		<span class="mb-1 block text-white">Группа:</span>
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
				placeholder={isLoading
					? 'Загрузка групп...'
					: selectedDirection
						? 'Выберите группу'
						: 'Сначала выберите профиль'}
				on:select={handleGroupSelect}
				disabled={!selectedDirection || isLoading}
				width="100%"
				searchPlaceholder="Поиск группы..."
				error={showGroupError || (showErrors && !selectedGroup)}
				{isLoading}
			/>
		</div>
	</div>

	<button
		type="submit"
		class="my-1 rounded-xl bg-blue-700 p-2 text-white transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
		disabled={isLoading}
	>
		{isLoading ? 'Загрузка...' : 'Показать расписание группы'}
	</button>

	{#if scheduleShown && selectedDirection && selectedGroup}
		<div class="flex w-full items-center justify-between">
			<CopyLinkButton
				params={{
					direction: selectedDirection,
					group: selectedGroup
				}}
				successMessage="Ссылка на расписание группы скопирована"
			>
				Скопировать ссылку на расписание
			</CopyLinkButton>
		</div>
	{/if}
</form>
