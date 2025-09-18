<script lang="ts">
	import { isOnline } from '$lib/stores/offline';
	import { slide } from 'svelte/transition';

	export let isCache = false;
	export let cacheTime: string | null = null;
</script>

{#if !$isOnline || isCache}
	<div
		class="mb-4 rounded-lg border {!$isOnline
			? 'border-orange-500/30 bg-orange-900/30'
			: 'border-blue-500/30 bg-blue-900/30'} p-3"
		transition:slide={{ duration: 300 }}
	>
		<div class="flex items-center gap-3">
			{#if !$isOnline}
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/20">
					<svg
						class="h-4 w-4 text-orange-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<div>
					<p class="font-medium text-orange-200">Режим офлайн</p>
					<p class="text-sm text-orange-300">
						Отображаются сохраненные данные
						{#if cacheTime}
							от {cacheTime}
						{/if}
					</p>
				</div>
			{:else if isCache}
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20">
					<svg
						class="h-4 w-4 text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4-1.79 4-4M4 7l8 5 8-5"
						/>
					</svg>
				</div>
				<div>
					<p class="font-medium text-blue-200">Кэшированные данные</p>
					<p class="text-sm text-blue-300">
						Последнее обновление
						{#if cacheTime}
							{cacheTime}
						{:else}
							неизвестно
						{/if}
					</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
