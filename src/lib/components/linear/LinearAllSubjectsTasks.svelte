<script lang="ts">
	import { onMount } from 'svelte';
	import {
		linearStore,
		type LinearTask,
		type LinearState,
		LINEAR_PRIORITIES,
		updateLinearTask,
		deleteLinearTask,
		getAllTasks
	} from '$lib/stores/linear';
	import { notifications } from '$lib/stores/notifications';
	import LinearDatePicker from './LinearDatePicker.svelte';
	import LinearPriorityPicker from './LinearPriorityPicker.svelte';
	import LinearStatePicker from './LinearStatePicker.svelte';
	import { quintOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	interface SubjectGroup {
		name: string;
		activeTasks: LinearTask[];
		completedTasks: LinearTask[];
		showCompleted: boolean;
	}

	let subjectGroups: Record<string, SubjectGroup> = {};
	let isLoading = false;
	let isDatePickerOpen = false;
	let isPriorityPickerOpen = false;
	let isStatePickerOpen = false;
	let activeTask: LinearTask | null = null;

	function getStateColor(state: LinearState | null): string {
		if (!state) return '';
		const name = state.name.toLowerCase();

		if (name.includes('todo') || name.includes('to do')) {
			return 'bg-blue-500/20 text-blue-400';
		}
		if (name.includes('progress') || name.includes('doing') || name.includes('in progress')) {
			return 'bg-yellow-500/20 text-yellow-400';
		}
		if (name.includes('done') || name.includes('complete') || name.includes('completed')) {
			return 'bg-indigo-500/20 text-indigo-400';
		}
		if (name.includes('cancel') || name.includes('cancelled')) {
			return 'bg-red-500/20 text-red-400';
		}
		if (name.includes('backlog')) {
			return 'bg-gray-500/20 text-gray-400';
		}

		return 'bg-gray-500/20 text-gray-400';
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

	function extractSubjectFromLabel(task: LinearTask): string | null {
		if (!task.labels?.nodes) return null;
		const subjectLabel = task.labels.nodes.find((label) => label.name.startsWith('subject:'));
		if (!subjectLabel) return null;
		return subjectLabel.name.replace('subject:', '');
	}

	function isTaskCompleted(task: LinearTask): boolean {
		const stateName = task.state.name.toLowerCase();
		return stateName.includes('done') || stateName.includes('complete');
	}

	async function loadAllTasks() {
		if (!$linearStore.apiKey) return;

		isLoading = true;
		try {
			const tasks = await getAllTasks($linearStore.apiKey);
			const groups: Record<string, SubjectGroup> = {};

			tasks.forEach((task) => {
				const subject = extractSubjectFromLabel(task);
				if (!subject) return;

				if (!groups[subject]) {
					groups[subject] = {
						name: subject,
						activeTasks: [],
						completedTasks: [],
						showCompleted: false
					};
				}

				if (isTaskCompleted(task)) {
					groups[subject].completedTasks.push(task);
				} else {
					groups[subject].activeTasks.push(task);
				}
			});

			subjectGroups = groups;
		} catch (error) {
			notifications.add('Ошибка при загрузке задач', 'error');
		} finally {
			isLoading = false;
		}
	}

	function toggleCompletedForSubject(subject: string) {
		subjectGroups = {
			...subjectGroups,
			[subject]: {
				...subjectGroups[subject],
				showCompleted: !subjectGroups[subject].showCompleted
			}
		};
	}

	async function handleUpdateTaskState(task: LinearTask, newState: LinearState) {
		try {
			await updateLinearTask($linearStore.apiKey!, task.id, {
				state: newState,
				teamId: task.teamId
			});
			await loadAllTasks();
			notifications.add('Статус задачи обновлен', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении статуса', 'error');
		}
	}

	async function handleUpdateTaskPriority(task: LinearTask, newPriority: number) {
		try {
			await updateLinearTask($linearStore.apiKey!, task.id, {
				...task,
				priority: newPriority
			});
			await loadAllTasks();
			notifications.add('Приоритет задачи обновлен', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении приоритета', 'error');
		}
	}

	async function handleUpdateTaskDueDate(task: LinearTask, newDueDate: string | undefined) {
		try {
			await updateLinearTask($linearStore.apiKey!, task.id, {
				...task,
				dueDate: newDueDate || null
			});
			await loadAllTasks();
			notifications.add('Дата окончания обновлена', 'success');
		} catch (error) {
			notifications.add('Ошибка при обновлении даты', 'error');
		}
	}

	async function handleDeleteTask(taskId: string) {
		try {
			await deleteLinearTask($linearStore.apiKey!, taskId);
			await loadAllTasks();
			notifications.add('Задача удалена', 'success');
		} catch (error) {
			notifications.add('Ошибка при удалении задачи', 'error');
		}
	}

	onMount(() => {
		if ($linearStore.apiKey) {
			loadAllTasks();
		}
	});
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="text-center text-gray-400">Загрузка задач...</div>
	{:else if Object.values(subjectGroups).filter((s) => s.activeTasks.length > 0).length === 0}
		<div class="text-center text-gray-400">Нет активных задач по предметам</div>
	{:else}
		{#each Object.values(subjectGroups).filter((s) => s.activeTasks.length > 0) as subject}
			<div class="rounded-lg bg-slate-900 p-4">
				<h3 class="mb-3 text-lg font-semibold text-white capitalize">{subject.name}</h3>

				{#if subject.activeTasks.length > 0 || subject.completedTasks.length > 0}
					<div class="space-y-2">
						{#each subject.activeTasks as task}
							<div
								class="flex items-center justify-between rounded-lg bg-slate-800 p-3"
							>
								<div class="flex-grow">
									<div class="mr-2 mb-1 flex items-center gap-2">
										<span class="text-sm text-white">{task.title}</span>
									</div>
									<div class="mr-2 flex items-center gap-2">
										<button
											class="rounded px-2 py-0.5 text-xs {getStateColor(
												task.state
											)}"
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

					{#if subject.completedTasks.length > 0}
						<div class="relative mt-4 rounded-lg bg-slate-800/60 p-3">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg
										class="h-5 w-5 text-green-400"
										fill="currentColor"
										viewBox="0 0 14 14"
									>
										<path
											fill-rule="evenodd"
											clip-rule="evenodd"
											d="M7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0ZM11.101 5.10104C11.433 4.76909 11.433 4.23091 11.101 3.89896C10.7691 3.56701 10.2309 3.56701 9.89896 3.89896L5.5 8.29792L4.10104 6.89896C3.7691 6.56701 3.2309 6.56701 2.89896 6.89896C2.56701 7.2309 2.56701 7.7691 2.89896 8.10104L4.89896 10.101C5.2309 10.433 5.7691 10.433 6.10104 10.101L11.101 5.10104Z"
										/>
									</svg>
									<span class="text-green-400"
										>Завершенные ({subject.completedTasks.length})</span
									>
								</div>
								<button
									on:click|stopPropagation={() =>
										toggleCompletedForSubject(subject.name)}
									class="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1 text-sm text-white transition-all hover:bg-slate-600"
								>
									{subject.showCompleted ? 'Скрыть' : 'Открыть'}
									<svg
										class="h-4 w-4 transition-transform duration-200 {subject.showCompleted
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
							</div>

							{#if subject.showCompleted}
								<div
									transition:scale={{
										duration: 200,
										opacity: 0,
										start: 0.95,
										easing: quintOut
									}}
								>
									<div class="mt-4 space-y-2">
										{#each subject.completedTasks as task}
											<div
												class="flex items-center justify-between rounded-lg bg-slate-800 p-3"
											>
												<div class="flex-grow">
													<div class="mr-2 mb-1 flex items-center gap-2">
														<span class="text-sm text-white"
															>{task.title}</span
														>
													</div>
													<div class="mr-2 flex items-center gap-2">
														<button
															class="rounded px-2 py-0.5 text-xs {getStateColor(
																task.state
															)}"
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
															{@html getPriorityInfo(task.priority)
																.icon}
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
								</div>
							{/if}
						</div>
					{/if}
				{:else}
					<div class="text-center text-sm text-gray-400">Нет задач</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<LinearDatePicker
	isOpen={isDatePickerOpen}
	onClose={() => (isDatePickerOpen = false)}
	onSelect={(newDate) => {
		if (activeTask) {
			handleUpdateTaskDueDate(activeTask, newDate);
		}
	}}
	currentDate={activeTask?.dueDate ?? undefined}
	lesson={null}
	scheduleData={null}
	baseDate={new Date().toISOString().split('T')[0]}
	teacherSubgroups={{}}
/>

<LinearPriorityPicker
	isOpen={isPriorityPickerOpen}
	onClose={() => (isPriorityPickerOpen = false)}
	onSelect={(newPriority) => {
		if (activeTask) {
			handleUpdateTaskPriority(activeTask, newPriority);
		}
	}}
	currentPriority={activeTask?.priority || 0}
/>

<LinearStatePicker
	isOpen={isStatePickerOpen}
	onClose={() => (isStatePickerOpen = false)}
	onSelect={(newState) => {
		if (activeTask) {
			handleUpdateTaskState(activeTask, newState);
		}
	}}
	currentState={activeTask?.state || null}
/>
