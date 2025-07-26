<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { FilterOptions } from '$lib/types';

	export let groups: string[] = [];

	let searchText = '';
	let selectedGroup = '';
	let selectedType = '';
	let verifiedOnly = false;

	const dispatch = createEventDispatcher();

	function handleFilterChange() {
		const filters: FilterOptions = {
			searchText,
			selectedGroup,
			selectedType,
			verifiedOnly
		};
		dispatch('filter', filters);
	}

	$: {
		searchText;
		selectedGroup;
		selectedType;
		verifiedOnly;
		handleFilterChange();
	}
</script>

<div class="mb-4 rounded-2xl bg-slate-900">
	<h4 class="mb-3 font-semibold text-white">Фильтры</h4>
	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div>
			<input
				type="text"
				bind:value={searchText}
				placeholder="Поиск по названию"
				class="w-full rounded-2xl bg-slate-800 p-2 text-white focus:border-blue-500 focus:outline-none"
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
			/>
		</div>

		<div>
			<select
				bind:value={selectedGroup}
				class="w-full rounded-2xl bg-slate-800 p-2 text-white focus:border-blue-500 focus:outline-none"
			>
				<option value="">Все группы</option>
				{#each groups as group}
					<option value={group}>{group}</option>
				{/each}
			</select>
		</div>

		<div>
			<select
				bind:value={selectedType}
				class="w-full rounded-2xl bg-slate-800 p-2 text-white focus:border-blue-500 focus:outline-none"
			>
				<option value="">Все типы</option>
				<option value="hidden">Скрытые предметы</option>
				<option value="subgroups">Настройки подгрупп</option>
				<option value="both">Оба типа</option>
			</select>
		</div>

		<div class="flex items-center">
			<label class="inline-flex cursor-pointer items-center">
				<input type="checkbox" bind:checked={verifiedOnly} class="peer hidden" />
				<div
					class="mr-2 flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-500 transition-colors peer-checked:border-blue-500"
				>
					<svg
						class="h-3 w-3 text-blue-500 {verifiedOnly ? '' : 'hidden'}"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<span class="text-slate-400">Только проверенные</span>
			</label>
		</div>
	</div>
</div>
