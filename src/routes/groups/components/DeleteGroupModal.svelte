<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { groups } from '../stores';
	import { deleteGroup } from '../api';

	const dispatch = createEventDispatcher();
	let loading = false;
	let token = '';
	let isOpen = false;

	onMount(() => {
		setTimeout(() => {
			isOpen = true;
		}, 0);
	});

	function handleClose() {
		isOpen = false;
		setTimeout(() => {
			dispatch('close');
		}, 300);
	}

	async function handleSubmit() {
		if (!token) return;
		loading = true;

		try {
			const result = await deleteGroup(token.trim());

			if (result.success) {
				const groupTokens = JSON.parse(localStorage.getItem('groupTokens') || '{}');
				const groupId = Object.keys(groupTokens).find(
					(id) => groupTokens[id] === token.trim()
				);

				if (groupId) {
					delete groupTokens[groupId];
					localStorage.setItem('groupTokens', JSON.stringify(groupTokens));
					groups.update((gs) => gs.filter((g) => g.id !== groupId));
				}

				dispatch('close');
			}
		} catch (error) {
			console.error('Error deleting group:', error);
		} finally {
			loading = false;
		}
	}
</script>

<BottomModal {isOpen} title="Удаление чата" onClose={handleClose}>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-400">Введите токен чата</label>
			<input
				type="text"
				bind:value={token}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="Введите токен, полученный при создании чата"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="relative w-full rounded-lg bg-red-600 px-4 py-3 text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
			<div class="button-content">
				{#if loading}
					<div class="loading-spinner" />
				{/if}
				<span>Удалить чат</span>
			</div>
		</button>
	</form>
</BottomModal>

<style>
	.loading-spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s linear infinite;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	h3 {
		font-family: 'Unbounded', cursive;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	label {
		font-family: 'Exo 2', sans-serif;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.input-field {
		font-family: 'Exo 2', sans-serif;
		font-weight: 400;
	}

	button {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
