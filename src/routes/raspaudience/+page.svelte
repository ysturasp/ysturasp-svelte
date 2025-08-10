<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import AudienceScheduleForm from './components/AudienceScheduleForm.svelte';
	import AudienceScheduleDay from './components/AudienceScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { getAudiences, getAudienceSchedule } from './api';
	import {
		getCurrentWeek,
		isDateInCurrentSemester,
		groupLessonsByDay,
		SEMESTER_WEEKS_COUNT,
		getCurrentWeekMessage,
		getCurrentSemester,
		detectAvailableSemesters,
		isDateInSemester,
		type SemesterInfo
	} from '$lib/utils/semester';
	import type { Audience } from './api';
	import type { AudienceScheduleData } from './types';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import GithubApiSection from '$lib/components/sections/GithubApiSection.svelte';
	import type { Settings } from '$lib/stores/settings';

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

	let isLoading = false;
	let isScheduleLoading = false;
	let audiences: Audience[] = [];
	let selectedAudience = '';
	let selectedWeek = 1;
	let scheduleData: AudienceScheduleData | null = null;
	let availableSemesters: SemesterInfo[] = [];
	let selectedSemester: SemesterInfo | null = null;

	const days = [
		'Понедельник',
		'Вторник',
		'Среда',
		'Четверг',
		'Пятница',
		'Суббота',
		'Воскресенье'
	];

	onMount(async () => {
		try {
			isLoading = true;
			audiences = await getAudiences();
			selectedSemester = getCurrentSemester();

			for (let i = 0; i < audiences.length; i++) {
				if (audiences[i].name === '.') {
					audiences = audiences.slice(0, i).concat(audiences.slice(i + 1));
					break;
				}
			}

			const urlParams = new URLSearchParams(window.location.search);
			const audienceFromURL = urlParams.get('audience');
			const weekFromURL = urlParams.get('week');
			const semesterFromURL = urlParams.get('semester');

			if (audienceFromURL) {
				selectedAudience = decodeURIComponent(audienceFromURL);
			} else {
				const lastAudience = localStorage.getItem('lastAudience');
				if (lastAudience) {
					selectedAudience = lastAudience;
				}
			}

			if (weekFromURL) {
				selectedWeek = parseInt(weekFromURL, 10) || 1;
			} else {
				const lastWeek = localStorage.getItem('lastWeek');
				if (lastWeek) {
					selectedWeek = parseInt(lastWeek, 10) || 1;
				} else {
					selectedWeek = getCurrentWeek();
				}
			}

			if (selectedAudience && selectedWeek) {
				await loadSchedule();

				if (semesterFromURL && availableSemesters.length > 0) {
					const semesterFromParams = availableSemesters.find(
						(s) => s.id === semesterFromURL
					);
					if (semesterFromParams) {
						selectedSemester = semesterFromParams;
					}
				}
			}
		} catch (error) {
			console.error('Error loading audiences:', error);
			notifications.add('Ошибка при загрузке списка аудиторий', 'error');
		} finally {
			isLoading = false;
		}
	});

	function changeSemester(semester: SemesterInfo) {
		selectedSemester = semester;
		updateURL();
	}

	async function loadSchedule() {
		const audience = audiences.find((a) => a.name === selectedAudience);
		if (!audience) return;

		try {
			isScheduleLoading = true;
			scheduleData = await getAudienceSchedule(audience.id);
			availableSemesters = detectAvailableSemesters(scheduleData);

			if (
				availableSemesters.length > 0 &&
				!availableSemesters.find((s) => s.id === selectedSemester?.id)
			) {
				selectedSemester = availableSemesters[0];
			}

			localStorage.setItem('lastAudience', selectedAudience);
			localStorage.setItem('lastWeek', selectedWeek.toString());

			updateURL();
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

	function changeWeek(delta: number) {
		const newWeek = selectedWeek + delta;
		if (newWeek >= 1 && newWeek <= SEMESTER_WEEKS_COUNT) {
			selectedWeek = newWeek;
			localStorage.setItem('lastWeek', selectedWeek.toString());
			updateURL();
		}
	}

	function updateURL() {
		const url = new URL(window.location.href);
		url.searchParams.set('audience', selectedAudience);
		url.searchParams.set('week', selectedWeek.toString());
		if (selectedSemester) {
			url.searchParams.set('semester', selectedSemester.id);
		}
		replaceState(url, { noscroll: true });
	}

	function getDayNameByIndex(index: number): string {
		return days[index] || 'Неизвестный день';
	}

	$: filteredWeek = scheduleData?.items?.find((week: any) => {
		if (week.number !== selectedWeek) return false;

		const filterFn = selectedSemester
			? (day: any) => isDateInSemester(day.info.date, selectedSemester!)
			: (day: any) => isDateInCurrentSemester(day.info.date);

		return week.days.some(filterFn);
	});

	$: dayLessons = filteredWeek
		? groupLessonsByDay(filteredWeek, selectedSemester || undefined)
		: {};
</script>

<svelte:head>
	<title>Расписание аудиторий ЯГТУ | ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий в аудиториях ЯГТУ. Удобный поиск и просмотр расписания по конкретным аудиториям"
	/>
	<meta
		name="keywords"
		content="расписание аудиторий ЯГТУ, ЯГТУ аудитории, поиск аудиторий ЯГТУ, расписание пар аудиторий, занятость аудиторий"
	/>
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="ystu"
			pageType="audience"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="ystu"
			pageType="audience"
		/>
		<div slot="personal-account-ystu">
			<a
				href="https://ystu.expo.app"
				target="_blank"
				class="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-blue-400 ring-1 ring-blue-500/50 transition-all hover:text-blue-300 hover:ring-blue-400 md:h-12 md:w-12"
				aria-label="Открыть профиль"
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

			<AudienceScheduleForm
				{audiences}
				bind:selectedAudience
				bind:selectedWeek
				onSubmit={loadSchedule}
				{isLoading}
				submitButtonText="Показать расписание"
				copyButtonText="Скопировать ссылку на расписание"
			/>

			{#if scheduleData && selectedAudience}
				<div class="mt-4">
					<div class="mb-2 flex justify-center md:items-center">
						<button
							on:click={() => changeWeek(-1)}
							class="mr-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={selectedWeek <= 1}
						>
							👈
						</button>

						<div class="flex flex-col justify-center md:items-center">
							<ScheduleTitle
								type="audience"
								title={`${selectedAudience}`}
								weekNumber={selectedWeek}
								{availableSemesters}
								{selectedSemester}
								onSemesterSelect={changeSemester}
							/>
						</div>

						<button
							on:click={() => changeWeek(1)}
							class="ml-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={selectedWeek >= SEMESTER_WEEKS_COUNT}
						>
							👉
						</button>
					</div>

					{#if filteredWeek && Object.keys(dayLessons).length > 0}
						{#each Object.entries(dayLessons) as [dayIndex, dayData]}
							{@const dayIndexNum = parseInt(dayIndex)}
							{#if dayData.lessons.length > 0}
								<AudienceScheduleDay
									dayName={getDayNameByIndex(dayIndexNum)}
									date={dayData.date}
									lessons={dayData.lessons}
								/>
							{/if}
						{/each}
					{:else}
						<div class="text-center">
							<p class="text-xl font-bold text-green-500">
								На этой неделе в аудитории нет пар
							</p>
							<img
								src="https://steamuserimages-a.akamaihd.net/ugc/543050193621050493/822D951ADFCB3C9ADE095AC49917043365AFD48E/"
								alt="Chill"
								class="mx-auto mt-4 rounded-lg"
							/>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		{#if currentSettings.showAPILink}
			<GithubApiSection />
		{/if}
	</main>

	<Footer />
	<NotificationsContainer hasScheduleSwitcher={true} />
</PageLayout>

<ScheduleSwitcher {selectedSemester} onSemesterChange={changeSemester} currentPage="audiences" />

{#if isScheduleLoading}
	<LoadingOverlay />
{/if}
