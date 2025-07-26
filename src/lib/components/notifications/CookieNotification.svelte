<script lang="ts">
	import { onMount } from 'svelte';
	let isVisible = false;
	let isSwiping = false;
	let touchStartX = 0;
	let currentX = 0;
	let moveX = 0;

	onMount(() => {
		const cookieAccepted = localStorage.getItem('cookieAccepted-1');
		if (!cookieAccepted) {
			setTimeout(() => {
				isVisible = true;
			}, 100);
		}
	});

	function acceptCookies() {
		isVisible = false;
		localStorage.setItem('cookieAccepted-1', 'true');
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
		isSwiping = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isSwiping) return;
		currentX = e.changedTouches[0].screenX;
		moveX = currentX - touchStartX;
	}

	function handleTouchEnd() {
		if (!isSwiping) return;
		isSwiping = false;
		if (Math.abs(moveX) > 100) {
			acceptCookies();
		}
		moveX = 0;
	}
</script>

<div class="fixed right-4 bottom-4 ml-4">
	<div
		class="cookie-notification z-10 {isVisible ? 'show' : 'hidden'}"
		on:touchstart={handleTouchStart}
		on:touchmove={handleTouchMove}
		on:touchend={handleTouchEnd}
		style="transform: translateX({moveX}px)"
	>
		<div class="content">
			<div class="message">
				<img
					src="https://ysturasp.github.io/tg_emoji/Food%20and%20Drink/Cookie.webp"
					alt="Cookie"
					class="cookie-icon"
				/>
				<div class="text">
					<p>
						Мы используем cookie и собираем данные для аналитики и улучшения работы
						сервиса
					</p>
					<a href="/legal/privacy" class="text-blue-400 hover:text-blue-300"
						>Политика конфиденциальности</a
					>
				</div>
			</div>
			<button class="accept-button" on:click={acceptCookies}> Хорошо </button>
		</div>
	</div>
</div>

<style>
	.cookie-notification {
		position: fixed;
		bottom: 1rem;
		right: 1rem;
		background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
		border: 1px solid rgba(59, 130, 246, 0.2);
		padding: 0.75rem;
		border-radius: 0.75rem;
		transform: translateY(0);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		width: auto;
		max-width: 358px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	.cookie-notification.show {
		animation: fadeInScale 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) forwards;
	}

	.cookie-notification.hidden {
		display: none;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.message {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.cookie-icon {
		width: 62px;
		height: 62px;
		flex-shrink: 0;
	}

	.text {
		flex-grow: 1;
	}

	.text p {
		font-size: 0.875rem;
		color: #e2e8f0;
		line-height: 1.4;
	}

	.accept-button {
		width: 100%;
		padding: 0.5rem;
		background: linear-gradient(135deg, #3b82f6, #2563eb);
		color: white;
		border-radius: 0.5rem;
		font-weight: 500;
		font-size: 0.875rem;
		text-align: center;
		transition: all 0.3s ease;
		border: 1px solid rgba(59, 130, 246, 0.3);
	}

	.accept-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
	}

	@keyframes fadeInScale {
		0% {
			transform: translateY(-30%) scale(0.8);
			opacity: 0;
		}

		100% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
	}
</style>
