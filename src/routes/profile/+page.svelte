<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { goto } from '$app/navigation';
	import SessionManager from '../formatt/components/SessionManager.svelte';
	import FormattingHistory from '../formatt/components/FormattingHistory.svelte';
	import PaymentHistory from '../formatt/components/PaymentHistory.svelte';
	import PaymentModal from '../formatt/components/PaymentModal.svelte';
	import { checkFormatLimit } from '../formatt/api';
	import type { FormatLimit } from '../formatt/api';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';

	let activeTab = 'profile';
	let formatLimit: FormatLimit = { can: true, remaining: 0 };
	let isPaymentModalOpen = false;
	let isErrorModalOpen = false;
	let errorModalMessage = '';

	onMount(() => {
		auth.checkAuth();
	});

	$: if (!$auth.loading) {
		if (!$auth.authenticated) {
			goto('/formatt');
		} else {
			checkLimit();
		}
	}

	async function checkLimit() {
		if ($auth.authenticated) {
			formatLimit = await checkFormatLimit();
		}
	}

	function handlePaymentModalClose() {
		isPaymentModalOpen = false;
		checkLimit();
	}

	function handlePaymentError(event: CustomEvent<{ message: string }>) {
		errorModalMessage = event.detail.message;
		isErrorModalOpen = true;
	}

	async function handleLogout() {
		await auth.logout();
		goto('/formatt');
	}
</script>

<svelte:head>
	<title>Личный кабинет | ysturasp</title>
	<meta
		name="description"
		content="Личный кабинет ysturasp - управление профилем, сессиями и форматированиями"
	/>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		{#if $auth.loading}
			<div class="flex justify-center py-12">
				<div
					class="h-12 w-12 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
			</div>
		{:else if !$auth.authenticated}
			<div class="mt-8 rounded-2xl bg-slate-800 p-6 text-center">
				<p class="text-slate-300">Необходима авторизация</p>
				<button
					on:click={() => goto('/formatt')}
					class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Вернуться на страницу форматирования
				</button>
			</div>
		{:else}
			<div class="mt-8">
				<div class="mb-4 flex items-center gap-3">
					{#if $auth.user?.picture}
						<img
							src={$auth.user.picture}
							alt={$auth.user.name || 'User'}
							class="h-12 w-12 rounded-full"
						/>
					{:else}
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-xl text-slate-400"
						>
							👤
						</div>
					{/if}
					<div>
						<h1 class="text-2xl font-semibold text-white md:text-3xl">
							{$auth.user?.name || 'Пользователь'}
						</h1>
						<p class="text-sm text-slate-400">{$auth.user?.email}</p>
					</div>
				</div>

				<div class="scrollbar-hide mb-4 overflow-x-auto border-b border-slate-700">
					<div class="flex min-w-max gap-2">
						<button
							class="relative shrink-0 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
							'profile'
								? 'text-blue-400'
								: 'text-slate-400 hover:text-slate-300'}"
							on:click={() => (activeTab = 'profile')}
						>
							Профиль
							{#if activeTab === 'profile'}
								<div
									class="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-400"
								></div>
							{/if}
						</button>
						<button
							class="relative shrink-0 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
							'sessions'
								? 'text-blue-400'
								: 'text-slate-400 hover:text-slate-300'}"
							on:click={() => (activeTab = 'sessions')}
						>
							Устройства
							{#if activeTab === 'sessions'}
								<div
									class="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-400"
								></div>
							{/if}
						</button>
						<button
							class="relative shrink-0 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
							'history'
								? 'text-blue-400'
								: 'text-slate-400 hover:text-slate-300'}"
							on:click={() => (activeTab = 'history')}
						>
							История
							{#if activeTab === 'history'}
								<div
									class="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-400"
								></div>
							{/if}
						</button>
						<button
							class="relative shrink-0 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
							'payments'
								? 'text-blue-400'
								: 'text-slate-400 hover:text-slate-300'}"
							on:click={() => (activeTab = 'payments')}
						>
							Оплаты
							{#if activeTab === 'payments'}
								<div
									class="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-400"
								></div>
							{/if}
						</button>
					</div>
				</div>

				{#if activeTab === 'profile'}
					<div class="space-y-6">
						<div>
							<h2 class="mb-4 text-lg font-semibold text-white">
								Лимиты форматирования
							</h2>
							<div class="flex items-baseline gap-2">
								<span class="text-4xl font-bold text-white"
									>{formatLimit.remaining || 0}</span
								>
								<span class="text-slate-400">доступно</span>
							</div>
							<button
								on:click={() => (isPaymentModalOpen = true)}
								class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
							>
								Пополнить баланс
							</button>
						</div>

						<div class="border-t border-slate-700 pt-6">
							<button
								on:click={handleLogout}
								class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
							>
								Выйти из аккаунта
							</button>
						</div>
					</div>
				{:else if activeTab === 'sessions'}
					<SessionManager />
				{:else if activeTab === 'history'}
					<FormattingHistory />
				{:else if activeTab === 'payments'}
					<div class="space-y-6">
						<div>
							<h2 class="mb-4 text-lg font-semibold text-white">
								Пополнение баланса
							</h2>
							<div class="mb-4 flex items-baseline gap-2">
								<span class="text-4xl font-bold text-white"
									>{formatLimit.remaining || 0}</span
								>
								<span class="text-slate-400">доступно форматирований</span>
							</div>
							<button
								on:click={() => (isPaymentModalOpen = true)}
								class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
							>
								Пополнить баланс
							</button>
						</div>

						<div class="border-t border-slate-700 pt-6">
							<h2 class="mb-4 text-lg font-semibold text-white">История оплат</h2>
							<PaymentHistory />
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<Footer />

	<PaymentModal
		isOpen={isPaymentModalOpen}
		remaining={formatLimit.remaining || 0}
		on:close={handlePaymentModalClose}
		on:error={handlePaymentError}
	/>

	<BottomModal
		isOpen={isErrorModalOpen}
		title="Ошибка"
		subtitle={errorModalMessage}
		subtitleClass="text-red-400"
		onClose={() => (isErrorModalOpen = false)}
	>
		<div class="flex items-center justify-center py-4">
			<svg
				class="h-16 w-16 text-red-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
				></path>
			</svg>
		</div>
		<div slot="footer">
			<button
				on:click={() => (isErrorModalOpen = false)}
				class="w-full rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
			>
				Понятно
			</button>
		</div>
	</BottomModal>
</PageLayout>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
