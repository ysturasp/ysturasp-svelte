<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let isOpen = false;
	export let title: string;
	export let subtitle: string | undefined = undefined;
	export let subtitleClass = 'text-gray-400';
	export let onClose: () => void;
	export let checkCanClose: (() => boolean) | undefined = undefined;

	let modalContent: HTMLElement;
	let originalBodyPosition: string;
	let originalBodyTop: string;
	let originalBodyWidth: string;
	let scrollPosition = 0;

	function handleClickOutside(event: MouseEvent) {
		if (isOpen && modalContent && !modalContent.contains(event.target as Node)) {
			const target = event.target as Element;
			if (target.closest('#notifications-container') || target.closest('.notification')) {
				return;
			}

			if (checkCanClose && !checkCanClose()) {
				return;
			}
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			if (checkCanClose && !checkCanClose()) {
				return;
			}
			onClose();
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('keydown', handleKeydown);
		}
	});

	$: if (browser) {
		if (isOpen) {
			scrollPosition = window.scrollY;
			originalBodyPosition = document.body.style.position;
			originalBodyTop = document.body.style.top;
			originalBodyWidth = document.body.style.width;

			const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.width = '100%';
			document.body.style.position = 'fixed';
			document.body.style.top = `-${scrollPosition}px`;
		} else {
			document.body.style.position = '';
			document.body.style.top = '';
			document.body.style.width = '';
			if (scrollPosition) window.scrollTo(0, scrollPosition);
		}
	}

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleKeydown);
			if (isOpen) {
				document.body.style.position = '';
				document.body.style.top = '';
				document.body.style.width = '';
				if (scrollPosition) window.scrollTo(0, scrollPosition);
			}
		}
	});
</script>

<div
	class="modal-portal fixed inset-0 z-100 bg-black/50 transition-opacity duration-300"
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
			<div class="flex flex-col p-4 pb-2">
				<div class="flex items-center justify-between">
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
				{#if subtitle}
					<div class="text-sm {subtitleClass}">{subtitle}</div>
				{/if}
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
