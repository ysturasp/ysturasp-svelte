<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { createEventDispatcher } from 'svelte';
	import { linearStore } from '$lib/stores/linear';
	import { notifications } from '$lib/stores/notifications';
	import type { YSTULesson } from '../types';
	import LinearTaskList from './LinearTaskList.svelte';
	import { onDestroy } from 'svelte';
	import { LessonTypes } from '../types';

	export let isOpen = false;
	export let onClose: () => void;
	export let lesson: YSTULesson;
	export let date: string;

	let apiKey = '';
	let isLoading = false;
	let modalOpen = false;
	let taskListComponent: LinearTaskList;

	$: isConfigured = $linearStore.isConfigured;

	$: if (isOpen !== modalOpen) {
		modalOpen = isOpen;
	}

	function formatDate(dateStr: string): string {
		if (!dateStr) return 'Дата не указана';

		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return 'Неверный формат даты';

		return date.toLocaleDateString('ru-RU', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	}

	function formatTime(timeStr: string): string {
		const date = new Date(timeStr);
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Europe/Moscow'
		});
	}

	function getLessonType(type: number): string {
		return LessonTypes[type] || 'Занятие';
	}

	function getLessonTypeColor(type: number): string {
		switch (type) {
			case 2:
				return 'text-green-400';
			case 4:
				return 'text-yellow-400';
			case 8:
				return 'text-blue-400';
			case 1:
				return 'text-purple-400';
			case 5:
				return 'text-pink-400';
			case 6:
				return 'text-indigo-400';
			case 7:
				return 'text-orange-400';
			case 3:
				return 'text-red-400';
			case 9:
				return 'text-gray-400';
			default:
				return 'text-slate-400';
		}
	}

	async function handleSubmit() {
		if (!apiKey.trim()) {
			notifications.add('Введите API ключ', 'error');
			return;
		}

		isLoading = true;
		try {
			linearStore.setApiKey(apiKey);
			notifications.add('API ключ успешно сохранен', 'success');
			apiKey = '';
		} catch (error) {
			notifications.add('Ошибка при сохранении API ключа', 'error');
		} finally {
			isLoading = false;
		}
	}

	function handleRemoveKey() {
		linearStore.removeApiKey();
		notifications.add('API ключ удален', 'info');
	}

	function handleModalClose() {
		if (taskListComponent && taskListComponent.hasOpenPopups()) {
			return;
		}
		modalOpen = false;
		onClose();
	}

	function checkCanClose(): boolean {
		return !(taskListComponent && taskListComponent.hasOpenPopups());
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && modalOpen) {
			if (taskListComponent && taskListComponent.hasOpenPopups()) {
				return;
			}
			handleModalClose();
		}
	}

	onDestroy(() => {
		if (modalOpen) {
			handleModalClose();
		}
	});
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<BottomModal
	isOpen={modalOpen}
	title={lesson.lessonName || 'Без названия'}
	subtitle={getLessonType(lesson.type)}
	subtitleClass={getLessonTypeColor(lesson.type)}
	onClose={handleModalClose}
	{checkCanClose}
>
	<div class="space-y-4">
		<div class="rounded-xl bg-slate-800 p-4">
			<style>
				:global(.modal-title) {
					padding-bottom: 0 !important;
				}
				:global(.modal-title + .text-sm) {
					margin-top: -0.5rem;
					padding-bottom: 1rem;
				}
			</style>

			<div class="modal-title"></div>

			<div class="flex flex-col gap-2">
				{#if lesson.teacherName}
					<div class="flex items-start gap-3">
						<div class="mt-1 rounded-lg bg-blue-500/20 p-2">
							<svg
								class="h-5 w-5 text-blue-400"
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
						<div class="flex-grow">
							<div class="text-sm text-gray-400">Преподаватель</div>
							<div class="text-white">{lesson.teacherName}</div>
						</div>
					</div>
				{/if}

				<div class="flex items-start gap-3">
					<div class="mt-1 rounded-lg bg-emerald-500/20 p-2">
						<svg
							class="h-5 w-5 text-emerald-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div class="flex-grow">
						<div class="text-sm text-gray-400">Дата</div>
						<div class="text-white">{formatDate(date)}</div>
					</div>
				</div>

				<div class="flex items-start gap-3">
					<div class="mt-1 rounded-lg bg-purple-500/20 p-2">
						<svg
							class="h-5 w-5 text-purple-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div class="flex-grow">
						<div class="text-sm text-gray-400">Время</div>
						<div class="text-white">
							{formatTime(lesson.startAt)} — {formatTime(lesson.endAt)}
						</div>
					</div>
				</div>

				{#if lesson.auditoryName}
					<div class="flex items-start gap-3">
						<div class="mt-1 rounded-lg bg-amber-500/20 p-2">
							<svg
								class="h-5 w-5 text-amber-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
								/>
							</svg>
						</div>
						<div class="flex-grow">
							<div class="text-sm text-gray-400">Аудитория</div>
							<div class="text-white">{lesson.auditoryName}</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if !isConfigured}
			<div class="rounded-xl bg-slate-800 p-4">
				<h3 class="mb-2 text-lg font-semibold text-white">Настройка интеграции</h3>
				<p class="mb-4 text-sm text-gray-300">
					Для интеграции с Linear необходимо указать API ключ. Его можно получить в
					настройках Linear.
				</p>
				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div>
						<label for="apiKey" class="mb-2 block text-sm text-white">API ключ:</label>
						<input
							type="text"
							id="apiKey"
							bind:value={apiKey}
							class="w-full rounded-lg bg-slate-700 p-2 text-white"
							placeholder="lin_api_..."
						/>
					</div>
					<button
						type="submit"
						class="w-full rounded-lg bg-blue-600 p-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
						disabled={isLoading}
					>
						{isLoading ? 'Сохранение...' : 'Сохранить'}
					</button>
				</form>
			</div>
		{:else}
			<div class="rounded-xl bg-slate-800 p-4">
				<h3 class="mb-4 text-lg font-semibold text-white">Задачи</h3>
				<LinearTaskList bind:this={taskListComponent} {lesson} {date} />
			</div>

			<div class="mt-4 rounded-lg bg-slate-800 p-2">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-300">Linear подключен</span>
					<button
						on:click={handleRemoveKey}
						class="rounded-lg bg-red-600 px-2 py-1 text-xs text-white transition-all hover:bg-red-700"
					>
						Отключить
					</button>
				</div>
			</div>
		{/if}
	</div>
	<div class="pb-1 md:pb-0" slot="footer">
		<button
			on:click={handleModalClose}
			class="w-full rounded-lg px-4 py-2 text-white ring-1 ring-blue-500/50 transition-all hover:bg-blue-700"
		>
			Закрыть
		</button>
	</div>
</BottomModal>
