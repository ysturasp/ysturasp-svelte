<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { notifications } from '$lib/stores/notifications';
	import { slide } from 'svelte/transition';

	let username = '';
	let password = '';
	let isLinking = false;
	let showLoginForm = false;

	async function handleLink() {
		if (!username || !password) {
			notifications.add('Введите логин и пароль', 'error');
			return;
		}

		isLinking = true;
		try {
			const response = await fetch('/api/auth/ystu/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, password })
			});

			const data = await response.json();
			if (response.ok) {
				await auth.checkAcademic();
				notifications.add('Аккаунт ЯГТУ успешно привязан', 'success');
				showLoginForm = false;
				username = '';
				password = '';
			} else {
				notifications.add(data.error || 'Ошибка входа', 'error');
			}
		} catch (error) {
			notifications.add('Сетевая ошибка', 'error');
		} finally {
			isLinking = false;
		}
	}

	async function handleUnlink() {
		if (!confirm('Вы уверены, что хотите отвязать аккаунт ЯГТУ?')) return;

		await auth.logoutAcademic();
		notifications.add('Аккаунт ЯГТУ отвязан', 'info');
	}
</script>

<div class="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-4">
	<div class="mb-6 flex items-center gap-3">
		<div
			class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400"
		>
			<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14l9-5-9-5-9 5 9 5z"
				/>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
				/>
			</svg>
		</div>
		<div>
			<h3 class="text-lg leading-tight font-bold text-white">Личный кабинет ЯГТУ</h3>
			<p class="mt-1 text-xs text-slate-400">Привяжите аккаунт для доступа к своим оценкам</p>
		</div>
	</div>

	{#if $auth.academicUser}
		<div class="flex items-center gap-4 rounded-xl border border-slate-700 bg-slate-800 p-4">
			<img
				src={$auth.academicUser.photoUrl}
				alt="Avatar"
				class="h-12 w-12 rounded-full border-2 border-slate-700 object-cover shadow-lg"
			/>
			<div class="min-w-0">
				<div class="truncate text-sm font-bold text-white">
					{$auth.academicUser.fullName}
				</div>
				<div class="mt-0.5 text-xs text-slate-400">
					{$auth.academicUser.groupName} • {$auth.academicUser.email}
				</div>
			</div>
		</div>
		<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<a
				href="/me"
				class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
			>
				Перейти в кабинет студента
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M14 5l7 7m0 0l-7 7m7-7H3"
					/>
				</svg>
			</a>
			<button
				on:click={handleUnlink}
				class="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/5 px-4 py-2.5 text-[11px] font-bold text-rose-300 transition-all hover:bg-rose-500/15"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
				Отвязать кабинет
			</button>
		</div>
	{:else if !showLoginForm}
		<button
			on:click={() => (showLoginForm = true)}
			class="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-[0.98]"
		>
			Привязать аккаунт
		</button>
	{:else}
		<div class="space-y-4" transition:slide>
			<div class="space-y-1.5">
				<label
					for="ystu-login"
					class="ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
					>Логин</label
				>
				<input
					id="ystu-login"
					type="text"
					bind:value={username}
					placeholder="ivanov.ii.22"
					class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white transition-all placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
				/>
			</div>
			<div class="space-y-1.5">
				<label
					for="ystu-pass"
					class="ml-1 text-[10px] font-bold tracking-widest text-slate-500 uppercase"
					>Пароль</label
				>
				<input
					id="ystu-pass"
					type="password"
					bind:value={password}
					placeholder="••••••••"
					class="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white transition-all placeholder:text-slate-600 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
				/>
			</div>
			<div class="flex gap-2 pt-2">
				<button
					on:click={() => (showLoginForm = false)}
					class="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-600"
					disabled={isLinking}
				>
					Отмена
				</button>
				<button
					on:click={handleLink}
					class="flex-[2] rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-[0.98] disabled:opacity-50"
					disabled={isLinking}
				>
					{isLinking ? 'Связываем...' : 'Подтвердить'}
				</button>
			</div>
			<p class="text-center text-[10px] font-medium text-slate-500">
				Мы не храним ваш пароль. Токены сохраняются только в вашем браузере.
			</p>
		</div>
	{/if}
</div>
