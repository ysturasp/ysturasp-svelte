<script lang="ts">
	import type { WriteAccessStatus } from '$lib/utils/write-access';
	import { requestWriteAccessPermission } from '$lib/utils/write-access';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/stores/settings';
	import '$lib/styles/global.css';

	let { status = $bindable('denied' as WriteAccessStatus), isChecking = $bindable(true) } =
		$props();
	let retrying = $state(false);
	let isLowercase = $state(false);

	async function handleRetry() {
		if (retrying) return;
		retrying = true;
		isChecking = true;

		try {
			const newStatus = await requestWriteAccessPermission();
			status = newStatus;

			if (newStatus === 'allowed' && browser) {
				window.dispatchEvent(new CustomEvent('writeAccessAllowed'));
			}
		} catch (error) {
			console.error('Ошибка при повторном запросе доступа:', error);
			status = 'error';
		} finally {
			isChecking = false;
			retrying = false;
		}
	}

	function getStatusMessage(): string {
		switch (status) {
			case 'blocked':
				return 'Вы заблокировали бота. Разблокируйте бота в Telegram, чтобы продолжить использование приложения.';
			case 'denied':
				return 'Для работы приложения необходимо разрешить боту отправлять вам сообщения. Это нужно для уведомлений о расписании.';
			case 'error':
				return 'Произошла ошибка при запросе доступа. Пожалуйста, попробуйте перезагрузить страницу.';
			case 'not_telegram':
				return 'Это приложение доступно только в Telegram Mini App.';
			default:
				return 'Проверка доступа...';
		}
	}

	function getStatusTitle(): string {
		switch (status) {
			case 'blocked':
				return 'Бот заблокирован';
			case 'denied':
				return 'Доступ не разрешен';
			case 'error':
				return 'Ошибка';
			case 'not_telegram':
				return 'Неверная среда';
			default:
				return 'Проверка доступа';
		}
	}

	onMount(() => {
		if (!browser) return;

		const unsubscribe = settings.subscribe((value) => {
			isLowercase = value.lowercase;
			if (typeof document !== 'undefined' && document.body) {
				document.body.classList.toggle('lowercase', value.lowercase);
			}
		});

		document.body.style.overflow = 'hidden';
		return () => {
			unsubscribe();
			document.body.style.overflow = '';
		};
	});
</script>

<div class="write-access-gate">
	<div class="gate-content">
		{#if isChecking}
			<div class="checking">
				<div class="spinner"></div>
				<h2>Проверка доступа...</h2>
			</div>
		{:else}
			<div class="status-block">
				<div
					class="status-icon"
					class:error={status === 'error'}
					class:blocked={status === 'blocked'}
				>
					{#if status === 'blocked'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					{:else if status === 'denied'}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path
								d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
							></path>
							<line x1="12" y1="9" x2="12" y2="13"></line>
							<line x1="12" y1="17" x2="12.01" y2="17"></line>
						</svg>
					{:else}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="64"
							height="64"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					{/if}
				</div>
				<h2>{getStatusTitle()}</h2>
				<p class="status-message">{getStatusMessage()}</p>
				{#if status !== 'not_telegram' && status !== 'error'}
					<button class="retry-button" onclick={handleRetry} disabled={retrying}>
						{retrying ? 'Повторная проверка...' : 'Попробовать снова'}
					</button>
				{/if}
				{#if status === 'error'}
					<button class="retry-button" onclick={() => window.location.reload()}>
						Перезагрузить страницу
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.write-access-gate {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 10000;
		padding: 1rem;
	}

	.gate-content {
		background: rgba(30, 41, 59, 0.9);
		border-radius: 16px;
		padding: 2rem;
		max-width: 400px;
		width: 100%;
		text-align: center;
		backdrop-filter: blur(10px);
		border: 1px solid rgba(59, 130, 246, 0.2);
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.3),
			0 10px 10px -5px rgba(0, 0, 0, 0.2);
	}

	.checking {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.checking h2 {
		color: #fff;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid rgba(59, 130, 246, 0.2);
		border-top-color: #3b82f6;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.status-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.status-icon {
		color: #fbbf24;
		margin-bottom: 0.5rem;
	}

	.status-icon.blocked {
		color: #ef4444;
	}

	.status-icon.error {
		color: #ef4444;
	}

	.status-block h2 {
		color: #fff;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0;
	}

	.status-message {
		color: #cbd5e1;
		font-size: 0.9375rem;
		line-height: 1.6;
		margin: 0;
	}

	.retry-button {
		margin-top: 1rem;
		padding: 0.75rem 1.5rem;
		background: #3b82f6;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.retry-button:hover:not(:disabled) {
		background: #2563eb;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
	}

	.retry-button:active:not(:disabled) {
		transform: translateY(0);
	}

	.retry-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>
