<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Setting } from '$lib/types';

	export let setting: Setting;

	const dispatch = createEventDispatcher();

	function extractGroupFromName(name: string): string {
		const match = name.match(/\((.*?)\)$/);
		return match ? match[1] : '';
	}

	$: group = extractGroupFromName(setting.name);
	$: nameWithoutGroup = setting.name.replace(/ \(.*?\)$/, '');
</script>

<div class="rounded-2xl bg-slate-800 p-4">
	<h4 class="mb-1 font-semibold text-white">
		{nameWithoutGroup}
		<span class="inline-flex items-center align-text-bottom">
			<span class="group relative mr-1">
				{#if setting.verified}
					<svg class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
					<div
						class="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 transform rounded-md bg-blue-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
					>
						Проверено администратором
					</div>
				{/if}
			</span>
		</span>
	</h4>

	{#if group}
		<p class="text-sm text-slate-400">Группа: {group}</p>
	{/if}

	<p class="mb-1 text-sm text-slate-400">
		Опубликовано: {new Date(setting.date).toLocaleString('ru-RU', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		})}
	</p>

	<div class="mb-3 flex flex-wrap gap-2">
		{#if setting.hasHiddenSubjects}
			<span class="rounded bg-blue-900 px-2 py-1 text-xs text-blue-300">Скрытые предметы</span
			>
		{/if}
		{#if setting.hasSubgroupSettings}
			<span class="rounded bg-emerald-900 px-2 py-1 text-xs text-green-300"
				>Настройки подгрупп</span
			>
		{/if}
	</div>

	<button
		on:click={() => dispatch('apply', setting.id)}
		class="w-full rounded-2xl bg-emerald-600 p-2 text-white transition-all hover:bg-emerald-700"
	>
		Применить настройки
	</button>
</div>
