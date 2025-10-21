<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import SubjectExclusionsModal from './SubjectExclusionsModal.svelte';
	import { onMount } from 'svelte';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
	import { checkNotificationStatus, toggleNotifications } from '../api-notifications';
	import { hapticFeedback } from '@telegram-apps/sdk-svelte';
	import type { ScheduleData } from '../types';
	import { LessonTypes } from '$lib/types/schedule';

	export let isOpen = false;
	export let onClose: () => void;
	export let groupName = '';
	export let hiddenSubjects: any[] = [];
	export let scheduleData: ScheduleData | null = null;

	let isLoading = false;
	let isTelegramMiniApp = false;
	let notificationStatus: {
		subscribed: boolean;
		notifyMinutes?: number;
		subscriptions?: any[];
	} | null = null;
	let selectedMinutes = 15;
	let allSubscriptions: any[] = [];
	let isCurrentGroupSubscribed = false;
	let excludeHiddenSubjects = true;
	let manuallyExcludedSubjects: string[] = [];
	let apiHiddenSubjects: any[] = [];
	let isExclusionsModalOpen = false;

	const timeOptions = [
		{ minutes: 5, label: '5 мин' },
		{ minutes: 10, label: '10 мин' },
		{ minutes: 15, label: '15 мин' },
		{ minutes: 20, label: '20 мин' },
		{ minutes: 30, label: '30 мин' },
		{ minutes: 45, label: '45 мин' },
		{ minutes: 60, label: '60 мин' }
	];

	onMount(() => {
		isTelegramMiniApp = checkIsTelegramMiniApp();
		if (!isTelegramMiniApp && typeof window !== 'undefined') {
			isTelegramMiniApp = !!(window as any).Telegram?.WebApp;
		}
	});

	$: if (isOpen) {
		loadNotificationStatus();
	}

	async function loadNotificationStatus() {
		if (!isTelegramMiniApp) return;

		isLoading = true;
		try {
			notificationStatus = await checkNotificationStatus();
			allSubscriptions = notificationStatus?.subscriptions || [];

			if (groupName && allSubscriptions.length > 0) {
				const groupSubscription = allSubscriptions.find(
					(sub) => sub.groupName === groupName
				);
				if (groupSubscription) {
					selectedMinutes = groupSubscription.notifyMinutes;
					isCurrentGroupSubscribed = true;
					excludeHiddenSubjects = groupSubscription.excludeHidden !== false;
					manuallyExcludedSubjects = groupSubscription.manuallyExcludedSubjects || [];
					apiHiddenSubjects = groupSubscription.hiddenSubjects || [];
				} else {
					selectedMinutes = 15;
					isCurrentGroupSubscribed = false;
					excludeHiddenSubjects = true;
					manuallyExcludedSubjects = [];
					apiHiddenSubjects = [];
				}
			} else if (groupName) {
				selectedMinutes = 15;
				isCurrentGroupSubscribed = false;
				excludeHiddenSubjects = true;
				manuallyExcludedSubjects = [];
				apiHiddenSubjects = [];
			}
		} catch (error) {
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		if (!isTelegramMiniApp || !groupName) return;

		isLoading = true;
		try {
			const baseHidden =
				apiHiddenSubjects.length > 0
					? apiHiddenSubjects
					: excludeHiddenSubjects
						? hiddenSubjects
						: [];

			const combinedExclusions = [...baseHidden, ...manuallyExcludedSubjects];

			const success = await toggleNotifications(
				groupName,
				selectedMinutes,
				combinedExclusions,
				true,
				manuallyExcludedSubjects
			);
			if (success) {
				triggerHapticFeedback('success');
				await loadNotificationStatus();
			} else {
				triggerHapticFeedback('error');
			}
		} catch (error) {
			console.error('Ошибка при сохранении настроек уведомлений:', error);
			triggerHapticFeedback('error');
		} finally {
			isLoading = false;
		}
	}

	async function handleUnsubscribe() {
		if (!isTelegramMiniApp || !groupName) return;

		isLoading = true;
		try {
			const success = await toggleNotifications(groupName, 0, null, false, []);
			if (success) {
				notificationStatus = { subscribed: false };
				triggerHapticFeedback('success');
				await loadNotificationStatus();
			} else {
				triggerHapticFeedback('error');
			}
		} catch (error) {
			triggerHapticFeedback('error');
		} finally {
			isLoading = false;
		}
	}

	async function handleUnsubscribeGroup(targetGroupName: string) {
		if (!isTelegramMiniApp) return;

		isLoading = true;
		try {
			const success = await toggleNotifications(targetGroupName, 0, null, false, []);
			if (success) {
				triggerHapticFeedback('success');
				await loadNotificationStatus();
			} else {
				triggerHapticFeedback('error');
			}
		} catch (error) {
			triggerHapticFeedback('error');
		} finally {
			isLoading = false;
		}
	}

	function triggerHapticFeedback(type: 'success' | 'error' | 'selection') {
		if (isTelegramMiniApp) {
			try {
				if (type === 'success') {
					hapticFeedback.notificationOccurred.ifAvailable('success');
				} else if (type === 'error') {
					hapticFeedback.notificationOccurred.ifAvailable('error');
				} else {
					hapticFeedback.impactOccurred.ifAvailable('medium');
				}
			} catch {}
		}
	}

	function selectTimeOption(minutes: number) {
		selectedMinutes = minutes;
		triggerHapticFeedback('selection');
	}

	function handleExclusionsSave(excluded: string[]) {
		manuallyExcludedSubjects = excluded;
		triggerHapticFeedback('success');
	}
</script>

<BottomModal
	{isOpen}
	title="Настройка уведомлений"
	subtitle="Убедитесь, что взаимодействовали с ботом хотя бы один раз и он не заблокирован"
	{onClose}
>
	{#if isLoading}
		<div class="flex items-center justify-center py-8">
			<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-white"></div>
		</div>
	{:else if !isTelegramMiniApp}
		<div class="py-6 text-center">
			<svg
				class="mx-auto mb-4 h-16 w-16 text-blue-500"
				fill="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"
				/>
			</svg>
			<p class="mb-4 text-lg text-gray-300">
				Для использования уведомлений откройте мини приложение в Telegram
			</p>
			<a
				href="https://t.me/ysturasp_bot/ysturasp_webapp"
				target="_blank"
				class="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white transition-all hover:bg-blue-700"
			>
				Открыть в Telegram
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#if groupName}
				<div class="rounded-lg bg-slate-800 p-4">
					<p class="mb-3 font-medium text-white">Настройки для группы {groupName}:</p>
					<p class="mb-4 text-sm text-gray-300">
						Выберите за сколько минут до начала занятия получать уведомление:
					</p>

					<div class="mb-4 grid grid-cols-4 gap-2">
						{#each timeOptions as option}
							<button
								class="rounded-lg px-4 py-2 transition-all {selectedMinutes ===
								option.minutes
									? 'bg-blue-600 text-white'
									: 'bg-slate-700 text-gray-300 hover:bg-blue-600'}"
								on:click={() => selectTimeOption(option.minutes)}
							>
								{option.label}
							</button>
						{/each}
					</div>

					{#if hiddenSubjects.length > 0}
						<div class="mb-4 rounded-lg bg-slate-700 p-3">
							<div class="flex items-center justify-between">
								<div class="flex-1">
									<p class="text-sm font-medium text-white">
										Исключить скрытые предметы
									</p>
									<p class="text-xs text-gray-400">
										Не уведомлять о {hiddenSubjects.length} скрытых предметах
									</p>
								</div>
								<label class="switch">
									<input type="checkbox" bind:checked={excludeHiddenSubjects} />
									<span class="slider round"></span>
								</label>
							</div>
						</div>
					{/if}

					<button
						type="button"
						on:click={() => (isExclusionsModalOpen = true)}
						class="mb-4 w-full rounded-lg bg-slate-700 p-4 text-left transition-all hover:bg-slate-600"
					>
						<div class="flex items-center justify-between">
							<div class="flex-1">
								<p class="text-sm font-medium text-white">
									Исключить занятия вручную
								</p>
								<p class="mt-1 text-xs text-gray-400">
									Выберите какие занятия не нужно включать в уведомления
								</p>
								{#if manuallyExcludedSubjects.length > 0}
									<p class="mt-2 text-xs text-orange-400">
										Исключено: {manuallyExcludedSubjects.length} типов занятий
									</p>
								{/if}
							</div>
							<svg
								class="h-5 w-5 flex-shrink-0 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</div>
					</button>

					<div class="flex gap-2">
						<button
							on:click={handleSave}
							disabled={isLoading}
							class="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLoading
								? 'Сохранение...'
								: isCurrentGroupSubscribed
									? 'Изменить'
									: 'Сохранить'}
						</button>
						{#if isCurrentGroupSubscribed}
							<button
								on:click={handleUnsubscribe}
								disabled={isLoading}
								class="flex-1 rounded-lg bg-red-600 px-4 py-3 text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{isLoading ? 'Отключение...' : 'Отключить'}
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="rounded-lg bg-slate-800 p-4">
					<p class="mb-2 font-medium text-white">
						Выберите группу для настройки уведомлений
					</p>
					<p class="text-sm text-gray-400">Сначала выберите группу в форме расписания</p>
				</div>
			{/if}

			{#if allSubscriptions.length > 0}
				<div class="rounded-lg bg-slate-800 p-4">
					<p class="mb-3 text-lg font-medium text-white">Ваши подписки на уведомления:</p>
					<div class="space-y-2">
						{#each allSubscriptions as subscription}
							<div
								class="flex items-center justify-between rounded-lg bg-slate-700 p-3"
							>
								<div>
									<p class="font-medium text-white">
										{subscription.groupName}
										{#if groupName === subscription.groupName}
											<span class="text-blue-400">(текущая)</span>
										{/if}
									</p>
									<p class="text-sm text-gray-400">
										За {subscription.notifyMinutes} минут до начала
									</p>
									{#if subscription.excludeHidden && subscription.hiddenSubjects && subscription.hiddenSubjects.length > 0}
										<p class="text-xs text-orange-400">
											🚫 Исключено скрытых: {subscription.hiddenSubjects
												.length}
										</p>
									{:else if subscription.excludeHidden}
										<p class="text-xs text-gray-500">
											🚫 Исключены скрытые предметы: нет
										</p>
									{/if}
									{#if subscription.manuallyExcludedSubjects && subscription.manuallyExcludedSubjects.length > 0}
										<details class="mt-1">
											<summary
												class="cursor-pointer text-xs text-red-400 hover:text-red-300"
											>
												🚫 Исключено вручную: {subscription
													.manuallyExcludedSubjects.length} типов занятий
											</summary>
											<div class="mt-1 ml-4 space-y-0.5">
												{#each subscription.manuallyExcludedSubjects as excluded}
													{@const [subj, typeStr] = excluded.split('|')}
													{@const type = parseInt(typeStr)}
													<p class="text-xs text-gray-400">
														• {subj} — {LessonTypes[type] ||
															`Тип ${type}`}
													</p>
												{/each}
											</div>
										</details>
									{:else if !subscription.excludeHidden && (!subscription.manuallyExcludedSubjects || subscription.manuallyExcludedSubjects.length === 0)}
										<p class="text-xs text-green-400">
											✅ Все предметы включены
										</p>
									{/if}
								</div>
								<div class="flex items-center gap-2">
									<button
										on:click={() =>
											handleUnsubscribeGroup(subscription.groupName)}
										disabled={isLoading}
										class="rounded-lg bg-red-600 px-3 py-1 text-xs text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Отключить
									</button>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="rounded-lg bg-slate-800 p-4">
					<p class="mb-2 font-medium text-white">
						У вас пока нет подписок на уведомления
					</p>
					<p class="text-sm text-gray-400">Настройте уведомления для группы ниже</p>
				</div>
			{/if}
		</div>
	{/if}
</BottomModal>

<SubjectExclusionsModal
	isOpen={isExclusionsModalOpen}
	onClose={() => (isExclusionsModalOpen = false)}
	{scheduleData}
	hiddenSubjects={apiHiddenSubjects}
	{manuallyExcludedSubjects}
	onSave={handleExclusionsSave}
/>

<style>
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
