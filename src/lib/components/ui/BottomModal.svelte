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
	let overlay: HTMLElement;
	let isClosing = false;
	let shouldRender = false;

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === overlay) {
			if (checkCanClose && !checkCanClose()) {
				return;
			}
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			if (checkCanClose && !checkCanClose()) {
				return;
			}
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
			onClose();
		}
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
				<button on:click={closeModal} class="dialog-close-btn" aria-label="Закрыть">
					<svg class="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<div class="dialog-subtitle {subtitleClass}">{subtitle}</div>
			{/if}
		</div>
		<div class="dialog-content">
			<slot />
		</div>
		<div class="dialog-footer">
			<slot name="footer" />
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

	.dialog-close-btn {
		color: rgb(156 163 175);
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: color 0.2s;
	}

	.dialog-close-btn:hover {
		color: white;
	}

	.close-icon {
		width: 24px;
		height: 24px;
	}

	.dialog-subtitle {
		font-size: 0.875rem;
		margin-top: 4px;
	}

	.dialog-content {
		overflow-y: auto;
		padding: 16px;
		color: rgb(209 213 219);
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
