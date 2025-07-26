<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isOpen = false;
	export let title: string;
	export let onClose: () => void;

	let modalContent: HTMLElement;

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && modalContent && !modalContent.contains(event.target as Node)) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			onClose();
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

<div
	class="fixed inset-0 z-50 bg-black/50 transition-opacity duration-300"
	class:opacity-0={!isOpen}
	class:opacity-100={isOpen}
	class:pointer-events-none={!isOpen}
>
	<div
		class="fixed inset-x-0 bottom-0 transform px-4 transition-transform duration-300 ease-in-out md:px-0"
		class:translate-y-full={!isOpen}
		class:translate-y-0={isOpen}
	>
		<div
			bind:this={modalContent}
			class="mx-auto flex w-full max-w-lg flex-col rounded-t-2xl bg-slate-900 shadow-xl ring-1 ring-blue-500/50"
			style="max-height: calc(100vh - 5rem);"
		>
			<div class="flex items-center justify-between p-4">
				<h3 class="text-xl font-bold text-white">{title}</h3>
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
						></path>
					</svg>
				</button>
			</div>
			<div class="flex-1 overflow-y-auto px-4">
				<div class="text-gray-300">
					<slot />
				</div>
			</div>
			<div class="p-4">
				<slot name="footer" />
			</div>
		</div>
	</div>
</div>
