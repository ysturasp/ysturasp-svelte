<script lang="ts">
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import type { ScheduleData } from '../types';
	import { LessonTypes } from '$lib/types/schedule';
	import { hapticFeedback } from '@tma.js/sdk-svelte';

	export let isOpen = false;
	export let onClose: () => void;
	export let scheduleData: ScheduleData | null = null;
	export let hiddenSubjects: any[] = [];
	export let manuallyExcludedSubjects: string[] = [];
	export let onSave: (excluded: string[]) => void;

	interface SubjectWithTypes {
		name: string;
		types: number[];
	}

	let subjectsWithTypes: SubjectWithTypes[] = [];
	let openSubjectMenus: Set<string> = new Set();
	let localExcluded: string[] = [];
	let isInitialized = false;

	$: if (isOpen) {
		extractSubjectsWithTypes();
		isInitialized = false;
	}

	$: if (isOpen && subjectsWithTypes.length > 0 && !isInitialized) {
		initializeLocalExcluded();
		isInitialized = true;
	}

	function initializeLocalExcluded() {
		const excluded = [...manuallyExcludedSubjects];

		if (hiddenSubjects.length > 0) {
			hiddenSubjects.forEach((hiddenItem: any) => {
				let key: string;

				if (typeof hiddenItem === 'string') {
					key = hiddenItem;
				} else {
					const lessonName = hiddenItem.lessonname || hiddenItem.lessonName;
					const lessonType = hiddenItem.type;
					if (!lessonName) return;
					key = `${lessonName}|${lessonType}`;
				}

				if (!excluded.includes(key)) {
					excluded.push(key);
				}
			});
		}

		localExcluded = excluded;
	}

	function extractSubjectsWithTypes() {
		if (!scheduleData) {
			subjectsWithTypes = [];
			return;
		}

		const subjectsMap = new Map<string, Set<number>>();

		scheduleData.items.forEach((week) => {
			week.days.forEach((day) => {
				day.lessons?.forEach((lesson) => {
					if (lesson.lessonName && lesson.lessonName.trim()) {
						if (!subjectsMap.has(lesson.lessonName)) {
							subjectsMap.set(lesson.lessonName, new Set());
						}
						subjectsMap.get(lesson.lessonName)!.add(lesson.type);
					}
				});
			});
		});

		subjectsWithTypes = Array.from(subjectsMap.entries())
			.map(([name, types]) => ({
				name,
				types: Array.from(types).sort((a, b) => a - b)
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	function toggleSubjectMenu(subjectName: string) {
		const newSet = new Set(openSubjectMenus);
		if (newSet.has(subjectName)) {
			newSet.delete(subjectName);
		} else {
			newSet.add(subjectName);
		}
		openSubjectMenus = newSet;
	}

	function toggleLessonTypeExclusion(subjectName: string, lessonType: number) {
		const key = `${subjectName}|${lessonType}`;
		if (localExcluded.includes(key)) {
			localExcluded = localExcluded.filter((s) => s !== key);
		} else {
			localExcluded = [...localExcluded, key];
		}
		triggerHapticFeedback('selection');
	}

	function toggleAllTypesForSubject(subjectName: string, types: number[]) {
		const allExcluded = types.every((type) => localExcluded.includes(`${subjectName}|${type}`));

		if (allExcluded) {
			localExcluded = localExcluded.filter((key) => !key.startsWith(`${subjectName}|`));
		} else {
			const newExclusions = types.map((type) => `${subjectName}|${type}`);
			const withoutCurrent = localExcluded.filter(
				(key) => !key.startsWith(`${subjectName}|`)
			);
			localExcluded = [...withoutCurrent, ...newExclusions];
		}
		triggerHapticFeedback('selection');
	}

	function getExcludedTypesCount(subjectName: string): number {
		return localExcluded.filter((key) => key.startsWith(`${subjectName}|`)).length;
	}

	function triggerHapticFeedback(type: 'success' | 'error' | 'selection') {
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

	function handleSave() {
		const manuallySelected = localExcluded.filter((key) => {
			return !hiddenSubjects.some((hiddenItem: any) => {
				if (typeof hiddenItem === 'string') {
					return key === hiddenItem;
				} else {
					const lessonName = hiddenItem.lessonname || hiddenItem.lessonName;
					const lessonType = hiddenItem.type;
					return key === `${lessonName}|${lessonType}`;
				}
			});
		});

		onSave(manuallySelected);
		onClose();
	}

	function handleCancel() {
		localExcluded = [...manuallyExcludedSubjects];
		onClose();
	}

	$: availableSubjects = subjectsWithTypes;

	$: totalExcluded = localExcluded.length;
</script>

<BottomModal
	{isOpen}
	title="Исключить занятия вручную"
	subtitle="Выберите какие занятия не нужно включать в уведомления"
	onClose={handleCancel}
>
	{#if availableSubjects.length > 0}
		<div class="mb-3 flex flex-wrap gap-3 rounded-lg bg-slate-800 p-3 text-xs">
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-green-400"></div>
				<span class="text-gray-300">Все включено</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-orange-400"></div>
				<span class="text-gray-300">Частично</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 rounded-full bg-red-400"></div>
				<span class="text-gray-300">Всё скрыто</span>
			</div>
		</div>

		<div class="space-y-2">
			{#each availableSubjects as subject}
				{#key localExcluded}
					{@const excludedCount = getExcludedTypesCount(subject.name)}
					{@const allExcluded =
						excludedCount > 0 && excludedCount === subject.types.length}
					{@const partiallyExcluded = excludedCount > 0 && !allExcluded}
					{@const nothingExcluded = excludedCount === 0}
					{@const isOpen = openSubjectMenus.has(subject.name)}
					{@const isAutoHidden = hiddenSubjects.some((h: any) => {
						if (typeof h === 'string') {
							return h.startsWith(`${subject.name}|`);
						} else {
							return (h.lessonname || h.lessonName) === subject.name;
						}
					})}

					<div
						class="rounded-lg transition-all {allExcluded
							? 'bg-red-600/20 ring-2 ring-red-500'
							: partiallyExcluded
								? 'bg-orange-600/20 ring-2 ring-orange-500'
								: nothingExcluded
									? 'bg-green-600/10 ring-2 ring-green-500/50'
									: 'bg-slate-600'}"
					>
						<button
							type="button"
							on:click={() => toggleSubjectMenu(subject.name)}
							class="flex w-full items-center justify-between rounded-lg p-3 transition-all hover:opacity-80"
						>
							<div class="flex flex-1 items-center gap-2">
								{#if allExcluded}
									<svg
										class="h-5 w-5 flex-shrink-0 text-red-400"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else if partiallyExcluded}
									<svg
										class="h-5 w-5 flex-shrink-0 text-orange-400"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
											clip-rule="evenodd"
										/>
									</svg>
								{:else}
									<svg
										class="h-5 w-5 flex-shrink-0 text-green-400"
										fill="currentColor"
										viewBox="0 0 20 20"
									>
										<path
											fill-rule="evenodd"
											d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}

								<div class="flex flex-col gap-0.5">
									<span class="text-left text-sm font-medium text-white">
										{subject.name}
									</span>
								</div>
							</div>
							<svg
								class="h-5 w-5 flex-shrink-0 text-gray-400 transition-transform {isOpen
									? 'rotate-180'
									: ''}"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if isOpen}
							<div class="border-t border-slate-500 p-3">
								{#if subject.types.length > 1}
									<button
										type="button"
										on:click={() =>
											toggleAllTypesForSubject(subject.name, subject.types)}
										class="mb-2 w-full rounded-lg bg-slate-600 px-4 py-2 text-sm text-white transition-all hover:bg-slate-500"
									>
										{allExcluded ? 'Включить все' : 'Исключить все'}
									</button>
								{/if}

								<div class="space-y-1.5">
									{#each subject.types as type}
										{@const key = `${subject.name}|${type}`}
										{@const isExcluded = localExcluded.includes(key)}

										<button
											type="button"
											on:click={() =>
												toggleLessonTypeExclusion(subject.name, type)}
											class="flex w-full items-center justify-between rounded-lg p-2.5 text-left transition-all {isExcluded
												? 'bg-red-600/30 ring-1 ring-red-500'
												: 'bg-slate-600 hover:bg-slate-500'}"
										>
											<span class="text-sm text-white">
												{LessonTypes[type] || `Тип ${type}`}
											</span>
											<div
												class="flex h-5 w-5 items-center justify-center rounded transition-all {isExcluded
													? 'bg-red-600'
													: 'bg-slate-400'}"
											>
												{#if isExcluded}
													<svg
														class="h-3 w-3 text-white"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="3"
															d="M5 13l4 4L19 7"
														/>
													</svg>
												{/if}
											</div>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/key}
			{/each}
		</div>
	{:else}
		<div class="py-8 text-center">
			<p class="text-gray-400">Нет доступных предметов</p>
		</div>
	{/if}

	<div slot="footer">
		<div class="flex flex-col gap-2">
			{#if totalExcluded > 0}
				<div class="rounded-lg bg-orange-600/20 p-3 text-center">
					<p class="text-sm text-orange-300">
						Исключено: <span class="font-medium">{totalExcluded}</span> типов занятий
					</p>
				</div>
			{/if}

			<div class="flex gap-2">
				<button
					type="button"
					on:click={handleCancel}
					class="flex-1 rounded-lg bg-slate-600 px-4 py-3 text-white transition-all hover:bg-slate-500"
				>
					Отмена
				</button>
				<button
					type="button"
					on:click={handleSave}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700"
				>
					Применить
				</button>
			</div>
		</div>
	</div>
</BottomModal>
