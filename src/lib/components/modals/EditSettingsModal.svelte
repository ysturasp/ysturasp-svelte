<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';

	export let isOpen = false;
	let token = '';

	const dispatch = createEventDispatcher();

	function handleEdit() {
		if (!token.trim()) {
			dispatch('error', 'Пожалуйста, введите токен');
			return;
		}
		dispatch('edit', token);
	}

	function handleDelete() {
		if (!token.trim()) {
			dispatch('error', 'Пожалуйста, введите токен');
			return;
		}
		dispatch('delete', token);
	}

	function handleClose() {
		token = '';
		dispatch('close');
	}
</script>

<Modal title="Введите токен" {isOpen} on:close={handleClose}>
	<input
		type="text"
		bind:value={token}
		class="mb-4 w-full rounded-2xl bg-slate-800 p-2 text-white focus:outline-none"
		placeholder="Токен"
		autocomplete="off"
		autocorrect="off"
		autocapitalize="off"
	/>
	<div class="flex justify-center gap-4">
		<button
			on:click={handleEdit}
			class="rounded-2xl bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700"
		>
			Редактировать
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
