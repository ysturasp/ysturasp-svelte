<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import type { Group } from '../stores';
	import { deleteGroup } from '../api';
	import { getFullInstituteName } from '../institutes';

	export let group: Group;
	const dispatch = createEventDispatcher();

	async function handleDeleteGroup() {
		if (!confirm('Вы уверены, что хотите удалить эту группу?')) return;

		try {
			const groupTokens = JSON.parse(localStorage.getItem('groupTokens') || '{}');
			const token = groupTokens[group.id];

			const result = await deleteGroup(token);

			if (result.success) {
				delete groupTokens[group.id];
				localStorage.setItem('groupTokens', JSON.stringify(groupTokens));
				dispatch('delete');
			}
		} catch (error) {
			console.error('Error deleting group:', error);
		}
	}

	$: hasToken = JSON.parse(localStorage.getItem('groupTokens') || '{}')[group.id];
</script>

<div class="group-card fade-in rounded-xl p-6" data-institute={group.institute} data-id={group.id}>
	<div class="mb-6 flex items-start justify-between">
		<div>
			<h3 class="mb-1 text-xl font-semibold text-white">{group.name}</h3>
			<p class="text-slate-400">{getFullInstituteName(group.institute)}</p>
		</div>
		{#if group.verified}
			<span
				class="verified-badge flex items-center rounded-full px-3 py-1 text-xs text-white"
			>
				<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					></path>
				</svg>
				Проверено
			</span>
		{/if}
	</div>
	<div class="flex flex-col gap-2">
		{#if group.link}
			<a
				href={group.link}
				target="_blank"
				class="button-primary block rounded-xl py-3 text-center text-white"
			>
				<div class="flex items-center justify-center gap-2">
					<img
						src="https://thumb.cloud.mail.ru/weblink/thumb/xw1/TfKk/QGyS93cW7/PNG%20-%20digital/VK%20Logo.png"
						alt="VK"
						class="h-6 w-6 rounded-md ring-1 ring-white"
					/>
					присоединиться
				</div>
			</a>
		{:else}
			<button
				on:click={() => dispatch('showAuth')}
				class="button-primary block rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 text-center text-white"
			>
				<div class="flex items-center justify-center gap-2">
					<span class="text-xl">🔒</span>
					получить доступ
				</div>
			</button>
		{/if}

		{#if hasToken}
			<button
				on:click={handleDeleteGroup}
				class="block rounded-xl bg-red-600 py-3 text-center text-white transition-colors hover:bg-red-700"
			>
				Удалить чат
			</button>
		{/if}
	</div>
</div>

<style>
	.group-card {
		background: linear-gradient(165deg, #1e293b 0%, #0f172a 100%);
		border: 1px solid rgba(59, 130, 246, 0.1);
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.group-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
	}

	.group-card:hover {
		transform: translateY(-2px);
		border-color: rgba(59, 130, 246, 0.3);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.verified-badge {
		background: linear-gradient(45deg, #22c55e, #16a34a);
		box-shadow: 0 2px 8px rgba(34, 197, 94, 0.2);
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		font-size: 0.8em;
	}

	.button-primary {
		background: linear-gradient(45deg, #3b82f6, #1d4ed8);
		box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
		transition: all 0.3s ease;
	}

	.button-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
	}

	h3 {
		font-family: 'Exo 2', sans-serif;
		letter-spacing: -0.01em;
		font-weight: 600;
	}

	button {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
