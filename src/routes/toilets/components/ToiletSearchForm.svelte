<script lang="ts">
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import type { Gender } from '../types';

	export let audience = '';
	export let gender: Gender = 'male';
	export let isLoading = false;

	const genderItems = [
		{ id: 'male', label: 'Мужской' },
		{ id: 'female', label: 'Женский' }
	];
</script>

<div class="grid grid-cols-1 gap-2">
	<div>
		<label for="audience-input" class="mb-1 block text-white">Аудитория:</label>
		<input
			id="audience-input"
			type="text"
			bind:value={audience}
			placeholder="Например: Г-205 или 205"
			class="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
			disabled={isLoading}
		/>
	</div>

	<div>
		<label for="gender-select" class="mb-1 block text-white">Пол:</label>
		<CustomSelect
			items={genderItems}
			bind:selectedId={gender}
			placeholder="Выберите пол"
			isLoading={false}
			error={false}
			searchPlaceholder="Поиск..."
			width="100%"
		/>
	</div>
</div>
