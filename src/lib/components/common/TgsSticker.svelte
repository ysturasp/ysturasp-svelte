<script>
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	export let src;
	export let autoplay = true;
	export let once = false;
	export let playOnHover = false;
	export let width = '64px';
	export let height = '64px';
	export let quality = 2;

	/** @type {HTMLDivElement | null} */
	let tgsElement = null;
	/** @type {HTMLPictureElement | null} */
	let picture = null;
	/** @type {ReturnType<typeof setInterval> | null} */
	let animationInterval = null;
	let isVisible = true;
	let tgsPlayerLoaded = false;

	async function loadTgsPlayer() {
		if (!browser || tgsPlayerLoaded || customElements.get('tgs-player')) {
			tgsPlayerLoaded = true;
			return;
		}

		try {
			const script = document.createElement('script');
			script.src = '/js/tgs-player.js';
			script.async = true;

			await new Promise((resolve, reject) => {
				script.onload = resolve;
				script.onerror = reject;
				document.head.appendChild(script);
			});

			tgsPlayerLoaded = true;
		} catch (error) {
			console.error('Failed to load TGS player:', error);
		}
	}

	function handleMouseEnter() {
		if (playOnHover && picture) {
			playAnimation();
		}
	}

	function playAnimation() {
		if (!browser) return;

		// @ts-ignore
		if (window.RLottie && picture) {
			try {
				// @ts-ignore
				window.RLottie.playOnce(picture);
			} catch (e) {
				console.warn('TGS animation error:', e);
			}
		}
	}

	function startContinuousPlay() {
		if (!browser) return;

		if (!once && autoplay) {
			animationInterval = setInterval(() => {
				if (isVisible && picture) {
					playAnimation();
				}
			}, 3000);
		}
	}

	function handleVisibilityChange() {
		if (!browser) return;

		isVisible = !document.hidden;
		if (isVisible && autoplay && !once) {
			setTimeout(() => {
				if (picture) {
					playAnimation();
				}
			}, 100);
		}
	}

	function handleFocus() {
		if (!browser) return;

		isVisible = true;
		if (autoplay && !once && picture) {
			setTimeout(() => playAnimation(), 100);
		}
	}

	function handleBlur() {
		if (!browser) return;
		isVisible = false;
	}

	onMount(async () => {
		if (!browser) return;

		await loadTgsPlayer();

		setTimeout(() => {
			if (tgsElement) {
				picture = tgsElement.querySelector('picture');
				if (autoplay && picture) {
					setTimeout(() => {
						playAnimation();
						if (!once) {
							startContinuousPlay();
						}
					}, 500);
				}
			}
		}, 1000);

		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('focus', handleFocus);
		window.addEventListener('blur', handleBlur);
	});

	onDestroy(() => {
		if (!browser) return;

		if (animationInterval) {
			clearInterval(animationInterval);
		}
		document.removeEventListener('visibilitychange', handleVisibilityChange);
		window.removeEventListener('focus', handleFocus);
		window.removeEventListener('blur', handleBlur);
	});
</script>

<div
	class="tgs-wrapper"
	style="width: {width}; height: {height};"
	bind:this={tgsElement}
	role="presentation"
	aria-hidden="true"
	onmouseenter={handleMouseEnter}
>
	<!-- svelte-ignore a11y-unknown-element -->
	<tgs-player
		{src}
		autoplay={autoplay ? '' : undefined}
		once={once ? '' : undefined}
		data-quality={quality}
	></tgs-player>
</div>

<style>
	.tgs-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 8px;
		line-height: 0;
	}

	.tgs-wrapper :global(tgs-player) {
		width: 100%;
		height: 100%;
		display: block;
		line-height: 0;
	}

	.tgs-wrapper :global(picture) {
		width: 100%;
		height: 100%;
		display: block;
		line-height: 0;
	}

	.tgs-wrapper :global(canvas) {
		width: 100% !important;
		height: 100% !important;
		max-width: 100%;
		max-height: 100%;
		object-fit: cover;
		display: block;
		image-rendering: -webkit-optimize-contrast;
		image-rendering: crisp-edges;
		image-rendering: pixelated;
	}
</style>
