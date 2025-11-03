<script lang="ts">
	import { onMount } from 'svelte';
	import { getDirections, getSchedule } from './api';
	import type {
		Direction,
		ScheduleData,
		Lesson,
		Course,
		ScheduleItem
	} from '$lib/types/schedule';
	import { notifications } from '$lib/stores/notifications';
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import ScheduleLoadingSkeleton from '$lib/components/loading/ScheduleLoadingSkeleton.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import SelectScheduleForm from './components/SelectScheduleForm.svelte';
	import ViewModeToggle from './components/ViewModeToggle.svelte';
	import ScheduleDay from '$lib/components/schedule/ScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import BetaModal from '$lib/components/ui/BottomModal.svelte';
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import GithubParserInfo from './components/GithubParserInfo.svelte';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import { page } from '$app/stores';
	import type { Settings } from '$lib/stores/settings';
	import type { SemesterInfo } from '$lib/utils/semester';
	import { getCurrentWeek, getCurrentWeekMessage } from '$lib/utils/semester';
	import LinearIntegrationModal from '$lib/components/linear/LinearIntegrationModal.svelte';
	import type { YSTULesson } from '../../rasp/types';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

	const isMobile = writable(false);

	let isLoading = false;
	let isScheduleLoading = false;
	let isBetaModalOpen = false;
	let isViewModeModalOpen = false;
	let directions: Direction[] = [];
	let semesters: SemesterInfo[] = [];
	let schedules: {
		folderId: string;
		timestamp: number | null;
		semester: string | null;
		year: number | null;
		directions: Direction[];
	}[] = [];
	let selectedSemester: SemesterInfo | null = null;
	let selectedDirection = '';
	let selectedGroup = '';
	let scheduleData: ScheduleData | null = null;
	let viewMode: 'all' | 'actual' = 'all';
	let groupNumbersMap: Record<string, string> = {};
	let wasLoadAttempted = false;
	let isFullView = false;
	let selectedDay = 0;
	let isViewChanging = false;

	let isLinearModalOpen = false;
	let selectedLesson: YSTULesson | null = null;
	let selectedLessonDate = '';
	let lastLoadedDirection = '';
	let lastLoadedSemester = '';

	const storage = {
		get: (key: string, defaultValue: string = '') => {
			if (typeof window !== 'undefined') {
				return localStorage.getItem(key) || defaultValue;
			}
			return defaultValue;
		},
		set: (key: string, value: string) => {
			if (typeof window !== 'undefined') {
				localStorage.setItem(key, value);
			}
		}
	};

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

		isFullView = localStorage.getItem('isFullViewYspu') === 'true';
		selectedDay = parseInt(localStorage.getItem('lastSelectedDayYspu') || '0', 10);

		const loadData = async () => {
			try {
				isLoading = true;
				const data = await getDirections();
				schedules = data.schedules || [];
				directions = (schedules[0]?.directions as Direction[]) || [];
				semesters = data.semesters || [];

				const lastSemester = storage.get('lastYspuSemester');
				if (lastSemester && semesters.length > 0) {
					selectedSemester =
						semesters.find((s) => s.folderId === lastSemester) || semesters[0];
				} else {
					selectedSemester = semesters[0] || null;
				}

				const urlParams = new URLSearchParams(window.location.search);
				const urlDirection = urlParams.get('direction');
				const urlGroup = urlParams.get('group');
				const urlSemester = urlParams.get('semester');

				if (urlSemester && semesters.length > 0) {
					const semesterFromUrl = semesters.find((s) => s.folderId === urlSemester);
					if (semesterFromUrl) {
						selectedSemester = semesterFromUrl;
						storage.set('lastYspuSemester', semesterFromUrl.folderId);
					}
				}

				if (urlDirection && urlGroup) {
					selectedDirection = urlDirection;
					selectedGroup = urlGroup;
					await loadSchedule();
				} else {
					const lastDirection = storage.get('lastYspuInstitut');
					const lastGroup = storage.get('lastYspuGroup');

					if (lastDirection) {
						selectedDirection = lastDirection;
						if (lastGroup) {
							selectedGroup = lastGroup;
							await loadSchedule();
						}
					}
				}
			} catch (error) {
				console.error('Error loading initial data:', error);
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
		if (!selectedDirection || !selectedSemester) return;

		const currentDirection = selectedDirection;
		const currentSemester = selectedSemester.folderId;

		if (lastLoadedDirection === currentDirection && lastLoadedSemester === currentSemester) {
			return;
		}

		try {
			isScheduleLoading = true;
			wasLoadAttempted = true;
			lastLoadedDirection = currentDirection;
			lastLoadedSemester = currentSemester;

			const params = new URLSearchParams();
			if (selectedDirection) params.set('direction', selectedDirection);
			if (selectedGroup) params.set('group', selectedGroup);
			if (selectedSemester) params.set('semester', selectedSemester.folderId);
			window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

			const targetSchedule = schedules.find((s) => s.folderId === selectedSemester?.folderId);
			if (!targetSchedule) {
				scheduleData = null;
				groupNumbersMap = {};
				return;
			}

			directions = (targetSchedule.directions as Direction[]) || [];
			scheduleData = await getSchedule(selectedDirection);

			const courses = Object.entries(
				directions.find((d) => d.id === selectedDirection)?.courses || {}
			);
			groupNumbersMap = {};
			scheduleData.items.forEach((item) => {
				const courseIndex = courses.findIndex(([_, course]) =>
					(course as Course).name.includes(item.courseInfo.number)
				);
				if (courseIndex !== -1) {
					groupNumbersMap[courses[courseIndex][0]] = item.courseInfo.number;
				}
			});

			storage.set('lastYspuInstitut', selectedDirection);
			storage.set('lastYspuGroup', selectedGroup);
			storage.set('lastYspuSemester', selectedSemester.folderId);
		} catch (error) {
			console.error('Error loading schedule:', error);
			notifications.add('Ошибка при загрузке расписания', 'error');
		} finally {
			isScheduleLoading = false;
		}
	}

	function handleDirectionChange() {
		selectedGroup = '';
		scheduleData = null;
		groupNumbersMap = {};
		lastLoadedDirection = '';
		lastLoadedSemester = '';

		const params = new URLSearchParams(window.location.search);
		if (selectedDirection) {
			params.set('direction', selectedDirection);
			params.delete('group');
		} else {
			params.delete('direction');
			params.delete('group');
		}
		window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
	}

	function toggleViewMode(mode: 'all' | 'actual') {
		viewMode = mode;
		storage.set('scheduleViewMode', mode);
	}

	function getCurrentWeekType(): 'numerator' | 'denominator' {
		const currentWeek = getCurrentWeek();
		return currentWeek % 2 === 1 ? 'numerator' : 'denominator';
	}

	function isLessonInDate(lesson: Lesson) {
		if (!lesson.startDate && !lesson.endDate && !lesson.weekType) return true;

		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		let isInDate = true;

		if (lesson.startDate || lesson.endDate) {
			if (lesson.startDate && lesson.endDate) {
				const startParts = lesson.startDate.split('.');
				const endParts = lesson.endDate.split('.');
				const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
				const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
				isInDate = today >= startDate && today <= endDate;
			} else if (lesson.startDate) {
				const startParts = lesson.startDate.split('.');
				const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
				isInDate = today >= startDate;
			} else if (lesson.endDate) {
				const endParts = lesson.endDate.split('.');
				const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
				isInDate = today <= endDate;
			}
		}

		if (lesson.weekType) {
			const currentWeekType = getCurrentWeekType();
			return isInDate && lesson.weekType === currentWeekType;
		}

		return isInDate;
	}

	function processLessons(lessons: Lesson[]): Lesson[] {
		const processedLessons: Lesson[] = [];
		const skipLessons = new Set<number>();

		for (let i = 0; i < lessons.length; i++) {
			if (skipLessons.has(i)) continue;

			const currentLesson = lessons[i];
			const consecutiveLessons: Lesson[] = [currentLesson];

			for (let j = i + 1; j < lessons.length; j++) {
				const nextLesson = lessons[j];
				if (
					nextLesson.lessonName === currentLesson.lessonName &&
					nextLesson.teacherName === currentLesson.teacherName &&
					nextLesson.auditoryName === currentLesson.auditoryName &&
					nextLesson.type === currentLesson.type &&
					nextLesson.weekType === currentLesson.weekType
				) {
					consecutiveLessons.push(nextLesson);
					skipLessons.add(j);
				} else {
					break;
				}
			}

			if (consecutiveLessons.length > 1) {
				const lastLesson = consecutiveLessons[consecutiveLessons.length - 1];
				processedLessons.push({
					...currentLesson,
					endAt: lastLesson.endAt,
					additionalSlots: consecutiveLessons.slice(1).map((l) => ({
						number: l.number,
						endAt: l.endAt
					}))
				});
			} else {
				processedLessons.push(currentLesson);
			}
		}

		return processedLessons;
	}

	function handleViewChange() {
		isViewChanging = true;
		localStorage.setItem('isFullViewYspu', isFullView.toString());
		if (!isFullView && daysWithLessons.length > 0) {
			selectedDay = daysWithLessons[0];
			localStorage.setItem('lastSelectedDayYspu', selectedDay.toString());
		} else {
			localStorage.removeItem('lastSelectedDayYspu');
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

	$: actualGroupNumber = groupNumbersMap[selectedGroup];

	$: daysWithLessons =
		scheduleData && actualGroupNumber
			? (days
					.map((_, dayIndex) => {
						const dayLessons = scheduleData!.items
							.filter(
								(item: ScheduleItem) => item.courseInfo.number === actualGroupNumber
							)
							.flatMap((item) =>
								item.days
									.filter((d) => d.info.type === dayIndex)
									.flatMap((d) => processLessons(d.lessons))
									.filter(
										(lesson) => viewMode === 'all' || isLessonInDate(lesson)
									)
							);
						return dayLessons.length > 0 ? dayIndex : null;
					})
					.filter((day) => day !== null) as number[])
			: [];

	$: {
		if ($isMobile && !isFullView && daysWithLessons.length > 0) {
			if (!daysWithLessons.includes(selectedDay)) {
				selectedDay = daysWithLessons[0];
				localStorage.setItem('lastSelectedDayYspu', selectedDay.toString());
			}
		}
	}

	async function handleSemesterSelect(semester: SemesterInfo) {
		try {
			isScheduleLoading = true;
			selectedSemester = semester;
			lastLoadedDirection = '';
			lastLoadedSemester = '';
			storage.set('lastYspuSemester', semester.folderId);

			const params = new URLSearchParams(window.location.search);
			params.set('semester', semester.folderId);
			window.history.replaceState({}, '', `${window.location.pathname}?${params}`);

			const targetSchedule = schedules.find((s) => s.folderId === semester.folderId);
			if (!targetSchedule) {
				scheduleData = null;
				groupNumbersMap = {};
				return;
			}

			const oldDirectionName = directions.find((d) => d.id === selectedDirection)?.name || '';
			directions = (targetSchedule.directions as Direction[]) || [];
			const matched = oldDirectionName
				? directions.find((d) => d.name === oldDirectionName)
				: undefined;

			if (!matched) {
				selectedDirection = '';
				selectedGroup = '';
				scheduleData = null;
				groupNumbersMap = {};
				return;
			}

			selectedDirection = matched.id;
			if (selectedDirection) {
				await loadSchedule();
			}
		} catch (error) {
			console.error('Error changing semester:', error);
		} finally {
			isScheduleLoading = false;
		}
	}

	function openLinearModalFromLesson(lesson: Lesson) {
		const typeMap: Record<string, number> = { lecture: 2, practice: 4, other: 99 };
		const adapted: YSTULesson = {
			number: lesson.number,
			lessonName: lesson.lessonName,
			type: typeMap[lesson.type] ?? 99,
			timeRange: lesson.timeRange,
			startAt: new Date(`1970-01-01T${lesson.startAt}`).toISOString(),
			endAt: new Date(`1970-01-01T${lesson.endAt}`).toISOString(),
			teacherName: lesson.teacherName,
			teacherId: 0,
			auditoryName: lesson.auditoryName || '',
			isDistant: !!lesson.isDistant,
			isDivision: !!lesson.isDivision,
			originalTimeTitle: lesson.originalTimeTitle,
			additionalTeacherName: undefined,
			additionalTeacherId: undefined,
			groups: undefined,
			uniqueIndex: undefined,
			originalText: lesson.originalText,
			timeInfo: lesson.timeInfo,
			additionalSlots: lesson.additionalSlots?.map((slot) => ({
				number: slot.number,
				startAt: new Date(`1970-01-01T${slot.endAt}`).toISOString(),
				endAt: new Date(`1970-01-01T${slot.endAt}`).toISOString(),
				timeRange: '',
				originalTimeTitle: ''
			}))
		};
		selectedLesson = adapted;
		selectedLessonDate = new Date().toISOString().split('T')[0];
		setTimeout(() => {
			isLinearModalOpen = true;
		}, 0);
	}

	function closeLinearModal() {
		isLinearModalOpen = false;
		setTimeout(() => {
			selectedLesson = null;
			selectedLessonDate = '';
		}, 300);
	}

	$: groupInfo = selectedGroup
		? (Object.entries(
				(directions.find((d) => d.id === selectedDirection) as Direction)?.courses || {}
			).find(([key]) => key === selectedGroup)?.[1] as Course)
		: null;

	$: groupName = (groupInfo as Course)?.name || selectedGroup;
	$: directionName =
		(directions.find((d) => d.id === selectedDirection) as Direction)?.name || '';
</script>

<svelte:head>
	<title>
		{selectedGroup
			? `Расписание группы ${groupName} ФСУ ЯГПУ`
			: 'Расписание занятий ФСУ ЯГПУ | Поиск по группам'}
	</title>
	<meta
		name="description"
		content={selectedGroup
			? `Актуальное расписание занятий группы ${groupName} ${directionName} факультета социального управления ЯГПУ. Полное расписание лекций, семинаров и практических занятий`
			: 'Актуальное расписание занятий факультета социального управления ЯГПУ. Удобный поиск расписания по группам, просмотр лекций, семинаров и практических занятий'}
	/>
	<meta
		name="keywords"
		content={`расписание ЯГПУ, ${
			selectedGroup ? `расписание ${groupName}, группа ${groupName}, ` : ''
		}${
			directionName ? `${directionName}, ` : ''
		}ягпу им ушинского, ФСУ ЯГПУ, факультет социального управления, расписание занятий ЯГПУ, ягпу расписание по группам, расписание студентов ФСУ`}
	/>

	<meta
		property="og:title"
		content={selectedGroup
			? `Расписание группы ${groupName} ФСУ ЯГПУ`
			: 'Расписание занятий ФСУ ЯГПУ | Поиск по группам'}
	/>
	<meta
		property="og:description"
		content={selectedGroup
			? `Актуальное расписание занятий группы ${groupName} факультета социального управления ЯГПУ. Полное расписание лекций, семинаров и практических занятий`
			: 'Актуальное расписание занятий факультета социального управления ЯГПУ. Удобный поиск расписания по группам, просмотр лекций, семинаров и практических занятий'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedGroup}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`${$page.url.origin}/yspu/rasp?direction=${encodeURIComponent(selectedDirection)}&group=${encodeURIComponent(selectedGroup)}`}
		/>
	{/if}
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="yspu"
			pageType="students"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="yspu"
			pageType="students"
		/>
		<OnlineCounter
			variant="desktop"
			slot="online-counter-desktop"
			selectedGroupLabel={selectedGroup}
			selectedDirectionLabel={selectedDirection}
		/>
		<OnlineCounter
			variant="mobile"
			slot="online-counter-mobile"
			selectedDirectionLabel={selectedDirection
				? (directions.find((d) => d.id === selectedDirection) as Direction)?.name || ''
				: ''}
			selectedGroupLabel={selectedGroup
				? (Object.entries(
						(directions.find((d) => d.id === selectedDirection) as Direction)
							?.courses || {}
					).find(([key]) => key === selectedGroup)?.[1]?.name as string) || ''
				: ''}
		/>
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="relative mb-2 rounded-2xl bg-amber-500 p-4 text-center text-black">
				<span
					class="absolute -top-2 -right-2 flex rotate-12 transform cursor-pointer rounded-full bg-indigo-500 px-2 py-1 text-xs font-bold text-white uppercase shadow-lg transition-colors hover:bg-indigo-600"
					on:click={() => (isBetaModalOpen = true)}
					aria-label="Открыть модальное окно с информацией о бета-версии"
					role="button"
					tabindex="0"
					on:keydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							isBetaModalOpen = true;
						}
					}}
				>
					Beta
				</span>
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
				<p class="text-md text-black">
					{getCurrentWeekMessage()},
					<span class="rounded-lg bg-black px-2 py-1 font-bold text-gray-100 shadow-sm">
						{getCurrentWeekType() === 'numerator' ? 'числитель' : 'знаменатель'}
					</span>
				</p>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-4xl font-semibold text-white">📅</h2>
				<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
					Расписание занятий ФСУ ЯГПУ
				</h2>
			</div>

			<SelectScheduleForm
				{directions}
				bind:selectedDirection
				bind:selectedGroup
				onSubmit={loadSchedule}
				onDirectionChange={handleDirectionChange}
				{isLoading}
				autoLoadOnSelect={true}
				{scheduleData}
			/>

			{#if scheduleData && !isScheduleLoading}
				<div class="mt-2">
					{#if scheduleData.items.length > 0}
						{@const selectedGroupData = scheduleData.items.find(
							(item) => item.courseInfo.number === actualGroupNumber
						)}
						<ScheduleTitle
							type="group"
							title={actualGroupNumber}
							subtitle={selectedGroupData?.courseInfo.startDate
								? `Начало обучения с ${selectedGroupData.courseInfo.startDate}`
								: undefined}
							availableSemesters={semesters}
							{selectedSemester}
							onSemesterSelect={handleSemesterSelect}
						/>

						<ViewModeToggle
							{viewMode}
							onToggle={toggleViewMode}
							onInfoClick={() => (isViewModeModalOpen = true)}
						/>

						{#if $isMobile}
							<div class="mb-2 flex items-center justify-end">
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
															'lastSelectedDayYspu',
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

										{#if scheduleData}
											{@const dayLessons = scheduleData.items
												.filter(
													(item: ScheduleItem) =>
														item.courseInfo.number === actualGroupNumber
												)
												.flatMap((item) =>
													item.days
														.filter((d) => d.info.type === selectedDay)
														.flatMap((d) => processLessons(d.lessons))
														.filter(
															(lesson) =>
																viewMode === 'all' ||
																isLessonInDate(lesson)
														)
												)}
											{#if dayLessons.length > 0}
												<ScheduleDay
													dayName={days[selectedDay]}
													lessons={dayLessons}
													on:lessonClick={(e) =>
														openLinearModalFromLesson(e.detail)}
												/>
											{/if}
										{/if}
									</div>
								{:else}
									<div
										class="w-full"
										in:fade={{ duration: 500, easing: quintOut }}
										out:fade={{ duration: 500, easing: quintOut }}
									>
										{#each days as day, dayIndex}
											{@const dayLessons = scheduleData.items
												.filter(
													(item: ScheduleItem) =>
														item.courseInfo.number === actualGroupNumber
												)
												.flatMap((item) =>
													item.days
														.filter((d) => d.info.type === dayIndex)
														.flatMap((d) => processLessons(d.lessons))
														.filter(
															(lesson) =>
																viewMode === 'all' ||
																isLessonInDate(lesson)
														)
												)}
											{#if dayLessons.length > 0}
												<ScheduleDay
													dayName={day}
													lessons={dayLessons}
													on:lessonClick={(e) =>
														openLinearModalFromLesson(e.detail)}
												/>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							{#each days as day, dayIndex}
								{@const dayLessons = scheduleData.items
									.filter(
										(item: ScheduleItem) =>
											item.courseInfo.number === actualGroupNumber
									)
									.flatMap((item) =>
										item.days
											.filter((d) => d.info.type === dayIndex)
											.flatMap((d) => processLessons(d.lessons))
											.filter(
												(lesson) =>
													viewMode === 'all' || isLessonInDate(lesson)
											)
									)}
								{#if dayLessons.length > 0}
									<ScheduleDay
										dayName={day}
										lessons={dayLessons}
										on:lessonClick={(e) => openLinearModalFromLesson(e.detail)}
									/>
								{/if}
							{/each}
						{/if}
					{/if}
				</div>
			{:else if isScheduleLoading && selectedDirection && selectedGroup}
				<div class="mt-2">
					<ScheduleLoadingSkeleton
						{isFullView}
						isMobile={$isMobile}
						daysCount={daysWithLessons.length || 7}
						showViewModeToggle={true}
						showWeekSwitcher={false}
					/>
				</div>
			{:else if selectedDirection && selectedGroup && wasLoadAttempted && !isScheduleLoading}
				<div class="mt-4">
					<ScheduleTitle
						type="group"
						title={(() => {
							const groupInfo = Object.entries(
								(directions.find((d) => d.id === selectedDirection) as Direction)
									?.courses || {}
							).find(([key]) => key === selectedGroup);
							return (groupInfo?.[1] as Course)?.name || selectedGroup;
						})()}
						subtitle={undefined}
						availableSemesters={semesters}
						{selectedSemester}
						onSemesterSelect={handleSemesterSelect}
					/>

					<div class="flex flex-col items-center justify-center text-center">
						<div class="h-[200px] w-[200px]">
							<TgsSticker
								src="/stickers/face_with_monocle.tgs"
								autoplay={true}
								once={false}
								quality={3}
								width="100%"
								height="100%"
							/>
						</div>
						<p class="text-xl font-semibold text-white">
							Расписание на этот семестр пока не добавлено
						</p>
						<div class="relative mt-2">
							<p class="text-gray-400">
								Попробуйте выбрать другой семестр или зайдите позже
							</p>
							<svg
								class="absolute -top-[255px] right-[250px] block h-[189px] w-[69px] md:-top-[225px] md:right-[300px] md:h-[189px] md:w-[69px] lg:-top-[225px] lg:right-[300px]"
								viewBox="0 0 69 189"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M63.1047 0.259298C62.963 0.279533 61.8291 1.11969 60.5742 2.11625C58.3845 3.86603 56.2903 5.4037 54.2216 6.75182C50.4644 9.22039 47.8728 11.0042 44.8223 13.224C42.8998 14.6266 39.8634 16.7929 38.0624 18.0066C29.795 23.6463 25.2165 27.2328 22.8833 29.9014C21.8437 31.1177 21.6132 32.3081 22.1588 33.7829C22.6542 35.0811 24.6631 37.9269 25.1888 38.0642C25.647 38.1838 27.2555 37.3694 27.3514 37.0021C27.3893 36.8567 27.3396 36.5249 27.2323 36.2599C27.0788 35.8029 27.1238 35.6921 28.3801 34.4752C30.0176 32.8428 32.4439 30.7706 34.8517 28.9225C37.3837 26.9679 42.9116 23.0325 42.9688 23.121C43.0023 23.1461 41.8609 24.7526 40.4453 26.6718C32.5072 37.4734 28.2231 44.2347 23.5855 53.364C19.4425 61.5517 16.1848 69.2675 12.6567 79.3404C10.9641 84.1952 6.06864 102.641 5.14721 107.738C2.09844 124.426 0.696702 139.476 0.759557 154.908C0.805773 162.261 1.00898 166.123 1.71661 173.615C2.37217 180.292 2.90682 182.639 4.38479 185.183C5.08942 186.356 6.4852 187.954 6.94335 188.074C7.05601 188.103 6.9075 186.798 6.60006 185.148C2.52914 163.373 3.30139 136.167 8.80047 107.204C9.69913 102.501 14.5355 83.975 15.9541 79.8007C21.6652 63.0556 26.7897 52.0916 34.5174 40.0989C37.1946 35.9588 41.9673 29.1698 43.9548 26.6888C44.4175 26.1148 44.4135 26.1301 43.9273 27.5317C43.426 28.9294 43.4371 28.9486 43.8363 30.1236C44.3705 31.7344 46.5656 35.4952 47.4563 36.3244C48.0494 36.8798 48.2292 36.9594 48.5139 36.8212C48.7171 36.719 48.9287 36.4309 49.0006 36.1554C49.2384 35.2448 51.7558 29.4119 52.7638 27.3945C54.8098 23.3676 57.8174 19.0686 60.9107 15.7319C62.5922 13.9312 63.6724 12.8972 66.1517 10.8062C67.2245 9.89284 68.1751 8.95579 68.229 8.74917C68.4328 7.96863 67.7191 6.00041 66.5203 3.9546C64.8359 1.0954 63.9567 0.130219 63.1087 0.243978L63.1047 0.259298Z"
									fill="currentColor"
									class="text-gray-300/50"
								/>
							</svg>
						</div>
					</div>
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
	{selectedSemester}
	onSemesterChange={handleSemesterSelect}
	currentPage="students"
	university="yspu"
/>

<BetaModal
	isOpen={isBetaModalOpen}
	title="Что такое Beta?"
	onClose={() => (isBetaModalOpen = false)}
>
	<div class="rounded-lg bg-gray-800 p-4">
		<p class="mb-4">
			Это бета-версия расписания ЯГПУ. Мы разработали экосистему для ЯГТУ, настало время
			расширяться, на одном из факультетов ЯГПУ <a
				href="https://vk.com/fsyipp"
				class="text-blue-500 hover:text-blue-600">(Факультет Социального Управления)</a
			> теперь можно смотреть расписание у нас в удобном виде
		</p>
		<p class="mb-4">
			Больше никакой путаницы с таблицами — только чёткое и понятное расписание. А также
			широкий выбор где можно посмотреть: браузер, <a
				class="font-extrabold text-gray-200"
				href="/installapp">web-приложение на iPhone</a
			>, или
			<a
				class="font-extrabold text-gray-200"
				href="https://t.me/ysturasp_yspu_bot/ysturasp_yspu">мини-приложение в телеграме</a
			>
		</p>
		<p>
			На начальном этапе могут быть некоторые косяки. Если у вас есть предложения по улучшению
			или вы нашли ошибку, пожалуйста, сообщите об этом <a
				href="https://t.me/ysturasp_bot"
				class="text-blue-500 hover:text-blue-600">нам</a
			>
		</p>
	</div>
	<svelte:fragment slot="footer">
		<button
			on:click={() => (isBetaModalOpen = false)}
			class="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700"
		>
			ок, пон
		</button>
	</svelte:fragment>
</BetaModal>

<BetaModal
	isOpen={isViewModeModalOpen}
	title="Режимы просмотра расписания"
	onClose={() => (isViewModeModalOpen = false)}
>
	<div class="mb-4 rounded-lg bg-gray-800 p-4">
		<h4 class="mb-2 text-lg font-semibold text-blue-400">Общее расписание</h4>
		<p>
			Показывает общее расписание с учетом всех предметов, независимо от дат их начала и
			окончания. Полезно для общего ознакомления со структурой занятий на семестр.
		</p>
	</div>
	<div class="mb-4 rounded-lg bg-gray-800 p-4">
		<h4 class="mb-2 text-lg font-semibold text-blue-400">Актуальное по дате</h4>
		<p>
			Показывает только те предметы, которые проводятся в текущую дату с учетом периодов и
			условий. Например, если для предмета указан период с 10.02.2025 по 10.03.2025, он будет
			отображаться только в этом диапазоне дат.
		</p>
	</div>
	<svelte:fragment slot="footer">
		<button
			on:click={() => (isViewModeModalOpen = false)}
			class="w-full rounded-lg bg-blue-600 px-4 py-3 text-white transition-all hover:bg-blue-700"
		>
			ок, пон
		</button>
	</svelte:fragment>
</BetaModal>

{#if isScheduleLoading && !selectedDirection && !selectedGroup}
	<LoadingOverlay />
{/if}

{#if selectedLesson}
	<LinearIntegrationModal
		isOpen={isLinearModalOpen}
		onClose={closeLinearModal}
		lesson={selectedLesson}
		date={selectedLessonDate}
	/>
{/if}

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
</style>
