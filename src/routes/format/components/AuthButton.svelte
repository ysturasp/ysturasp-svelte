<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadPrivacySettings, maskEmail, maskName } from '$lib/utils/privacy';
	import { browser } from '$app/environment';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';

	let privacySettings = loadPrivacySettings();
	let isTelegram = false;

	onMount(() => {
		auth.checkAuth();
		if (browser) {
			isTelegram = checkIsTelegramMiniApp();
			const updatePrivacy = () => {
				privacySettings = loadPrivacySettings();
			};
			window.addEventListener('storage', updatePrivacy);
			const interval = setInterval(updatePrivacy, 500);
			return () => {
				window.removeEventListener('storage', updatePrivacy);
				clearInterval(interval);
			};
		}
	});

	function handleLogin() {
		auth.login();
	}

	function handleProfileClick() {
		goto('/profile');
	}

	$: displayName = privacySettings.hideName
		? maskName($auth.user?.name || null)
		: $auth.user?.name || $auth.user?.email || '';

	$: displayEmail = privacySettings.hideEmail
		? maskEmail($auth.user?.email || '')
		: $auth.user?.email;

	$: showAvatar = !privacySettings.hideAvatar;
</script>

{#if $auth.loading}
	<div class="flex items-center gap-2">
		<div
			class="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
		></div>
	</div>
{:else if $auth.authenticated && $auth.user}
	<button
		on:click={handleProfileClick}
		class="flex items-center gap-3 rounded-lg bg-slate-700/50 px-3 py-2 text-white transition-colors hover:bg-slate-600"
	>
		{#if showAvatar && $auth.user.picture}
			<img src={$auth.user.picture} alt={displayName} class="h-8 w-8 rounded-full" />
		{:else}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-slate-400"
			>
				<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
					/>
				</svg>
			</div>
		{/if}
		<div class="flex flex-col items-start">
			<span class="text-sm font-medium">{displayName}</span>
			<span class="text-xs text-slate-400">Личный кабинет</span>
		</div>
		<svg class="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 5l7 7-7 7"
			/>
		</svg>
	</button>
{:else if !isTelegram}
	<div class="flex flex-col gap-3">
		<div class="flex flex-wrap gap-2">
			<button
				on:click={handleLogin}
				class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						fill="#4285F4"
					/>
					<path
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						fill="#34A853"
					/>
					<path
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						fill="#FBBC05"
					/>
					<path
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						fill="#EA4335"
					/>
				</svg>
				Войти через Google
			</button>
		</div>
	</div>
{/if}
