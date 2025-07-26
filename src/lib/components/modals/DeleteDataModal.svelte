<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';
	import type { CacheItem } from '$lib/utils/cache';

	export let isOpen = false;
	export let items: CacheItem[] = [];

	const dispatch = createEventDispatcher();

	function selectAll() {
		const allChecked = items.every((item) => item.checked);
		items = items.map((item) => ({ ...item, checked: !allChecked }));
	}

	function handleDelete() {
		dispatch('delete', items);
	}

	function handleClose() {
		dispatch('close');
	}
</script>

<Modal title="Удаление данных" {isOpen} on:close={handleClose}>
	<p class="mb-4 text-slate-400">Выберите данные для удаления:</p>

	<div class="mb-4 max-h-60 overflow-y-auto rounded-2xl bg-gray-800 p-4">
		{#each items as item}
			<div class="mb-2 flex items-center justify-start gap-2">
				<input
					type="checkbox"
					id={item.key}
					bind:checked={item.checked}
					class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
				/>
				<label for={item.key} class="text-left text-slate-400">{item.displayText}</label>
			</div>
		{/each}
	</div>

	<div class="flex justify-center gap-4">
		<button
			on:click={selectAll}
			class="rounded-2xl bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700"
		>
			Выбрать всё
		</button>
		<button
			on:click={handleDelete}
			class="rounded-2xl bg-red-600 px-4 py-2 text-white transition-all hover:bg-red-700"
		>
			Удалить
		</button>
		<button
			on:click={handleClose}
			class="rounded-2xl bg-gray-600 px-4 py-2 text-white transition-all hover:bg-gray-700"
		>
			Отмена
		</button>
	</div>
</Modal>
