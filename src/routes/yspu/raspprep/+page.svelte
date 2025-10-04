<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ScheduleLoadingSkeleton from '$lib/components/loading/ScheduleLoadingSkeleton.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import TeacherScheduleForm from './components/TeacherScheduleForm.svelte';
	import TeacherScheduleDay from './components/TeacherScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { getTeachers, getTeacherSchedule } from './api';
	import type { Teacher } from './api';
	import GithubParserInfo from '../rasp/components/GithubParserInfo.svelte';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/stores/settings';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

	const isMobile = writable(false);

	interface TeacherScheduleData {
		items: {
			courseInfo: {
				name: string;
				number: string;
				startDate?: string;
			};
			days: {
				info: {
					type: number;
				};
				lessons: {
					number: number;
					lessonName: string;
					type: 'lecture' | 'practice' | 'other';
					timeRange: string;
					startAt: string;
					endAt: string;
					auditoryName: string;
					isDistant: boolean;
					isStream: boolean;
					isDivision: boolean;
					groups: string;
					direction: string;
					additionalSlots?: {
						startAt: string;
						endAt: string;
					}[];
					originalTimeTitle?: string;
				}[];
			}[];
		}[];
	}

	let isLoading = false;
	let isScheduleLoading = false;
	let teachers: Teacher[] = [];
	let selectedTeacher = '';
	let scheduleData: TeacherScheduleData | null = null;
	let isFullView = false;
	let selectedDay = 0;
	let isViewChanging = false;

	const days = [
		'Понедельник',
		'Вторник',
		'Среда',
		'Четверг',
		'Пятница',
		'Суббота',
		'Воскресенье'
	];

	onMount(() => {
		const checkMobile = () => {
			isMobile.set(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		isFullView = localStorage.getItem('isFullViewYspuTeacher') === 'true';
		selectedDay = parseInt(localStorage.getItem('lastSelectedDayYspuTeacher') || '0', 10);

		const loadData = async () => {
			try {
				isLoading = true;
				teachers = await getTeachers();

				const urlParams = new URLSearchParams(window.location.search);
				const teacherFromURL = urlParams.get('teacher');
				if (teacherFromURL) {
					const teacher = teachers.find((t) => t.name === teacherFromURL);
					if (teacher) {
						selectedTeacher = teacherFromURL;
						await loadSchedule();
					} else {
						notifications.add('Преподаватель не найден', 'error');
					}
				} else {
					const lastTeacher = localStorage.getItem('lastYspuTeacher');
					if (lastTeacher) {
						const teacher = teachers.find((t) => t.name === lastTeacher);
						if (teacher) {
							selectedTeacher = lastTeacher;
							await loadSchedule();
						}
					}
				}
			} catch (error) {
				console.error('Error loading teachers:', error);
				notifications.add('Ошибка при загрузке списка преподавателей', 'error');
			} finally {
				isLoading = false;
			}
		};

		loadData();

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	async function loadSchedule() {
		const teacher = teachers.find((t) => t.name === selectedTeacher);
		if (!teacher) return;

		try {
			isScheduleLoading = true;

			const params = new URLSearchParams(window.location.search);
			if (selectedTeacher) {
				params.set('teacher', selectedTeacher);
			} else {
				params.delete('teacher');
			}
			replaceState(`${window.location.pathname}?${params}`, {});

			scheduleData = await getTeacherSchedule(teacher.id);
			localStorage.setItem('lastYspuTeacher', selectedTeacher);
		} catch (error) {
			if (error instanceof Response && error.status === 429) {
				notifications.add('Превышено количество запросов. Попробуйте позже.', 'error');
				return;
			}
			console.error('Error loading schedule:', error);
			notifications.add('Ошибка при загрузке расписания', 'error');
		} finally {
			isScheduleLoading = false;
		}
	}

	function handleViewChange() {
		isViewChanging = true;
		localStorage.setItem('isFullViewYspuTeacher', isFullView.toString());
		if (!isFullView && daysWithLessons.length > 0) {
			selectedDay = daysWithLessons[0];
			localStorage.setItem('lastSelectedDayYspuTeacher', selectedDay.toString());
		} else {
			localStorage.removeItem('lastSelectedDayYspuTeacher');
		}
		setTimeout(() => {
			isViewChanging = false;
		}, 500);
	}

	function getDayName(dayIndex: number): string {
		const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
		return days[dayIndex];
	}

	function isToday(dayIndex: number): boolean {
		const today = new Date();
		const currentDay = today.getDay();
		const normalizedCurrentDay = currentDay === 0 ? 6 : currentDay - 1;
		return normalizedCurrentDay === dayIndex;
	}

	$: teacherInfo = selectedTeacher ? teachers.find((t) => t.name === selectedTeacher) : null;
	$: teacherName = teacherInfo?.name || selectedTeacher;

	$: daysWithLessons = scheduleData?.items?.[0]?.days
		? (days
				.map((_, dayIndex) => {
					const dayLessons = scheduleData!.items[0].days
						.filter((d) => d.info.type === dayIndex)
						.flatMap((d) => d.lessons);
					return dayLessons.length > 0 ? dayIndex : null;
				})
				.filter((day) => day !== null) as number[])
		: [];

	$: {
		if ($isMobile && !isFullView && daysWithLessons.length > 0) {
			if (!daysWithLessons.includes(selectedDay)) {
				selectedDay = daysWithLessons[0];
				localStorage.setItem('lastSelectedDayYspuTeacher', selectedDay.toString());
			}
		}
	}
</script>

<svelte:head>
	<title>
		{selectedTeacher
			? `Расписание преподавателя ${teacherName} ФСУ ЯГПУ`
			: 'Расписание преподавателей ФСУ ЯГПУ | Поиск по преподавателям'}
	</title>
	<meta
		name="description"
		content={selectedTeacher
			? `Актуальное расписание занятий преподавателя ${teacherName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий преподавателей факультета социального управления ЯГПУ. Удобный поиск расписания по преподавателям, просмотр лекций, практик и семинаров'}
	/>
	<meta
		name="keywords"
		content={`расписание преподавателей ЯГПУ, ${
			selectedTeacher ? `расписание ${teacherName}, преподаватель ${teacherName}, ` : ''
		}ягпу им ушинского, ФСУ ЯГПУ, факультет социального управления, расписание занятий ЯГПУ, ягпу расписание преподавателей, расписание пар преподавателей ФСУ`}
	/>

	<meta
		property="og:title"
		content={selectedTeacher
			? `Расписание преподавателя ${teacherName} ФСУ ЯГПУ`
			: 'Расписание преподавателей ФСУ ЯГПУ | Поиск по преподавателям'}
	/>
	<meta
		property="og:description"
		content={selectedTeacher
			? `Актуальное расписание занятий преподавателя ${teacherName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий преподавателей факультета социального управления ЯГПУ. Удобный поиск расписания по преподавателям, просмотр лекций, практик и семинаров'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedTeacher}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`https://ysturasp.netlify.app/yspu/raspprep?teacher=${encodeURIComponent(selectedTeacher)}`}
		/>
	{/if}
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="yspu"
			pageType="teachers"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="yspu"
			pageType="teachers"
		/>
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="relative mb-2 rounded-2xl bg-amber-500 p-4 text-center text-black">
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-4xl font-semibold text-white">👨‍🏫</h2>
				<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
					Расписание преподавателей
				</h2>
			</div>

			<TeacherScheduleForm
				{teachers}
				bind:selectedTeacher
				onSubmit={loadSchedule}
				{isLoading}
			/>

			{#if scheduleData && !isScheduleLoading}
				<div class="mt-2">
					{#if scheduleData.items.length > 0}
						<ScheduleTitle
							type="teacher"
							title={scheduleData.items[0].courseInfo.name}
							subtitle={scheduleData.items[0].courseInfo.startDate
								? `Начало обучения с ${scheduleData.items[0].courseInfo.startDate}`
								: undefined}
						/>

						{#if $isMobile}
							<div class="my-2 flex items-center justify-end">
								<span class="mr-2 text-white">По дням</span>
								<label class="switch flex items-center">
									<input
										type="checkbox"
										bind:checked={isFullView}
										on:change={handleViewChange}
									/>
									<span class="slider round"></span>
								</label>
								<span class="ml-2 text-white">На неделю</span>
							</div>
						{/if}

						{#if $isMobile}
							<div class="relative">
								{#if !isFullView}
									<div
										class="w-full"
										in:fade={{ duration: 500, easing: quintOut }}
										out:fade={{ duration: 500, easing: quintOut }}
									>
										<div
											class="mb-2 grid gap-1"
											style="grid-template-columns: repeat({daysWithLessons.length}, 1fr)"
										>
											{#each daysWithLessons as dayIndex}
												<button
													class="day-button flex flex-col items-center rounded-lg p-2 transition-all {dayIndex ===
													selectedDay
														? 'bg-blue-600'
														: 'bg-gray-700'} {isToday(dayIndex)
														? 'border-2 border-blue-300'
														: ''}"
													on:click={() => {
														selectedDay = dayIndex;
														localStorage.setItem(
															'lastSelectedDayYspuTeacher',
															selectedDay.toString()
														);
													}}
												>
													<span class="text-sm"
														>{getDayName(dayIndex)}</span
													>
													<span class="text-lg font-bold"
														>{dayIndex + 1}</span
													>
												</button>
											{/each}
										</div>

										{#if scheduleData.items[0].days
											.filter((d) => d.info.type === selectedDay)
											.flatMap((d) => d.lessons).length > 0}
											{@const selectedDayLessons = scheduleData.items[0].days
												.filter((d) => d.info.type === selectedDay)
												.flatMap((d) => d.lessons)}
											<TeacherScheduleDay
												dayName={days[selectedDay]}
												lessons={selectedDayLessons}
											/>
										{/if}
									</div>
								{:else}
									<div
										class="w-full"
										in:fade={{ duration: 500, easing: quintOut }}
										out:fade={{ duration: 500, easing: quintOut }}
									>
										{#each days as day, dayIndex}
											{@const dayLessons = scheduleData.items[0].days
												.filter((d) => d.info.type === dayIndex)
												.flatMap((d) => d.lessons)}
											{#if dayLessons.length > 0}
												<TeacherScheduleDay
													dayName={day}
													lessons={dayLessons}
												/>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							{#each days as day, dayIndex}
								{@const dayLessons = scheduleData.items[0].days
									.filter(
										(d: { info: { type: number } }) => d.info.type === dayIndex
									)
									.flatMap((d: { lessons: any[] }) => d.lessons)}
								{#if dayLessons.length > 0}
									<TeacherScheduleDay dayName={day} lessons={dayLessons} />
								{/if}
							{/each}
						{/if}
					{:else}
						<div class="p-4 text-center text-xl text-white">
							У преподавателя нет занятий
						</div>
					{/if}
				</div>
			{:else if isScheduleLoading && selectedTeacher}
				<div class="mt-2">
					<ScheduleLoadingSkeleton
						{isFullView}
						isMobile={$isMobile}
						daysCount={daysWithLessons.length || 7}
						showWeekSwitcher={false}
					/>
				</div>
			{/if}
		</section>

		{#if currentSettings.showAPILink}
			<GithubParserInfo />
		{/if}
	</main>

	<Footer class_name="pb-28 md:pb-18" />
	<NotificationsContainer />
</PageLayout>

<ScheduleSwitcher
	selectedSemester={null}
	onSemesterChange={() => {}}
	currentPage="teachers"
	university="yspu"
/>

<style>
	:global(.grid) {
		transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1);
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

	@media (max-width: 768px) {
		.day-button {
			transition: all 0.3s ease;
		}

		.day-button:active {
			transform: scale(0.95);
		}
	}

	:global(.ambient-overlay) {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(30, 30, 30, 0.7);
		z-index: 9998;
		backdrop-filter: blur(1px);
		-webkit-backdrop-filter: blur(1px);
		pointer-events: none;
		transition:
			backdrop-filter 0.6s ease-in-out,
			background 0.6s ease-in-out;
	}

	:global(.ambient-focuss) {
		position: relative;
		background: rgba(1, 21, 51, 0.931);
		box-shadow: 0 0 200px rgb(0, 57, 117);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: 9999;
	}

	:global(.ambient-focus) {
		background: rgba(1, 21, 51, 0.931);
		box-shadow: 0 0 200px rgb(0, 57, 117);
		backdrop-filter: blur(15px);
		-webkit-backdrop-filter: blur(15px);
		z-index: 9999;
		transition:
			box-shadow 0.6s ease-in-out,
			backdrop-filter 0.6s ease-in-out;
	}
</style>
