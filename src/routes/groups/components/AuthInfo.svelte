<script lang="ts">
	import { onMount } from 'svelte';
	import { authToken } from '../stores';
	import { checkAuth, logout } from '../api';

	interface AuthInfo {
		auth: number;
		user: {
			firstName?: string;
			lastName?: string;
			groupName?: string;
			login?: string;
			photoUrl?: string;
		};
	}

	let userInfo: AuthInfo | null = null;

	async function checkAuthStatus() {
		if (!$authToken) return;

		try {
			const data = await checkAuth($authToken);
			if (data?.auth_info?.auth === 1) {
				userInfo = data.auth_info;
			}
		} catch (error) {
			console.error('Error checking auth:', error);
		}
	}

	function handleLogout() {
		if (!$authToken) return;

		logout($authToken).catch(console.error);

		localStorage.removeItem('authToken');
		localStorage.removeItem('refreshToken');
		authToken.set(null);
		userInfo = null;
	}

	onMount(checkAuthStatus);
	$: if ($authToken) checkAuthStatus();
</script>

<div id="authInfoBlock" class="mb-2 flex items-center justify-center px-4 md:mb-4">
	{#if !$authToken}
		<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl">
			<svg
				class="h-6 w-6 text-blue-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
		<p class="text-sm text-slate-400">
			для безопасности студентов доступ к чатам возможен только после авторизации через ЯГТУ
			ID
		</p>
	{:else if userInfo}
		<div class="flex items-center gap-2 rounded-xl bg-slate-800/80 px-2 py-2 md:gap-3 md:px-4">
			<img
				src={userInfo.user.photoUrl || 'https://ystuty.ru/img/user.svg'}
				alt="avatar"
				class="h-10 w-10 rounded-full border-2 border-blue-500 object-cover"
			/>
			<div class="flex min-w-0 flex-col">
				<span class="truncate font-semibold text-white">
					{userInfo.user.firstName || ''}
					{userInfo.user.lastName || ''}
				</span>
				<span class="truncate text-xs text-blue-400">
					{userInfo.user.groupName || ''}{userInfo.user.login
						? ' · ' + userInfo.user.login
						: ''}
				</span>
			</div>
			<button
				on:click={handleLogout}
				class="ml-0 rounded-lg border border-blue-500 px-2 py-2 text-sm whitespace-nowrap text-blue-400 transition-all hover:bg-blue-600/20 hover:text-white md:ml-2 md:px-4"
			>
				Выйти
			</button>
		</div>
	{/if}
</div>
