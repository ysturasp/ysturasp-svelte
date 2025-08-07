<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { LINEAR_PRIORITIES } from '../stores/linear';
	import Portal from '$lib/components/ui/Portal.svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let onSelect: (priority: number) => void;
	export let currentPriority = 0;

	let container: HTMLElement;

	function handleClickOutside(event: MouseEvent) {
		if (container && !container.contains(event.target as Node)) {
			event.stopPropagation();
			onClose();
		}
	}

	function handleSelect(priority: number) {
		onSelect(priority);
		onClose();
	}

	function handleContainerClick(event: MouseEvent) {
		event.stopPropagation();
	}

	function getPriorityColor(priorityId: number): string {
		switch (priorityId) {
			case 0:
				return 'text-gray-400';
			case 1:
				return 'text-red-500';
			case 2:
				return 'text-orange-500';
			case 3:
				return 'text-yellow-500';
			case 4:
				return 'text-gray-400';
			default:
				return 'text-gray-400';
		}
	}
</script>

{#if isOpen}
	<Portal>
		<div
			class="fixed inset-0 z-120 flex items-center justify-center bg-black/50 px-4"
			transition:fade={{ duration: 200 }}
			on:click={handleClickOutside}
		>
			<div
				bind:this={container}
				class="w-full max-w-sm rounded-2xl bg-slate-900 p-4 shadow-xl ring-1 ring-blue-500/50"
				transition:scale={{ duration: 200, easing: quintOut }}
				on:click={handleContainerClick}
			>
				<div class="mb-4 flex items-center justify-between">
					<h3 class="text-lg font-semibold text-white">Выберите приоритет</h3>
					<button
						on:click={onClose}
						class="text-gray-400 hover:text-white"
						aria-label="Закрыть"
					>
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div class="space-y-2">
					{#each LINEAR_PRIORITIES as priority}
						<button
							class="flex w-full items-center gap-3 rounded-lg p-2 text-white transition-all hover:bg-slate-800 {priority.id ===
							currentPriority
								? 'bg-slate-800'
								: ''}"
							on:click={() => handleSelect(priority.id)}
						>
							<div
								class="flex h-5 w-5 items-center justify-center {getPriorityColor(
									priority.id
								)}"
							>
								{@html priority.icon}
							</div>
							<span>{priority.name}</span>
						</button>
					{/each}
				</div>
			</div>
		</div>
	</Portal>
{/if}
