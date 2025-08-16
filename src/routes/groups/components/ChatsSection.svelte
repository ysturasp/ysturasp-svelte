<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { authToken, type Group, groups } from '../stores';
	import AuthInfo from './AuthInfo.svelte';
	import GroupCard from './GroupCard.svelte';
	import { getGroups } from '../api';

	const dispatch = createEventDispatcher();
	let selectedInstitute = 'all';
	const institutes = [
		{ id: 'all', name: 'все чаты' },
		{ id: 'ЗФО', name: 'Заочка' },
		{ id: 'ИАД', name: 'Институт Архитектуры и Дизайна' },
		{ id: 'ИИСТ', name: 'Институт Инженеров Строительства и Транспорта' },
		{ id: 'ИХХТ', name: 'Институт Химии и Химической Технологии' },
		{ id: 'ИЭМ', name: 'Институт Экономики и Менеджмента' },
		{ id: 'ИЦС', name: 'Институт Цифровых Систем' },
		{ id: 'ИИМ', name: 'Институт Инженерии и Машиностроения' },
		{ id: 'ОБЩ', name: 'Общежития' }
	];

	let currentToken: string | null = null;
	let unsubscribe: () => void;
	let hasInitialLoad = false;
	let initialLoadTimer: number | null = null;

	onMount(() => {
		currentToken = $authToken ?? null;

		unsubscribe = authToken.subscribe((value) => {
			const nextToken = value ?? null;

			if (!hasInitialLoad) {
				if (nextToken) {
					currentToken = nextToken;
					hasInitialLoad = true;
					if (initialLoadTimer) clearTimeout(initialLoadTimer);
					loadGroups();
				}
				return;
			}

			if (nextToken !== currentToken) {
				currentToken = nextToken;
				loadGroups();
			}
		});

		initialLoadTimer = window.setTimeout(() => {
			if (!hasInitialLoad) {
				hasInitialLoad = true;
				loadGroups();
			}
		}, 50);

		return () => {
			if (unsubscribe) unsubscribe();
			if (initialLoadTimer) clearTimeout(initialLoadTimer);
		};
	});

	async function loadGroups() {
		try {
			const data = await getGroups(currentToken);
			groups.set(data);
		} catch (error) {
			console.error('Error loading groups:', error);
		}
	}

	$: filteredGroups =
		selectedInstitute === 'all'
			? $groups
			: $groups.filter((g) => g.institute === selectedInstitute);
</script>

<section id="chats" class="relative px-4 py-20 md:py-32">
	<div class="chat-finder mx-auto mb-6 max-w-6xl rounded-2xl p-4 md:mb-12 md:p-8">
		<h2 class="mb-1 text-center text-3xl font-bold text-white md:mb-2 md:text-4xl">
			Найди свой чат
			<span class="inline-block">🔍</span>
		</h2>

		<p class="mb-2 text-center text-slate-300 md:mb-4">
			ищи своих однокурсников или сам добавляй ссылку на чат
		</p>

		<div class="mb-4 flex flex-wrap justify-center gap-4 md:mb-2">
			{#each institutes as institute}
				<button
					class="institute-button rounded-xl px-3 py-2 md:px-6 md:py-3 {selectedInstitute ===
					institute.id
						? 'active'
						: ''}"
					on:click={() => (selectedInstitute = institute.id)}
				>
					{institute.name}
				</button>
			{/each}
		</div>

		<AuthInfo />

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#if filteredGroups.length === 0}
				<div class="col-span-full py-12 text-center">
					<p class="text-lg text-gray-400">Чаты не найдены 😔</p>
				</div>
			{:else}
				{#each filteredGroups as group (group.id)}
					<GroupCard
						{group}
						on:showAuth={() => dispatch('showAuth')}
						on:delete={loadGroups}
					/>
				{/each}
			{/if}
		</div>

		<div class="mt-4 text-center md:mt-8">
			<div class="flex justify-center gap-4">
				<button
					on:click={() => dispatch('addGroup')}
					class="flex transform items-center rounded-xl bg-blue-600 px-4 py-2 text-lg font-medium text-white transition-all hover:scale-105 hover:bg-blue-700"
				>
					<svg
						class="mr-2 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M12 4V20M4 12H20"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
						/>
					</svg>
					добавить
				</button>
				<button
					on:click={() => dispatch('deleteGroup')}
					class="flex transform items-center rounded-xl bg-red-600 px-4 py-2 text-lg font-medium text-white transition-all hover:scale-105 hover:bg-red-700"
				>
					<svg
						class="mr-2 h-5 w-5"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M4 7H20M10 11V17M14 11V17M5 7L6 19C6 19.5304 6.21071 20.0391 6.58579 20.4142C6.96086 20.7893 7.46957 21 8 21H16C16.5304 21 17.0391 20.7893 17.4142 20.4142C17.7893 20.0391 18 19.5304 18 19L19 7M9 7V4C9 3.73478 9.10536 3.48043 9.29289 3.29289C9.48043 3.10536 9.73478 3 10 3H14C14.2652 3 14.5196 3.10536 14.7071 3.29289C14.8946 3.48043 15 3.73478 15 4V7"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					удалить
				</button>
			</div>
		</div>
	</div>
</section>

<style>
	.chat-finder {
		position: relative;
		background: linear-gradient(165deg, #1e293b 0%, #0f172a 100%);
		border: 1px solid rgba(59, 130, 246, 0.1);
	}

	h2 {
		font-family: 'Unbounded', cursive;
		font-weight: 500;
		letter-spacing: -0.02em;
	}

	.institute-button {
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
		background: rgba(30, 41, 59, 0.7);
		border: 1px solid rgba(59, 130, 246, 0.1);
		transform: rotate(-1deg);
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		font-size: 0.9em;
	}

	.institute-button:nth-child(even) {
		transform: rotate(1deg);
	}

	.institute-button:hover {
		transform: rotate(0) scale(1.05);
		border-color: rgba(59, 130, 246, 0.3);
	}

	.institute-button.active {
		background: linear-gradient(45deg, #3b82f6, #1d4ed8);
		transform: rotate(0) scale(1.05);
	}

	button {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}
</style>
