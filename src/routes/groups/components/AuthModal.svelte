<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { authToken, refreshToken } from '../stores';
	import { login } from '../api';

	const dispatch = createEventDispatcher();
	let loading = false;
	let username = '';
	let password = '';
	let isOpen = false;

	onMount(() => {
		setTimeout(() => {
			isOpen = true;
		}, 0);
	});

	function handleClose() {
		isOpen = false;
		setTimeout(() => {
			dispatch('close');
		}, 300);
	}

	async function handleSubmit() {
		if (!username || !password) return;
		loading = true;

		try {
			const data = await login(username, password);

			if (data.access_token && data.refresh_token) {
				localStorage.setItem('authToken', data.access_token);
				localStorage.setItem('refreshToken', data.refresh_token);
				authToken.set(data.access_token);
				refreshToken.set(data.refresh_token);
				handleClose();
			}
		} catch (error) {
			console.error('Auth error:', error);
		} finally {
			loading = false;
		}
	}
</script>

<BottomModal {isOpen} title="Вход через ЯГТУ ID" onClose={handleClose}>
	<div class="absolute -top-12 left-1/2 -translate-x-1/2 transform">
		<div
			class="flex h-24 w-24 rotate-12 transform items-center justify-center rounded-2xl border-4 border-gray-900 bg-white shadow-lg"
		>
			<svg
				width="60"
				height="60"
				viewBox="0 0 95 95"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class="rotate-5 transform"
			>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M94.9997 73.8889C91.5433 86.0563 80.3544 95 67.0805 95H36.9443V73.8889H94.9997Z"
					fill="#F07C00"
				></path>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M0 65.9721C0 58.9596 2.45605 52.5178 6.59731 47.5C2.44174 42.4778 0 36.0537 0 29.0278C0 12.9989 12.9989 0 29.0277 0H94.9998V21.1112H29.0277C24.6562 21.1112 21.1111 24.6562 21.1111 29.0278C21.1111 33.3993 24.6562 36.9444 29.0277 36.9444H94.9998V58.0555H29.0277C24.6562 58.0555 21.1111 61.6005 21.1111 65.9721V94.9998H0V65.9721Z"
					fill="#004589"
				></path>
			</svg>
		</div>
	</div>

	<div class="mb-8 space-y-4">
		<div class="flex items-center gap-3 text-slate-300">
			<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
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
						d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
					></path>
				</svg>
			</div>
			<span>Безопасная авторизация через единый аккаунт ЯГТУ</span>
		</div>
		<div class="flex items-center gap-3 text-slate-300">
			<div class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
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
						d="M13 10V3L4 14h7v7l9-11h-7z"
					></path>
				</svg>
			</div>
			<span>Мгновенный доступ ко всем сервисам ysturasp</span>
		</div>
	</div>

	<form on:submit|preventDefault={handleSubmit} class="space-y-4">
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-400">Логин</label>
			<input
				type="text"
				bind:value={username}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="Введите логин"
			/>
		</div>

		<div>
			<label class="mb-2 block text-sm font-medium text-gray-400">Пароль</label>
			<input
				type="password"
				bind:value={password}
				required
				class="input-field w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white focus:outline-none"
				placeholder="Введите пароль"
			/>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="relative w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
		>
			<div class="button-content">
				{#if loading}
					<div class="loading-spinner" />
				{/if}
				<span>Войти</span>
			</div>
		</button>
	</form>
</BottomModal>

<style>
	.loading-spinner {
		width: 1.5rem;
		height: 1.5rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top-color: white;
		animation: spin 1s linear infinite;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	@keyframes spin {
		to {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}

	label {
		font-family: 'Exo 2', sans-serif;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.input-field {
		font-family: 'Exo 2', sans-serif;
		font-weight: 400;
	}

	button {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
