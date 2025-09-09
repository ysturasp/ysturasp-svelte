<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		linearStore,
		type LinearTask,
		type LinearState,
		type LinearPriority,
		LINEAR_PRIORITIES,
		getLessonKey,
		createLinearTask,
		updateLinearTask,
		deleteLinearTask,
		getAllTasks
	} from '$lib/stores/linear';
	import type { YSTULesson } from '../../../routes/rasp/types';
	import type { ScheduleData } from '../../../routes/rasp/types';
	import { notifications } from '$lib/stores/notifications';
	import LinearDatePicker from './LinearDatePicker.svelte';
	import LinearPriorityPicker from './LinearPriorityPicker.svelte';
	import LinearStatePicker from './LinearStatePicker.svelte';
	import { onMount } from 'svelte';
	import type { TeacherSubgroups } from '../../../routes/rasp/stores/subgroups';

	export let lesson: YSTULesson;
	export let date: string;
	export let scheduleData: ScheduleData | null = null;
	export let teacherSubgroups: TeacherSubgroups = {};

	let newTaskTitle = '';
	let isCreating = false;
	let selectedState: LinearState | null = null;
	let selectedPriority = 0;
	let selectedDueDate: string | undefined = date;

	let isDatePickerOpen = false;
	let isPriorityPickerOpen = false;
	let isStatePickerOpen = false;
	let activeTask: LinearTask | null = null;

	function getStateColor(state: LinearState | null): string {
		if (!state) return '';
		return `bg-${state.color}-500/20 text-${state.color}-400`;
	}

	function getStateIcon(stateName: string | undefined): string {
		if (!stateName) return '';
		const name = stateName.toLowerCase();

		if (name.includes('backlog')) {
			return `<svg class="color-override" width="14" height="14" viewBox="0 0 14 14" fill="#4CAF50" role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.9408 7.91426L11.9576 7.65557C11.9855 7.4419 12 7.22314 12 7C12 6.77686 11.9855 6.5581 11.9576 6.34443L13.9408 6.08573C13.9799 6.38496 14 6.69013 14 7C14 7.30987 13.9799 7.61504 13.9408 7.91426ZM13.4688 4.32049C13.2328 3.7514 12.9239 3.22019 12.5538 2.73851L10.968 3.95716C11.2328 4.30185 11.4533 4.68119 11.6214 5.08659L13.4688 4.32049ZM11.2615 1.4462L10.0428 3.03204C9.69815 2.76716 9.31881 2.54673 8.91341 2.37862L9.67951 0.531163C10.2486 0.767153 10.7798 1.07605 11.2615 1.4462ZM7.91426 0.0591659L7.65557 2.04237C7.4419 2.01449 7.22314 2 7 2C6.77686 2 6.5581 2.01449 6.34443 2.04237L6.08574 0.059166C6.38496 0.0201343 6.69013 0 7 0C7.30987 0 7.61504 0.0201343 7.91426 0.0591659ZM4.32049 0.531164L5.08659 2.37862C4.68119 2.54673 4.30185 2.76716 3.95716 3.03204L2.73851 1.4462C3.22019 1.07605 3.7514 0.767153 4.32049 0.531164ZM1.4462 2.73851L3.03204 3.95716C2.76716 4.30185 2.54673 4.68119 2.37862 5.08659L0.531164 4.32049C0.767153 3.7514 1.07605 3.22019 1.4462 2.73851ZM0.0591659 6.08574C0.0201343 6.38496 0 6.69013 0 7C0 7.30987 0.0201343 7.61504 0.059166 7.91426L2.04237 7.65557C2.01449 7.4419 2 7.22314 2 7C2 6.77686 2.01449 6.5581 2.04237 6.34443L0.0591659 6.08574ZM0.531164 9.67951L2.37862 8.91341C2.54673 9.31881 2.76716 9.69815 3.03204 10.0428L1.4462 11.2615C1.07605 10.7798 0.767153 10.2486 0.531164 9.67951ZM2.73851 12.5538L3.95716 10.968C4.30185 11.2328 4.68119 11.4533 5.08659 11.6214L4.32049 13.4688C3.7514 13.2328 3.22019 12.9239 2.73851 12.5538ZM6.08574 13.9408L6.34443 11.9576C6.5581 11.9855 6.77686 12 7 12C7.22314 12 7.4419 11.9855 7.65557 11.9576L7.91427 13.9408C7.61504 13.9799 7.30987 14 7 14C6.69013 14 6.38496 13.9799 6.08574 13.9408ZM9.67951 13.4688L8.91341 11.6214C9.31881 11.4533 9.69815 11.2328 10.0428 10.968L11.2615 12.5538C10.7798 12.9239 10.2486 13.2328 9.67951 13.4688ZM12.5538 11.2615L10.968 10.0428C11.2328 9.69815 11.4533 9.31881 11.6214 8.91341L13.4688 9.67951C13.2328 10.2486 12.924 10.7798 12.5538 11.2615Z" stroke="none"></path>
            </svg>`;
		}

		if (name.includes('todo') || name.includes('to do')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="12" height="12" rx="6" stroke="#4A9EFF" stroke-width="1.5" fill="none"></rect>
                <path fill="#4A9EFF" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 0 z" transform="translate(3.5,3.5)"></path>
            </svg>`;
		}

		if (name.includes('progress') || name.includes('doing')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="12" height="12" rx="6" stroke="#F2C94C" stroke-width="1.5" fill="none"></rect>
                <path fill="#F2C94C" stroke="none" d="M 3.5,3.5 L3.5,0 A3.5,3.5 0 0,1 3.5, 7 z" transform="translate(3.5,3.5)"></path>
            </svg>`;
		}

		if (name.includes('done') || name.includes('complete')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="#5E6AD2" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM11.101 5.10104C11.433 4.76909 11.433 4.23091 11.101 3.89896C10.7691 3.56701 10.2309 3.56701 9.89896 3.89896L5.5 8.29792L4.10104 6.89896C3.7691 6.56701 3.2309 6.56701 2.89896 6.89896C2.56701 7.2309 2.56701 7.7691 2.89896 8.10104L4.89896 10.101C5.2309 10.433 5.7691 10.433 6.10104 10.101L11.101 5.10104Z"></path>
            </svg>`;
		}

		if (name.includes('cancel')) {
			return `<svg width="14" height="14" viewBox="0 0 14 14" fill="#FF4F4F" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14ZM5.03033 3.96967C4.73744 3.67678 4.26256 3.67678 3.96967 3.96967C3.67678 4.26256 3.67678 4.73744 3.96967 5.03033L5.93934 7L3.96967 8.96967C3.67678 9.26256 3.67678 9.73744 3.96967 10.0303C4.26256 10.3232 4.73744 10.3232 5.03033 10.0303L7 8.06066L8.96967 10.0303C9.26256 10.3232 9.73744 10.3232 10.0303 10.0303C10.3232 9.73744 10.3232 9.26256 10.0303 8.96967L8.06066 7L10.0303 5.03033C10.3232 4.73744 10.3232 4.26256 10.0303 3.96967C9.73744 3.67678 9.26256 3.67678 8.96967 3.96967L7 5.93934L5.03033 3.96967Z" stroke="none"></path>
            </svg>`;
		}

		return `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="12" height="12" rx="6" stroke="#4A9EFF" stroke-width="1.5" fill="none"></rect>
        </svg>`;
	}

	export function hasOpenPopups(): boolean {
		return isDatePickerOpen || isPriorityPickerOpen || isStatePickerOpen;
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (isDatePickerOpen) {
				event.stopPropagation();
				isDatePickerOpen = false;
			} else if (isPriorityPickerOpen) {
				event.stopPropagation();
				isPriorityPickerOpen = false;
			} else if (isStatePickerOpen) {
				event.stopPropagation();
				isStatePickerOpen = false;
			}
		}
	}

	$: lessonKey = getLessonKey(lesson, date);
	$: tasks = $linearStore.tasks[lessonKey] || [];
	$: states = $linearStore.states;

	async function handleCreateTask() {
		if (!newTaskTitle.trim()) {
			notifications.add('Введите название задачи', 'error');
			return;
		}

		if (!$linearStore.teamId) {
			notifications.add('Ошибка: команда не найдена', 'error');
			return;
		}

		isCreating = true;
		try {
			const task = await createLinearTask(
				$linearStore.apiKey!,
				$linearStore.teamId,
				newTaskTitle,
				`Преподаватель: ${lesson.teacherName}\nДата: ${date}`,
				selectedState?.id,
				selectedPriority,
				selectedDueDate,
				lesson.lessonName || undefined,
				!lesson.lessonName ? lesson.teacherName : undefined
			);
			newTaskTitle = '';
			selectedState = null;
			selectedPriority = 0;
			selectedDueDate = date;
			await updateRelatedIssues();
			notifications.add('Задача создана', 'success');
		} catch (error) {
			notifications.add('Ошибка при создании задачи', 'error');
		} finally {
			isCreating = false;
		}
	}

	async function handleUpdateTaskState(task: LinearTask, newState: LinearState) {
		try {
			const updatedTask = await updateLinearTask($linearStore.apiKey!, task.id, {
				state: newState,
				teamId: task.teamId
			});
			linearStore.removeTask(lessonKey, task.id);
			linearStore.addTask(lessonKey, updatedTask);
			notifications.add('Статус задачи обновлен', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении статуса', 'error');
		}
	}

	async function handleUpdateTaskPriority(task: LinearTask, newPriority: number) {
		try {
			const updatedTask = await updateLinearTask($linearStore.apiKey!, task.id, {
				...task,
				priority: newPriority
			});
			linearStore.removeTask(lessonKey, task.id);
			linearStore.addTask(lessonKey, updatedTask);
			notifications.add('Приоритет задачи обновлен', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении приоритета', 'error');
		}
	}

	async function handleUpdateTaskDueDate(task: LinearTask, newDueDate: string | undefined) {
		try {
			const updatedTask = await updateLinearTask($linearStore.apiKey!, task.id, {
				...task,
				dueDate: newDueDate || null
			});
			linearStore.removeTask(lessonKey, task.id);
			linearStore.addTask(lessonKey, updatedTask);
			notifications.add('Дата окончания обновлена', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении даты', 'error');
		}
	}

	async function handleDeleteTask(taskId: string) {
		try {
			await deleteLinearTask($linearStore.apiKey!, taskId);
			linearStore.removeTask(lessonKey, taskId);
			notifications.add('Задача удалена', 'success');
		} catch (error) {
			notifications.add('Ошибка при удалении задачи', 'error');
		}
	}

	function getPriorityInfo(priority: number) {
		return LINEAR_PRIORITIES.find((p) => p.id === priority) || LINEAR_PRIORITIES[0];
	}

	function getPriorityColor(priorityId: number): string {
		switch (priorityId) {
			case 0:
				return 'text-gray-400';
			case 1:
				return 'text-red-500';
			case 2:
				return 'text-orange-500';
			case 3:
				return 'text-yellow-500';
			case 4:
				return 'text-gray-400';
			default:
				return 'text-gray-400';
		}
	}

	function formatDueDate(dateStr: string | undefined | null): string {
		if (!dateStr) return 'Без срока';
		const date = new Date(dateStr);
		const now = new Date();

		const months = [
			'янв',
			'фев',
			'марта',
			'апр',
			'мая',
			'июня',
			'июля',
			'авг',
			'сент',
			'окт',
			'нояб',
			'дек'
		];

		const day = date.getDate();
		const month = months[date.getMonth()];
		const year = date.getFullYear();

		if (now.getFullYear() === year) {
			return `${day} ${month}`;
		}

		return `${day} ${month} ${year}`;
	}

	async function updateRelatedIssues() {
		try {
			const tasks = await getAllTasks($linearStore.apiKey!);
			const labelName = lesson.lessonName
				? `subject:${lesson.lessonName.toLowerCase().trim()}`
				: `subject:без названия ${lesson.teacherName.toLowerCase().trim()}`;

			const subjectTasks = tasks.filter((task) => {
				return task.labels?.nodes?.some((label) => label.name === labelName);
			});

			linearStore.clearTasks(lessonKey);

			subjectTasks.forEach((task) => linearStore.addTask(lessonKey, task));
		} catch (error) {
			notifications.add('Ошибка при обновлении списка задач', 'error');
		}
	}

	onMount(() => {
		if ($linearStore.apiKey) {
			updateRelatedIssues();

			const todoState = $linearStore.states.find((s) => s.name.toLowerCase() === 'todo');
			if (todoState) {
				selectedState = todoState;
			}

			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			selectedDueDate = tomorrow.toISOString().split('T')[0];
			selectedPriority = 0;
		}
	});
</script>

<svelte:window on:keydown={handleGlobalKeydown} />

<div class="space-y-4">
	<form on:submit|preventDefault={handleCreateTask} class="space-y-2">
		<input
			type="text"
			bind:value={newTaskTitle}
			placeholder="Название новой задачи"
			class="w-full rounded-lg bg-slate-700 p-2 text-white placeholder:text-gray-400"
		/>

		<div class="flex gap-2">
			<button
				type="button"
				class="flex-1 rounded-lg bg-slate-700 p-2 text-white transition-all hover:bg-slate-600"
				on:click={() => {
					activeTask = null;
					isStatePickerOpen = true;
				}}
			>
				<div class="flex items-center justify-center gap-2">
					<div
						class="flex h-4 w-4 items-center justify-center {getStateColor(
							selectedState
						)}"
					>
						{@html getStateIcon(selectedState?.name)}
					</div>
					<span>{selectedState?.name || 'Статус'}</span>
				</div>
			</button>

			<button
				type="button"
				class="flex-1 rounded-lg bg-slate-700 p-2 text-white transition-all hover:bg-slate-600"
				on:click={() => {
					activeTask = null;
					isPriorityPickerOpen = true;
				}}
			>
				<div class="flex items-center justify-center gap-2">
					<div
						class="flex h-4 w-4 items-center justify-center {getPriorityColor(
							selectedPriority
						)}"
					>
						{@html getPriorityInfo(selectedPriority).icon}
					</div>
					<span>{getPriorityInfo(selectedPriority).name}</span>
				</div>
			</button>

			<button
				type="button"
				class="flex-1 rounded-lg bg-slate-700 p-2 text-white transition-all hover:bg-slate-600"
				on:click={() => {
					activeTask = null;
					isDatePickerOpen = true;
				}}
			>
				<div class="flex items-center justify-center gap-2">
					<div class="flex h-4 w-4 items-center justify-center text-emerald-400">
						<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"
							><path
								d="M11 1C13.2091 1 15 2.79086 15 5V11C15 13.2091 13.2091 15 11 15H5C2.79086 15 1 13.2091 1 11V5C1 2.79086 2.79086 1 5 1H11ZM13.5 6H2.5V11C2.5 12.3807 3.61929 13.5 5 13.5H11C12.3807 13.5 13.5 12.3807 13.5 11V6Z"
							></path></svg
						>
					</div>
					<span class="whitespace-nowrap">{formatDueDate(selectedDueDate)}</span>
				</div>
			</button>
		</div>

		<button
			type="submit"
			class="w-full rounded-lg bg-blue-600 p-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
			disabled={isCreating}
		>
			{isCreating ? 'Создание...' : 'Создать задачу'}
		</button>
	</form>

	{#if tasks.length > 0}
		<div class="space-y-2">
			{#each tasks as task}
				<div class="flex items-center justify-between rounded-lg bg-slate-700 p-3">
					<div class="flex-grow">
						<div class="mr-2 flex items-center gap-2">
							<span class="text-sm text-white">{task.title}</span>
							<button
								class="rounded px-2 py-0.5 text-xs {getStateColor(task.state)}"
								on:click={() => {
									activeTask = task;
									isStatePickerOpen = true;
								}}
							>
								{task.state.name}
							</button>
							<button
								class="flex h-6 w-6 items-center justify-center text-sm {getPriorityColor(
									task.priority
								)}"
								on:click={() => {
									activeTask = task;
									isPriorityPickerOpen = true;
								}}
							>
								{@html getPriorityInfo(task.priority).icon}
							</button>
							<button
								class="text-xs whitespace-nowrap text-gray-400"
								on:click={() => {
									activeTask = task;
									isDatePickerOpen = true;
								}}
							>
								{formatDueDate(task.dueDate)}
							</button>
						</div>
					</div>
					<button
						on:click={() => handleDeleteTask(task.id)}
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white transition-all hover:bg-red-700"
						aria-label="Удалить задачу"
					>
						<svg
							class="h-4 w-4"
							viewBox="0 0 16 16"
							fill="currentColor"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"
							/>
							<path
								fill-rule="evenodd"
								d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"
							/>
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center text-sm text-gray-400">Нет задач для этого предмета</div>
	{/if}
</div>

<LinearDatePicker
	isOpen={isDatePickerOpen}
	onClose={() => (isDatePickerOpen = false)}
	onSelect={(newDate) => {
		if (activeTask) {
			handleUpdateTaskDueDate(activeTask, newDate);
		} else {
			selectedDueDate = newDate;
		}
	}}
	currentDate={activeTask?.dueDate || selectedDueDate}
	{lesson}
	{scheduleData}
	baseDate={date}
	{teacherSubgroups}
/>

<LinearPriorityPicker
	isOpen={isPriorityPickerOpen}
	onClose={() => (isPriorityPickerOpen = false)}
	onSelect={(newPriority) => {
		if (activeTask) {
			handleUpdateTaskPriority(activeTask, newPriority);
		} else {
			selectedPriority = newPriority;
		}
	}}
	currentPriority={activeTask?.priority || selectedPriority}
/>

<LinearStatePicker
	isOpen={isStatePickerOpen}
	onClose={() => (isStatePickerOpen = false)}
	onSelect={(newState) => {
		if (activeTask) {
			handleUpdateTaskState(activeTask, newState);
		} else {
			selectedState = newState;
		}
	}}
	currentState={activeTask?.state || selectedState}
/>
