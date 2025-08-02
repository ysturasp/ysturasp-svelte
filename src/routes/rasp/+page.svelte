<script lang="ts">
	import { onMount } from 'svelte';
	import { getInstitutes, getSchedule } from './api';
	import type { Institute, ScheduleData } from './types';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import YSTUScheduleDay from './components/YSTUScheduleDay.svelte';
	import YSTUScheduleForm from './components/YSTUScheduleForm.svelte';
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

	let isLoading = false;
	let isScheduleLoading = false;
	let institutes: Institute[] = [];
	let selectedInstitute = '';
	let selectedGroup = '';
	let selectedWeek = '1';
	let scheduleData: ScheduleData | null = null;
	let favoriteGroups: string[] = [];
	let showFavoriteButton = false;
	let isFavorite = false;
	let availableSemesters: SemesterInfo[] = [];
	let selectedSemester: SemesterInfo | null = null;

	onMount(async () => {
		try {
			isLoading = true;
			institutes = await getInstitutes();
			selectedSemester = getCurrentSemester();

			const urlParams = new URLSearchParams(window.location.search);
			const urlInstitute = urlParams.get('institute');
			const urlGroup = urlParams.get('group');
			const urlWeek = urlParams.get('week');
			const semesterFromURL = urlParams.get('semester');

			if (urlInstitute && urlGroup) {
				selectedInstitute = urlInstitute;
				selectedGroup = urlGroup;

				// Если неделя не указана, используем текущую
				if (urlWeek) {
					selectedWeek = urlWeek;
				} else {
					selectedWeek = getCurrentWeek().toString();
					// Обновляем URL с текущей неделей
					const url = new URL(window.location.href);
					url.searchParams.set('week', selectedWeek);
					window.history.replaceState({}, '', url.toString());
				}

				await loadSchedule();

				// Если семестр не указан, используем текущий или первый доступный
				if (semesterFromURL && availableSemesters.length > 0) {
					const semesterFromParams = availableSemesters.find(
						(s) => s.id === semesterFromURL
					);
					if (semesterFromParams) {
						selectedSemester = semesterFromParams;
					}
				} else if (availableSemesters.length > 0) {
					// Пытаемся найти текущий семестр среди доступных
					const currentSem = getCurrentSemester();
					const foundSemester = availableSemesters.find((s) => s.id === currentSem.id);
					selectedSemester = foundSemester || availableSemesters[0];

					// Обновляем URL с выбранным семестром
					const url = new URL(window.location.href);
					url.searchParams.set('semester', selectedSemester.id);
					window.history.replaceState({}, '', url.toString());
				}
			} else {
				const lastInstitute = localStorage.getItem('lastInstitut');
				const lastGroup = localStorage.getItem('lastGroup');
				const lastWeek = localStorage.getItem('lastWeek');

				if (lastInstitute) {
					selectedInstitute = lastInstitute;
					if (lastGroup) {
						selectedGroup = lastGroup;
						if (lastWeek) {
							selectedWeek = lastWeek;
							await loadSchedule();
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
				availableSemesters = detectAvailableSemesters(scheduleData);
				if (!selectedSemester && availableSemesters.length > 0) {
					selectedSemester = availableSemesters[0];
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
		}
	}

	function updateURL() {
		const url = new URL(window.location.href);
		url.searchParams.set('institute', selectedInstitute);
		url.searchParams.set('group', selectedGroup);
		url.searchParams.set('week', selectedWeek);
		if (selectedSemester) {
			url.searchParams.set('semester', selectedSemester.id);
		}
		window.history.replaceState({}, '', url.toString());
	}

	function changeSemester(semester: SemesterInfo) {
		selectedSemester = semester;
		updateURL();
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

			{#if scheduleData && currentWeekData}
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

					{#each filteredDays as day}
						{#if day.lessons && day.lessons.length > 0}
							<YSTUScheduleDay
								dayName=""
								date={day.info.date}
								lessons={day.lessons}
							/>
						{/if}
					{/each}

					{#if filteredDays.length === 0}
						<div class="text-center">
							<p class="text-xl font-bold text-green-500">
								На этой неделе в группе нет пар
							</p>
							<img
								src="https://steamuserimages-a.akamaihd.net/ugc/543050193621050493/822D951ADFCB3C9ADE095AC49917043365AFD48E/"
								alt="Chill"
								class="mx-auto my-4 rounded-lg"
							/>
						</div>
					{/if}
				</div>
			{:else if scheduleData && !currentWeekData}
				<div class="mt-4 rounded-lg bg-slate-700 p-4">
					<p class="text-center text-white">На выбранной неделе нет занятий</p>
				</div>
			{/if}

			<div class="mt-4 mb-2 rounded-lg border-2 border-red-600 bg-transparent p-2 text-white">
				<p class="text-center text-base">
					Если данные не отображаются, возможно, проблемы API и в данный момент она
					перегружена пользователями. Попробуйте обновить страницу позже.
					<a
						href="https://stats.uptimerobot.com/COz2FUGsub"
						class="text-blue-500 hover:text-blue-300"
						target="_blank"
					>
						Нажми, чтобы узнать о состоянии сервисов сайта
					</a>
					или
					<a href="/support" class="text-blue-500 hover:text-blue-300"
						>напиши в нашу поддержку</a
					>.
				</p>
			</div>
		</section>

		<GithubApiSection />
	</main>

	<Footer />

	{#if isScheduleLoading}
		<LoadingOverlay />
	{/if}
</PageLayout>

<NotificationsContainer />
