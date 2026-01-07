<script lang="ts">
	import { onMount } from 'svelte';
	import { getInstitutes, getSchedule } from './api';
	import type { Institute, ScheduleData, YSTULesson } from './types';
	import { hiddenSubjects } from './stores';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import ScheduleLoadingSkeleton from '$lib/components/loading/ScheduleLoadingSkeleton.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import YSTUScheduleDay from './components/YSTUScheduleDay.svelte';
	import YSTUScheduleForm from './components/YSTUScheduleForm.svelte';
	import SubgroupSettingsModal from './components/SubgroupSettingsModal.svelte';
	import SubgroupsStatistics from './components/SubgroupsStatistics.svelte';
	import HiddenSubjects from './components/HiddenSubjects.svelte';
	import GithubApiSection from '$lib/components/sections/GithubApiSection.svelte';
	import LinearIntegrationModal from '$lib/components/linear/LinearIntegrationModal.svelte';
	import LinearAllSubjectsTasks from '$lib/components/linear/LinearAllSubjectsTasks.svelte';
	import FormatDocumentPromo from './components/FormatDocumentPromo.svelte';
	import {
		SEMESTER_WEEKS_COUNT,
		getCurrentWeekMessage,
		getCurrentWeek,
		getCurrentSemester,
		detectAvailableSemesters,
		isDateInSemester,
		type SemesterInfo
	} from '$lib/utils/semester';
	import { notifications } from '$lib/stores/notifications';
	import { linearStore } from '$lib/stores/linear';
	import {
		subgroupSettings,
		teacherSubgroups,
		loadSubgroupSettings,
		saveSubgroupSettings,
		loadTeacherSubgroups,
		saveTeacherSubgroups,
		generateSubgroupDistribution,
		type SubgroupSettings,
		type TeacherSubgroups
	} from './stores/subgroups';
	import { replaceState } from '$app/navigation';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import { writable } from 'svelte/store';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { tick } from 'svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import type { Settings } from '$lib/stores/settings';
	import { settings } from '$lib/stores/settings';
	import WorkloadStatistics from './components/WorkloadStatistics.svelte';

	const isMobile = writable(false);

	onMount(() => {
		const checkMobile = () => {
			isMobile.set(window.innerWidth <= 768);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
	});

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

	const imageChill =
		'https://steamuserimages-a.akamaihd.net/ugc/543050193621050493/822D951ADFCB3C9ADE095AC49917043365AFD48E/';

	let isLoading = false;
	let isScheduleLoading = false;
	let isViewChanging = false;
	let institutes: Institute[] = [];
	let selectedInstitute = '';
	let selectedGroup = '';
	let selectedWeek = '1';
	let scheduleData: ScheduleData | null = null;
	let isFullView = false;
	let selectedDay = '';

	function handleViewChange() {
		isViewChanging = true;
		localStorage.setItem('isFullView', isFullView.toString());
		if (!isFullView) {
			selectedDay = filteredDays[0]?.info.date || '';
			localStorage.setItem('lastSelectedDay', selectedDay);
		} else {
			localStorage.removeItem('lastSelectedDay');
		}
		setTimeout(() => {
			isViewChanging = false;
		}, 500);
	}

	let favoriteGroups: string[] = [];
	let showFavoriteButton = false;
	let isFavorite = false;
	let availableSemesters: SemesterInfo[] = [];
	let selectedSemester: SemesterInfo | null = null;

	let isSubgroupModalOpen = false;
	let currentSubgroupSettings: SubgroupSettings = {};
	let currentTeacherSubgroups: TeacherSubgroups = {};

	let isLinearModalOpen = false;
	let selectedLesson: YSTULesson | null = null;
	let selectedLessonDate = '';

	function autoEnableDivisionSubjects() {
		try {
			if (!scheduleData || !selectedSemester) return;
			let changed = false;
			const newSettings: SubgroupSettings = { ...currentSubgroupSettings };

			scheduleData.items.forEach((weekItem) => {
				weekItem.days.forEach((day) => {
					if (!isDateInSemester(day.info.date, selectedSemester!)) return;
					day.lessons?.forEach((lesson) => {
						if (lesson.type === 8 || lesson.type === 4) {
							const lessonName = lesson.lessonName || 'null';
							const settingKey =
								lessonName === 'null' ? `null_${lesson.teacherName}` : lessonName;

							if (newSettings[settingKey] === undefined) {
								newSettings[settingKey] = lesson.isDivision || false;
								changed = true;
							}
						}
					});
				});
			});

			if (changed) {
				currentSubgroupSettings = newSettings;
				subgroupSettings.set(currentSubgroupSettings);
				saveSubgroupSettings(currentSubgroupSettings);
			}
		} catch {}
	}

	onMount(async () => {
		try {
			isLoading = true;
			institutes = await getInstitutes();

			const urlParams = new URLSearchParams(window.location.search);
			const urlInstitute = urlParams.get('institute');
			const urlGroup = urlParams.get('group');
			const urlWeek = urlParams.get('week');
			const semesterFromURL = urlParams.get('semester');

			isFullView = localStorage.getItem('isFullView') === 'true';
			selectedDay = localStorage.getItem('lastSelectedDay') || '';

			currentSubgroupSettings = loadSubgroupSettings();
			currentTeacherSubgroups = loadTeacherSubgroups();
			subgroupSettings.set(currentSubgroupSettings);
			teacherSubgroups.set(currentTeacherSubgroups);

			if (urlInstitute && urlGroup) {
				selectedInstitute = urlInstitute;
				selectedGroup = urlGroup;

				const savedHiddenSubjects = localStorage.getItem(`hiddenSubjects_${selectedGroup}`);
				if (savedHiddenSubjects) {
					hiddenSubjects.update((subjects) => ({
						...subjects,
						[selectedGroup]: JSON.parse(savedHiddenSubjects)
					}));
				}

				if (urlWeek) {
					selectedWeek = urlWeek;
				} else {
					selectedWeek = getCurrentWeek().toString();
					const url = new URL(window.location.href);
					url.searchParams.set('week', selectedWeek);
					window.history.replaceState({}, '', url.toString());
				}

				await loadSchedule();

				if (semesterFromURL && availableSemesters.length > 0) {
					const semesterFromParams = availableSemesters.find(
						(s) => s.id === semesterFromURL
					);
					if (semesterFromParams) {
						selectedSemester = semesterFromParams;
						localStorage.setItem('lastSemester', semesterFromParams.id);
					}
				} else {
					const lastSemester = localStorage.getItem('lastSemester');
					if (lastSemester && availableSemesters.length > 0) {
						const foundSemester = availableSemesters.find((s) => s.id === lastSemester);
						if (foundSemester) {
							selectedSemester = foundSemester;
						}
					}
					if (!selectedSemester && availableSemesters.length > 0) {
						const currentSem = getCurrentSemester();
						const foundSemester = availableSemesters.find(
							(s) => s.id === currentSem.id
						);
						selectedSemester = foundSemester || availableSemesters[0];
					}
				}

				if (selectedSemester) {
					const newTeacherSubgroups = generateSubgroupDistribution(
						scheduleData,
						selectedSemester
					);
					currentTeacherSubgroups = newTeacherSubgroups;
					teacherSubgroups.set(currentTeacherSubgroups);
					saveTeacherSubgroups(currentTeacherSubgroups);
					autoEnableDivisionSubjects();
					updateURL();
				}
			} else {
				const lastInstitute = localStorage.getItem('lastInstitut');
				const lastGroup = localStorage.getItem('lastGroup');
				const lastWeek = localStorage.getItem('lastWeek');
				const lastSemester = localStorage.getItem('lastSemester');

				if (lastInstitute) {
					selectedInstitute = lastInstitute;
					if (lastGroup) {
						selectedGroup = lastGroup;
						if (lastWeek) {
							selectedWeek = lastWeek;
							await loadSchedule();
							if (lastSemester && availableSemesters.length > 0) {
								const foundSemester = availableSemesters.find(
									(s) => s.id === lastSemester
								);
								if (foundSemester) {
									selectedSemester = foundSemester;
									const newTeacherSubgroups = generateSubgroupDistribution(
										scheduleData,
										foundSemester
									);
									currentTeacherSubgroups = newTeacherSubgroups;
									teacherSubgroups.set(currentTeacherSubgroups);
									saveTeacherSubgroups(currentTeacherSubgroups);
									autoEnableDivisionSubjects();
									updateURL();
								}
							}
						}
					}
				}
			}
		} catch (error) {
			console.error('Error loading initial data:', error);
			notifications.add('Ошибка при загрузке данных', 'error');
		} finally {
			isLoading = false;
		}
	});

	async function loadSchedule() {
		if (!selectedGroup || !selectedWeek || selectedWeek === '0') return;

		try {
			isScheduleLoading = true;
			scheduleData = await getSchedule(selectedGroup);

			if (scheduleData) {
				const savedHiddenSubjects = localStorage.getItem(`hiddenSubjects_${selectedGroup}`);
				if (savedHiddenSubjects) {
					hiddenSubjects.update((subjects) => ({
						...subjects,
						[selectedGroup]: JSON.parse(savedHiddenSubjects)
					}));
				}

				availableSemesters = detectAvailableSemesters(scheduleData);
				if (!selectedSemester && availableSemesters.length > 0) {
					selectedSemester = availableSemesters[0];
				}

				if (selectedSemester) {
					const newTeacherSubgroups = generateSubgroupDistribution(
						scheduleData,
						selectedSemester
					);
					currentTeacherSubgroups = newTeacherSubgroups;
					teacherSubgroups.set(currentTeacherSubgroups);
					saveTeacherSubgroups(currentTeacherSubgroups);
					autoEnableDivisionSubjects();
				}
			}

			localStorage.setItem('lastInstitut', selectedInstitute);
			localStorage.setItem('lastGroup', selectedGroup);
			localStorage.setItem('lastWeek', selectedWeek);

			updateURL();

			await tick();
			await new Promise((resolve) => setTimeout(resolve, 100));
		} catch (error) {
			console.error('Error loading schedule:', error);
			notifications.add('Ошибка при загрузке расписания', 'error');
		} finally {
			isScheduleLoading = false;
		}
	}

	function changeWeek(delta: number) {
		const newWeek = parseInt(selectedWeek, 10) + delta;
		if (newWeek >= 1 && newWeek <= SEMESTER_WEEKS_COUNT) {
			selectedWeek = newWeek.toString();
			localStorage.setItem('lastWeek', selectedWeek);
			updateURL();

			if (!isFullView && $isMobile) {
				const newWeekData = scheduleData?.items.find((week) => week.number === newWeek);
				const newFilteredDays =
					newWeekData?.days.filter((day) => {
						if (!selectedSemester) return true;
						return isDateInSemester(day.info.date, selectedSemester);
					}) || [];

				if (newFilteredDays.length > 0) {
					selectedDay = newFilteredDays[0].info.date;
					localStorage.setItem('lastSelectedDay', selectedDay);
				}
			}
		}
	}

	function updateURL() {
		const url = new URL(window.location.href);
		url.searchParams.set('institute', selectedInstitute);
		url.searchParams.set('group', selectedGroup);
		url.searchParams.set('week', selectedWeek.toString());
		if (selectedSemester) {
			url.searchParams.set('semester', selectedSemester.id);
		}
		replaceState(url, { noscroll: true });
	}

	function changeSemester(semester: SemesterInfo) {
		selectedSemester = semester;
		localStorage.setItem('lastSemester', semester.id);
		if (scheduleData) {
			const newTeacherSubgroups = generateSubgroupDistribution(scheduleData, semester);
			currentTeacherSubgroups = newTeacherSubgroups;
			teacherSubgroups.set(currentTeacherSubgroups);
			saveTeacherSubgroups(currentTeacherSubgroups);
			autoEnableDivisionSubjects();

			if (!isFullView && $isMobile) {
				const currentWeekData = scheduleData.items.find(
					(week) => week.number === parseInt(selectedWeek, 10)
				);
				const newFilteredDays =
					currentWeekData?.days.filter((day) => {
						return isDateInSemester(day.info.date, semester);
					}) || [];

				if (newFilteredDays.length > 0) {
					selectedDay = newFilteredDays[0].info.date;
					localStorage.setItem('lastSelectedDay', selectedDay);
				}
			}
		}
		updateURL();
	}

	function handleSubgroupSettingsSave(settings: SubgroupSettings) {
		currentSubgroupSettings = settings;
		subgroupSettings.set(currentSubgroupSettings);
		saveSubgroupSettings(currentSubgroupSettings);
	}

	function openSubgroupModal() {
		isSubgroupModalOpen = true;
	}

	function closeSubgroupModal() {
		isSubgroupModalOpen = false;
	}

	function handleLinearModalOpen(lesson: YSTULesson, date: string) {
		selectedLesson = lesson;
		selectedLessonDate = date;
		setTimeout(() => {
			isLinearModalOpen = true;
		}, 0);
	}

	function handleLinearModalClose() {
		isLinearModalOpen = false;
		setTimeout(() => {
			selectedLesson = null;
			selectedLessonDate = '';
		}, 300);
	}

	function isToday(dateString: string): boolean {
		const date = new Date(dateString);
		const today = new Date();
		date.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		return date.getTime() === today.getTime();
	}

	function getDayName(dayIndex: number): string {
		const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
		return days[dayIndex];
	}

	$: {
		if (selectedGroup) {
			favoriteGroups = JSON.parse(localStorage.getItem('favoriteGroups') || '[]');
			isFavorite = favoriteGroups.includes(selectedGroup);
			showFavoriteButton = true;
		} else {
			showFavoriteButton = false;
		}
	}

	$: {
		if ($isMobile && !isFullView && filteredDays.length > 0) {
			if (!selectedDay || !filteredDays.some((day) => day.info.date === selectedDay)) {
				selectedDay = filteredDays[0].info.date;
				localStorage.setItem('lastSelectedDay', selectedDay);
			}
		}
	}

	$: currentWeekMessage = getCurrentWeekMessage();
	$: currentWeekData = scheduleData?.items.find(
		(week) => week.number === parseInt(selectedWeek, 10)
	);
	$: filteredDays =
		currentWeekData?.days.filter((day) => {
			if (!selectedSemester) return true;
			return isDateInSemester(day.info.date, selectedSemester);
		}) || [];

	$: hiddenSubjectsForGroup = $hiddenSubjects[selectedGroup] || [];
	$: hasHiddenSubjects = hiddenSubjectsForGroup.length > 0;
</script>

<svelte:head>
	<title>
		{selectedGroup
			? `Расписание группы ${selectedGroup} ЯГТУ | ${selectedInstitute}`
			: 'Расписание пар ЯГТУ. Как официальное, только лучше 🙃.'}
	</title>
	<meta
		name="description"
		content={selectedGroup
			? `Актуальное расписание занятий группы ${selectedGroup} ${selectedInstitute} ЯГТУ. Полное расписание лекций, семинаров и лабораторных работ.`
			: 'Актуальное расписание занятий ЯГТУ для студентов. Удобный поиск расписания по группам, институтам и неделям. Всегда актуальная информация о лекциях, семинарах и лабораторных работах'}
	/>
	<meta
		name="keywords"
		content={`расписание ЯГТУ, ${
			selectedGroup ? `расписание ${selectedGroup}, группа ${selectedGroup}, ` : ''
		}${
			selectedInstitute ? `${selectedInstitute}, ` : ''
		}расписание занятий ЯГТУ, ЯГТУ расписание, расписание пар ЯГТУ, расписание для студентов ЯГТУ, ЯГТУ расписание по группам, ЯГТУ расписание занятий, расписание лекций ЯГТУ`}
	/>

	<meta
		property="og:title"
		content={selectedGroup
			? `Расписание группы ${selectedGroup} ЯГТУ | ${selectedInstitute}`
			: 'Расписание пар ЯГТУ. Как официальное, только лучше 🙃'}
	/>
	<meta
		property="og:description"
		content={selectedGroup
			? `Актуальное расписание занятий группы ${selectedGroup} ${selectedInstitute} ЯГТУ. Полное расписание лекций, семинаров и лабораторных работ.`
			: 'Актуальное расписание занятий студентов ЯГТУ. Удобный поиск расписания по группам, институтам и неделям. Всегда актуальная информация о лекциях, семинарах и лабораторных работах.'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedGroup}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`${page.url.origin}/rasp?institute=${encodeURIComponent(selectedInstitute)}&group=${encodeURIComponent(selectedGroup)}`}
		/>
	{/if}
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="ystu"
			pageType="students"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="ystu"
			pageType="students"
		/>
		<OnlineCounter
			variant="desktop"
			slot="online-counter-desktop"
			selectedGroupLabel={selectedGroup}
			selectedDirectionLabel=""
		/>
		<OnlineCounter
			variant="mobile"
			slot="online-counter-mobile"
			selectedGroupLabel={selectedGroup}
			selectedDirectionLabel=""
		/>
		<div slot="personal-account-ystu">
			<a
				href="/me"
				class="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-blue-400 ring-1 ring-blue-500/50 transition-all hover:text-blue-300 hover:ring-blue-400 md:h-12 md:w-12"
				aria-label="Личный кабинет"
			>
				<svg
					class="h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 md:h-[22px] md:w-[22px]"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</a>
		</div>
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
				<p class="text-md text-black">{getCurrentWeekMessage()}</p>
			</div>

			<YSTUScheduleForm
				{institutes}
				bind:selectedInstitute
				bind:selectedGroup
				bind:selectedWeek
				bind:showFavoriteButton
				bind:isFavorite
				bind:favoriteGroups
				onSubmit={loadSchedule}
				{isLoading}
				{selectedSemester}
				{scheduleData}
			/>

			{#if scheduleData && !isScheduleLoading}
				<div class="mt-4">
					<div class="mb-2 flex justify-center md:items-center">
						<button
							on:click={() => changeWeek(-1)}
							class="mr-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={parseInt(selectedWeek, 10) <= 1}
						>
							👈
						</button>

						<div class="flex flex-col justify-center md:items-center">
							<ScheduleTitle
								title={selectedGroup}
								{availableSemesters}
								{selectedSemester}
								onSemesterSelect={changeSemester}
								weekNumber={parseInt(selectedWeek, 10)}
								onSubgroupsClick={openSubgroupModal}
							/>
						</div>

						<button
							on:click={() => changeWeek(1)}
							class="ml-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={parseInt(selectedWeek, 10) >= SEMESTER_WEEKS_COUNT}
						>
							👉
						</button>
					</div>

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

					{#if !currentWeekData || filteredDays.length === 0}
						<div class="text-center">
							<p class="text-xl font-bold text-green-500">
								На этой неделе в группе нет пар
							</p>
							<img src={imageChill} alt="Chill" class="mx-auto mt-4 rounded-lg" />
						</div>
					{:else if $isMobile}
						<div class="relative">
							{#if !isFullView}
								<div
									class="w-full"
									in:fade={{ duration: 500, easing: quintOut }}
									out:fade={{ duration: 500, easing: quintOut }}
								>
									<div
										class="mb-2 grid gap-1"
										style="grid-template-columns: repeat({filteredDays.length}, 1fr)"
									>
										{#each filteredDays as day}
											{@const dayDate = new Date(day.info.date)}
											<button
												class="day-button flex flex-col items-center rounded-lg p-2 transition-all {dayDate.toDateString() ===
												new Date(selectedDay || '').toDateString()
													? 'bg-blue-600'
													: 'bg-gray-700'} {isToday(day.info.date)
													? 'border-2 border-blue-300'
													: ''}"
												on:click={() => {
													selectedDay = day.info.date;
													localStorage.setItem(
														'lastSelectedDay',
														selectedDay
													);
												}}
											>
												<span class="text-sm"
													>{getDayName(dayDate.getDay())}</span
												>
												<span class="text-lg font-bold"
													>{dayDate.getDate()}</span
												>
											</button>
										{/each}
									</div>

									{#each filteredDays as day}
										{#if selectedDay && day.info.date === selectedDay && day.lessons && day.lessons.length > 0}
											<YSTUScheduleDay
												date={day.info.date}
												lessons={day.lessons}
												{selectedGroup}
												subgroupSettings={currentSubgroupSettings}
												teacherSubgroups={currentTeacherSubgroups}
												onLessonClick={handleLinearModalOpen}
											/>
										{/if}
									{/each}
								</div>
							{:else}
								<div
									class="w-full"
									in:fade={{ duration: 500, easing: quintOut }}
									out:fade={{ duration: 500, easing: quintOut }}
								>
									{#each filteredDays as day}
										{#if day.lessons && day.lessons.length > 0}
											<YSTUScheduleDay
												date={day.info.date}
												lessons={day.lessons}
												{selectedGroup}
												subgroupSettings={currentSubgroupSettings}
												teacherSubgroups={currentTeacherSubgroups}
												onLessonClick={handleLinearModalOpen}
											/>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						{#each filteredDays as day}
							{#if day.lessons && day.lessons.length > 0}
								<YSTUScheduleDay
									date={day.info.date}
									lessons={day.lessons}
									{selectedGroup}
									subgroupSettings={currentSubgroupSettings}
									teacherSubgroups={currentTeacherSubgroups}
									onLessonClick={handleLinearModalOpen}
								/>
							{/if}
						{/each}
					{/if}
				</div>
			{:else if isScheduleLoading && selectedGroup}
				<div class="mt-4">
					<ScheduleLoadingSkeleton
						{isFullView}
						isMobile={$isMobile}
						daysCount={filteredDays.length || 5}
						showSubgroups={true}
					/>
				</div>
			{/if}

			<HiddenSubjects {selectedGroup} />
		</section>

		<FormatDocumentPromo />

		{#if $linearStore.isConfigured && !isScheduleLoading}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<h2 class="mb-4 text-xl font-bold text-white">Задачи по предметам</h2>
				<LinearAllSubjectsTasks />
			</section>
		{/if}

		{#if scheduleData && selectedSemester && Object.keys(currentTeacherSubgroups).length > 0 && currentSettings.showSubgroups && !isScheduleLoading}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<SubgroupsStatistics
					teacherSubgroups={currentTeacherSubgroups}
					{scheduleData}
					{selectedSemester}
				/>
			</section>
		{:else if isScheduleLoading && selectedGroup && currentSettings.showSubgroups}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<div class="space-y-4">
					<div class="flex items-center justify-between">
						<div class="h-8 w-64 animate-pulse rounded bg-slate-700"></div>
						<div class="h-10 w-40 animate-pulse rounded bg-slate-700"></div>
					</div>
					<div class="grid grid-cols-1 gap-4">
						{#each Array(3) as _}
							<div class="h-48 animate-pulse rounded-2xl bg-slate-700"></div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if scheduleData && selectedSemester && currentSettings.showWorkload && !isScheduleLoading}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<WorkloadStatistics
					{scheduleData}
					{selectedSemester}
					institute={selectedInstitute}
				/>
			</section>
		{:else if isScheduleLoading && selectedGroup && currentSettings.showWorkload}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<div class="space-y-4">
					<div class="h-8 w-48 animate-pulse rounded bg-slate-700"></div>
					<div class="h-6 w-80 animate-pulse rounded bg-slate-700"></div>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{#each Array(6) as _}
							<div class="h-64 animate-pulse rounded-lg bg-slate-700"></div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		{#if currentSettings.showAPILink}
			<GithubApiSection />
		{/if}
	</main>

	<Footer class_name="pb-28 md:pb-18" />
	<NotificationsContainer hasScheduleSwitcher={true} />
</PageLayout>

<SubgroupSettingsModal
	isOpen={isSubgroupModalOpen}
	settings={currentSubgroupSettings}
	teacherSubgroups={currentTeacherSubgroups}
	onSave={handleSubgroupSettingsSave}
	onClose={closeSubgroupModal}
/>

<ScheduleSwitcher {selectedSemester} onSemesterChange={changeSemester} currentPage="students" />

{#if selectedLesson}
	<LinearIntegrationModal
		isOpen={isLinearModalOpen}
		onClose={handleLinearModalClose}
		lesson={selectedLesson}
		date={selectedLessonDate}
		{scheduleData}
		teacherSubgroups={currentTeacherSubgroups}
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
