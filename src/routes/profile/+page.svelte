<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { goto } from '$app/navigation';
	import SessionManager from '../format/components/SessionManager.svelte';
	import FormattingHistory from '../format/components/FormattingHistory.svelte';
	import PaymentHistory from '../format/components/PaymentHistory.svelte';
	import PaymentModal from '../format/components/PaymentModal.svelte';
	import PromoCodeInput from './components/PromoCodeInput.svelte';
	import ReferralSection from './components/ReferralSection.svelte';
	import { checkFormatLimit } from '../format/api';
	import type { FormatLimit } from '../format/api';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { browser } from '$app/environment';
	import {
		loadPrivacySettings,
		savePrivacySettings,
		maskEmail,
		maskName,
		type PrivacySettings
	} from '$lib/utils/privacy';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';

	const ACTIVE_TAB_STORAGE_KEY = 'profile_active_tab';
	const VALID_TABS = ['profile', 'sessions', 'history', 'payments', 'referrals'] as const;

	function loadActiveTab(): string {
		if (!browser) return 'profile';
		const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
		return saved && VALID_TABS.includes(saved as any) ? saved : 'profile';
	}

	function saveActiveTab(tab: string) {
		if (browser) {
			localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
		}
	}

	let activeTab = loadActiveTab();
	let formatLimit: FormatLimit = { can: true, remaining: 0 };
	let isPaymentModalOpen = false;
	let isErrorModalOpen = false;
	let errorModalMessage = '';
	let privacySettings: PrivacySettings = loadPrivacySettings();

	onMount(() => {
		auth.checkAuth();
		privacySettings = loadPrivacySettings();

		const urlTab = browser ? new URLSearchParams(window.location.search).get('tab') : null;
		if (urlTab && VALID_TABS.includes(urlTab as any)) {
			activeTab = urlTab;
		} else {
			activeTab = loadActiveTab();
		}
	});

	$: if (browser && activeTab) {
		saveActiveTab(activeTab);
	}

	$: if (!$auth.loading) {
		if (!$auth.authenticated) {
			goto('/format');
		} else {
			checkLimit();
		}
	}

	async function checkLimit() {
		if ($auth.authenticated) {
			formatLimit = await checkFormatLimit();
		}
	}

	function handlePrivacyChange(setting: keyof PrivacySettings) {
		privacySettings = { ...privacySettings, [setting]: !privacySettings[setting] };
		savePrivacySettings(privacySettings);
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
		goto('/format');
	}

	$: displayName = privacySettings.hideName
		? maskName($auth.user?.name || null)
		: $auth.user?.name || 'Пользователь';

	$: displayEmail = privacySettings.hideEmail
		? maskEmail($auth.user?.email || '')
		: $auth.user?.email;

	$: showAvatar = !privacySettings.hideAvatar;
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
					on:click={() => goto('/format')}
					class="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Вернуться на страницу форматирования
				</button>
			</div>
		{:else}
			<div class="mt-8">
				<div class="mb-4 flex items-center gap-3">
					{#if showAvatar && $auth.user?.picture}
						<img
							src={$auth.user.picture}
							alt={displayName}
							class="h-12 w-12 rounded-full"
						/>
					{:else}
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-slate-400"
						>
							<svg
								class="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
					{/if}
					<div>
						<h1 class="text-2xl font-semibold text-white md:text-3xl">
							{displayName}
						</h1>
						<p class="text-sm text-slate-400">{displayEmail}</p>
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
						<button
							class="relative shrink-0 px-4 py-2 text-sm font-medium transition-colors {activeTab ===
							'referrals'
								? 'text-blue-400'
								: 'text-slate-400 hover:text-slate-300'}"
							on:click={() => (activeTab = 'referrals')}
						>
							Бонусы
							{#if activeTab === 'referrals'}
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
							<h2 class="mb-2 text-lg font-semibold text-white">
								Настройки приватности
							</h2>
							<p class="mb-4 text-sm text-slate-400">
								Скрывайте личные данные для защиты приватности при стриминге
							</p>
							<div class="space-y-4">
								<div class="flex items-center justify-between">
									<label for="hideEmail" class="text-white">Скрыть email</label>
									<label class="switch">
										<input
											type="checkbox"
											id="hideEmail"
											checked={privacySettings.hideEmail}
											on:change={() => handlePrivacyChange('hideEmail')}
										/>
										<span class="slider round"></span>
									</label>
								</div>
								<div class="flex items-center justify-between">
									<label for="hideName" class="text-white">Скрыть имя</label>
									<label class="switch">
										<input
											type="checkbox"
											id="hideName"
											checked={privacySettings.hideName}
											on:change={() => handlePrivacyChange('hideName')}
										/>
										<span class="slider round"></span>
									</label>
								</div>
								<div class="flex items-center justify-between">
									<label for="hideAvatar" class="text-white">Скрыть аватар</label>
									<label class="switch">
										<input
											type="checkbox"
											id="hideAvatar"
											checked={privacySettings.hideAvatar}
											on:change={() => handlePrivacyChange('hideAvatar')}
										/>
										<span class="slider round"></span>
									</label>
								</div>
							</div>
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
							<h2 class="text-lg font-semibold text-white">Промокод</h2>
							<p class="mb-4 text-sm text-slate-400">
								Введите для получения бесплатных плюшек
							</p>
							<PromoCodeInput on:success={checkLimit} />
						</div>

						<div class="border-t border-slate-700 pt-6">
							<h2 class="mb-4 text-lg font-semibold text-white">История оплат</h2>
							<PaymentHistory on:refund-success={checkLimit} />
						</div>
					</div>
				{:else if activeTab === 'referrals'}
					<ReferralSection />
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

<NotificationsContainer />

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}

	.switch {
		position: relative;
		display: inline-block;
		width: 34px;
		height: 20px;
		flex-shrink: 0;
	}

	.switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.switch input:disabled {
		cursor: not-allowed;
	}

	.slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #ccc;
		transition: 0.4s;
		border-radius: 34px;
	}

	.switch input:disabled + .slider {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.slider:before {
		position: absolute;
		content: '';
		height: 14px;
		width: 14px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.4s;
		border-radius: 50%;
	}

	input:checked + .slider {
		background-color: #2196f3;
	}

	input:checked + .slider:before {
		transform: translateX(14px);
	}

	.slider.round {
		border-radius: 34px;
	}

	.slider.round:before {
		border-radius: 50%;
	}
</style>
