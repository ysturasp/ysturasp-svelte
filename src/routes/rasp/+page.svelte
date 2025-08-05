<script lang="ts">
	import { onMount } from 'svelte';
	import { getInstitutes, getSchedule } from './api';
	import type { Institute, ScheduleData } from './types';
	import { hiddenSubjects } from './stores';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import YSTUScheduleDay from './components/YSTUScheduleDay.svelte';
	import YSTUScheduleForm from './components/YSTUScheduleForm.svelte';
	import SubgroupSettingsModal from './components/SubgroupSettingsModal.svelte';
	import SubgroupsStatistics from './components/SubgroupsStatistics.svelte';
	import HiddenSubjects from './components/HiddenSubjects.svelte';
	import GithubApiSection from '$lib/components/sections/GithubApiSection.svelte';
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
	import { fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

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
				}
			}

			localStorage.setItem('lastInstitut', selectedInstitute);
			localStorage.setItem('lastGroup', selectedGroup);
			localStorage.setItem('lastWeek', selectedWeek);

			updateURL();
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

			if (!isFullView && window.innerWidth <= 768) {
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

			if (!isFullView && window.innerWidth <= 768) {
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
	<title>Расписание пар ЯГТУ - ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий ЯГТУ для студентов. Удобный поиск расписания по группам, институтам и неделям."
	/>
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
				href="https://ystu.expo.app"
				target="_blank"
				class="flex items-center justify-center rounded-xl border-2 border-blue-500 bg-slate-900 p-1 text-sm text-white transition-all hover:border-blue-400 md:p-2 md:text-sm"
				aria-label="Открыть профиль"
			>
				<span class="text-xl">👤</span>
			</a>
		</div>
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="mb-4 rounded-lg bg-amber-500 p-4 text-center text-black">
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
				<p class="text-md text-black">{getCurrentWeekMessage()}</p>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-4xl font-semibold text-white">📅</h2>
				<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
					Расписание занятий
				</h2>
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
			/>

			{#if scheduleData}
				<div class="mt-4">
					<div class="mb-4 flex justify-center md:items-center">
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
						<div class="mb-4 flex items-center justify-end">
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

					{#if currentWeekData}
						{#if $isMobile}
							<div class="relative">
								{#if !isFullView}
									<div
										class="w-full"
										in:fade={{ duration: 500, easing: quintOut }}
										out:fade={{ duration: 500, easing: quintOut }}
									>
										<div
											class="mb-4 grid gap-1"
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
									/>
								{/if}
							{/each}
						{/if}

						{#if filteredDays.length === 0}
							<div class="text-center">
								<p class="text-xl font-bold text-green-500">
									На этой неделе в группе нет пар
								</p>
								<img src={imageChill} alt="Chill" class="mx-auto mt-4 rounded-lg" />
							</div>
						{/if}
					{/if}
				</div>
			{/if}

			<HiddenSubjects {selectedGroup} />
		</section>

		{#if scheduleData && selectedSemester && Object.keys(currentTeacherSubgroups).length > 0}
			<section class="mt-4 rounded-2xl bg-slate-800 p-4 sm:p-6">
				<SubgroupsStatistics
					teacherSubgroups={currentTeacherSubgroups}
					{scheduleData}
					{selectedSemester}
				/>
			</section>
		{/if}

		<GithubApiSection />
	</main>

	<Footer />
	<NotificationsContainer />
</PageLayout>

<SubgroupSettingsModal
	isOpen={isSubgroupModalOpen}
	{scheduleData}
	{selectedSemester}
	settings={currentSubgroupSettings}
	onSave={handleSubgroupSettingsSave}
	onClose={closeSubgroupModal}
/>

{#if isScheduleLoading && !isViewChanging}
	<LoadingOverlay />
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
