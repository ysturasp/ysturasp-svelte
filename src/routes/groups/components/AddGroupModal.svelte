<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { groups } from '../stores';
	import { addGroup } from '../api';
	import { institutes } from '../institutes';

	const dispatch = createEventDispatcher();
	let loading = false;
	let selectedInstitute = '';
	let name = '';
	let link = '';
	let telegram = '';
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

	async function generateToken() {
		const array = new Uint8Array(32);
		crypto.getRandomValues(array);
		const hash = Array.from(array)
			.map((b) => b.toString(16).padStart(2, '0'))
			.join('');
		const timestamp = Date.now();
		return btoa(`${hash}_${timestamp}`).replace(/=/g, '');
	}

	async function handleSubmit() {
		if (!selectedInstitute || !name || !link) return;
		loading = true;

		try {
			const token = await generateToken();
			const groupData = {
				institute: selectedInstitute,
				name,
				link,
				telegram: telegram || '',
				token
			};

			const result = await addGroup(groupData);

			if (result.success) {
				const groupTokens = JSON.parse(localStorage.getItem('groupTokens') || '{}');
				groupTokens[result.id] = token;
				localStorage.setItem('groupTokens', JSON.stringify(groupTokens));

				groups.update((gs) => [
					...gs,
					{
						...groupData,
						id: result.id,
						verified: false,
						date: new Date().toISOString()
					}
				]);

				showTokenDialog(token);
				dispatch('close');
			}
		} catch (error) {
			console.error('Error adding group:', error);
		} finally {
			loading = false;
		}
	}

	function showTokenDialog(token: string) {
		const dialog = document.createElement('div');
		dialog.className = 'fixed inset-0 z-50 flex items-center justify-center';
		dialog.innerHTML = `
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="bg-gray-900 p-6 rounded-lg max-w-lg w-full mx-4 relative z-50 ring-1">
      <h3 class="text-xl font-bold text-white mb-4">⚠️ Важное сообщение</h3>
      <p class="text-slate-300 mb-4">
        Это ваш уникальный токен для управления группой. Сохраните его - он будет показан только один раз!
      </p>
      <div class="bg-gray-800 p-3 rounded-lg mb-4 break-all">
        <p class="text-blue-400 font-mono text-sm">${token}</p>
      </div>
      <div class="flex gap-2 mb-4">
        <button onclick="navigator.clipboard.writeText('${token}').then(() => this.textContent = 'Скопировано!')"
          class="flex-1 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
          Копировать токен
        </button>
      </div>
      <p class="text-slate-400 text-sm">
        С помощью этого токена вы сможете удалить свою группу в будущем.
      </p>
      <button onclick="this.parentElement.parentElement.remove()"
        class="absolute top-2 right-2 text-slate-400 hover:text-white p-2">
        ✕
      </button>
    </div>
  `;
		document.body.appendChild(dialog);
	}
</script>

<BottomModal {isOpen} title="Добавление нового чата" onClose={handleClose}>
	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label for="institute" class="mb-2 block text-sm font-medium text-gray-400"
				>Институт</label
			>
			<select
				id="institute"
				bind:value={selectedInstitute}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
			>
				<option value="">Выберите институт</option>
				{#each institutes as institute}
					<option value={institute.value}>{institute.label}</option>
				{/each}
			</select>
		</div>

		<div>
			<label for="group-name" class="mb-2 block text-sm font-medium text-gray-400"
				>Название группы</label
			>
			<input
				id="group-name"
				type="text"
				bind:value={name}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="Например: ЭИС-11, Общая группа, Общежитие 1"
			/>
		</div>

		<div>
			<label for="chat-link" class="mb-2 block text-sm font-medium text-gray-400"
				>Ссылка на чат</label
			>
			<input
				id="chat-link"
				type="url"
				bind:value={link}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="https://vk.me/join/..."
			/>
		</div>

		<div>
			<label for="telegram" class="mb-2 block text-sm font-medium text-gray-400"
				>Твой телеграм (его никто не увидит)</label
			>
			<input
				id="telegram"
				type="text"
				bind:value={telegram}
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="@username"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="relative w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
			<div class="button-content">
				{#if loading}
					<div class="loading-spinner"></div>
				{/if}
				<span class="whitespace-nowrap">Добавить группу</span>
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
