<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import type { NotificationOptions } from '../types';
	import { getReferralStats } from '../utils/api';
	import { auth } from '$lib/stores/auth';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import { notifications } from '$lib/stores/notifications';
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';

	const dispatch = createEventDispatcher<{
		close: void;
		showNotification: NotificationOptions;
	}>();

	let referralCount = 0;
	let statsLimit = 10;
	let referralLink = '';

	async function updateReferralLink() {
		if ($auth?.user?.id) {
			try {
				const response = await fetch('/api/stat/referral-code');
				if (response.ok) {
					const data = await response.json();
					referralLink = `${window.location.origin}${window.location.pathname}?ref=${data.referralCode}`;
				} else {
					referralLink = `${window.location.origin}${window.location.pathname}`;
				}
			} catch (error) {
				referralLink = `${window.location.origin}${window.location.pathname}`;
			}
		} else {
			referralLink = `${window.location.origin}${window.location.pathname}`;
		}
	}

	async function updateStats() {
		if (!$auth?.user?.id) {
			notifications.add('Необходима авторизация', 'error');
			return;
		}

		const stats = await getReferralStats();
		referralCount = stats.referralCount;
		statsLimit = stats.statsLimit;
	}

	function copyReferralLink() {
		if (navigator.clipboard) {
			navigator.clipboard
				.writeText(referralLink)
				.then(() => {
					notifications.add('Ссылка скопирована!', 'success');
				})
				.catch(() => {
					fallbackCopy();
				});
		} else {
			fallbackCopy();
		}
	}

	function fallbackCopy() {
		const referralLinkElement = document.getElementById('referralLink') as HTMLInputElement;
		referralLinkElement.select();
		try {
			document.execCommand('copy');
			notifications.add('Ссылка скопирована!', 'success');
		} catch (err) {
			notifications.add('Не удалось скопировать ссылку', 'error');
		}
	}

	$: {
		if ($auth) {
			if ($auth.user?.id && !$auth.loading) {
				updateReferralLink();
				updateStats();
			}
		}
	}

	onMount(async () => {
		await auth.checkAuth();
		if (!$auth.user?.id) {
			notifications.add(
				'Необходима авторизация для использования реферальной системы',
				'warning'
			);
		}
	});
</script>

<div class="fixed inset-0 z-[1001] bg-black/50 backdrop-blur-sm transition-opacity duration-300">
	<div
		class="flex h-full md:min-h-screen md:items-center md:justify-center md:p-4"
		style="background-color: #0b0f15ad;"
	>
		<div
			class="flex h-full w-full flex-col bg-slate-800 shadow-xl ring-1 ring-blue-500/50 md:h-auto md:max-w-2xl md:rounded-2xl"
		>
			<div class="flex items-center justify-between p-4">
				<h3 class="flex items-center gap-2 text-xl font-bold text-white md:text-2xl">
					<TgsSticker
						src="/stickers/star.tgs"
						width="42px"
						autoplay={true}
						once={false}
					/>
					<span>Получите больше возможностей!</span>
				</h3>
				<button
					class="p-2 text-slate-400 hover:text-white"
					on:click={() => dispatch('close')}
					aria-label="Закрыть модальное окно"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="-mt-4 flex-1 space-y-2 overflow-y-auto p-4">
				<div class="text-slate-300">
					<p class="mb-4 text-lg">
						Разблокируйте дополнительные возможности, приглашая других студентов!
					</p>

					<div class="mb-4 space-y-1">
						<h4 class="font-semibold text-white">Что вы получаете:</h4>
						<ul class="ml-2 list-inside list-disc space-y-3">
							<li class="flex items-center">
								<span class="mr-2 text-2xl">📊</span>
								<span>Больше просмотров статистики оценок</span>
							</li>
							<li class="flex items-center">
								<span class="mr-2 text-2xl">🎯</span>
								<span>Расширенная аналитика успеваемости</span>
							</li>
						</ul>
					</div>

					<div class="rounded-2xl bg-slate-700 p-4 md:p-0">
						<div class="flex flex-col items-center justify-center">
							<div class="w-full p-0 md:p-4">
								<div class="mb-2 flex items-center justify-between">
									<h4 class="mb-2 font-semibold text-white">
										Ваша реферальная ссылка:
									</h4>
									<button
										class="flex items-center text-sm text-blue-400 hover:text-blue-300"
										on:click={copyReferralLink}
									>
										<svg
											class="mr-1 h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
											/>
										</svg>
										Копировать
									</button>
								</div>
								<div class="relative">
									<input
										type="text"
										id="referralLink"
										readonly
										class="w-full bg-transparent font-mono text-white"
										value={referralLink}
									/>
								</div>
							</div>
						</div>
					</div>

					<div class="mb-4 space-y-1">
						<h4 class="font-semibold text-white">Как это работает:</h4>
						<ol class="ml-2 list-inside list-decimal space-y-1">
							<li>Поделитесь своей уникальной ссылкой с другими студентами</li>
							<li>
								Когда они перейдут по ссылке и начнут пользоваться сервисом, вы
								получите бонусы
							</li>
							<li>
								За каждого приглашенного студента +10 просмотров статистики в месяц
							</li>
						</ol>
					</div>

					<div class="rounded-2xl bg-slate-700 p-4">
						<h4 class="mb-2 font-semibold text-white">Ваша статистика:</h4>
						<div class="grid grid-cols-2 gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold">{referralCount}</div>
								<div class="text-sm">Приглашено</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold">{statsLimit}</div>
								<div class="text-sm">Лимит просмотров/месяц</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-auto bg-slate-700 p-4 md:rounded-b-lg">
				<button
					class="w-full rounded-2xl bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700"
					on:click={() => dispatch('close')}
				>
					Понятно!
				</button>
			</div>
		</div>
	</div>
</div>

<NotificationsContainer />

<style>
	input[readonly] {
		font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
	}
</style>
