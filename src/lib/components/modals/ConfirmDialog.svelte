<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let title: string = 'Подтверждение';
	export let message: string;
	export let confirmText: string = 'Подтвердить';
	export let cancelText: string = 'Отмена';

	const dispatch = createEventDispatcher();

	let modalContent: HTMLElement;
	let overlay: HTMLElement;
	let isClosing = false;
	let shouldRender = false;

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === overlay) {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			closeModal();
		}
	}

	function closeModal() {
		if (!isClosing && shouldRender) {
			isClosing = true;
		}
	}

	function handleAnimationEnd() {
		if (isClosing) {
			shouldRender = false;
			isClosing = false;
			dispatch('close');
		}
	}

	function handleConfirm() {
		dispatch('confirm');
		closeModal();
	}

	$: {
		if (isOpen && !shouldRender) {
			shouldRender = true;
			isClosing = false;
		} else if (!isOpen && shouldRender && !isClosing) {
			closeModal();
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', handleKeydown);
		}
	});

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', handleKeydown);
		}
	});
</script>

{#if shouldRender}
	<div
		bind:this={overlay}
		class="overlay {isClosing ? 'hide-overlay' : 'show-overlay'}"
		on:click={handleOverlayClick}
		role="presentation"
	></div>

	<div
		class="dialog {isClosing ? 'hide' : 'show'}"
		bind:this={modalContent}
		on:animationend={handleAnimationEnd}
	>
		<div class="dialog-header">
			<div class="dialog-title-section">
				<h3 class="dialog-title">{title}</h3>
			</div>
		</div>
		<div class="dialog-content">
			<p class="text-slate-300">{message}</p>
		</div>
		<div class="dialog-footer">
			<div class="flex gap-3">
				<button
					on:click={closeModal}
					class="flex-1 rounded-lg bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700"
				>
					{cancelText}
				</button>
				<button
					on:click={handleConfirm}
					class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100vw;
		height: 100vh;
		min-height: 100dvh;
		background: rgba(0, 0, 0, 0.5);
		box-sizing: border-box;
		z-index: 101;
		-webkit-transform: translateZ(0);
		transform: translateZ(0);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		padding-top: env(safe-area-inset-top);
		padding-bottom: env(safe-area-inset-bottom);
		margin-top: calc(-1 * env(safe-area-inset-top));
		margin-bottom: calc(-1 * env(safe-area-inset-bottom));
	}

	.dialog {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 95vw;
		height: auto;
		max-width: 600px;
		max-height: 85vh;
		background: rgb(15 23 42);
		border-radius: 16px;
		box-shadow:
			0 25px 50px -12px rgba(0, 0, 0, 0.5),
			0 0 0 1px rgba(59, 130, 246, 0.5);
		z-index: 102;
		display: flex;
		flex-direction: column;
		min-width: 320px;
	}

	.dialog-header {
		display: flex;
		flex-direction: column;
		padding: 16px;
		padding-bottom: 8px;
	}

	.dialog-title-section {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.dialog-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: white;
		margin: 0;
	}

	.dialog-content {
		padding: 16px;
		padding-top: 8px;
		overflow-y: auto;
	}

	.dialog-footer {
		padding: 16px;
	}

	.show-overlay {
		animation: fadeIn 0.5s linear forwards;
	}

	.hide-overlay {
		animation: fadeOut 0.25s linear forwards;
	}

	.show {
		animation: modalFadeInScale 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}

	.hide {
		animation: modalFadeOutScale 0.25s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes modalFadeInScale {
		0% {
			transform: translate(-50%, -20%) scale(0.8);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
	}

	@keyframes modalFadeOutScale {
		0% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
		100% {
			transform: translate(-50%, -20%) scale(0.8);
			opacity: 0;
		}
	}
</style>
