<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let title: string;
	export let isOpen: boolean = false;
	export let maxWidth: string = 'max-w-2xl';

	const dispatch = createEventDispatcher();

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			dispatch('close');
		}
	}

	function handleEscapeKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			dispatch('close');
		}
	}
</script>

<svelte:window on:keydown={handleEscapeKey} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-800/50 p-4"
		on:click={handleBackdropClick}
	>
		<div
			class="mr-3 ml-3 rounded-2xl bg-slate-900 p-5 text-center {maxWidth} relative mx-auto w-full"
		>
			<h2 class="mb-4 text-xl font-semibold text-white">{title}</h2>
			<slot />
			<button
				on:click={() => dispatch('close')}
				class="absolute top-2 right-2 p-2 text-slate-400 hover:text-white"
			>
				✕
			</button>
		</div>
	</div>
{/if}
