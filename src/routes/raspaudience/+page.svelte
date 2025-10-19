<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import ScheduleLoadingSkeleton from '$lib/components/loading/ScheduleLoadingSkeleton.svelte';
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
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import GithubApiSection from '$lib/components/sections/GithubApiSection.svelte';
	import type { Settings } from '$lib/stores/settings';
	import { reachGoal } from '$lib/utils/metrika';
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
	let audiences: Audience[] = [];
	let selectedAudience = '';
	let selectedWeek = 1;
	let scheduleData: AudienceScheduleData | null = null;
	let availableSemesters: SemesterInfo[] = [];
	let selectedSemester: SemesterInfo | null = null;
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

		isFullView = localStorage.getItem('isFullViewAudience') === 'true';
		selectedDay = parseInt(localStorage.getItem('lastSelectedDayAudience') || '0', 10);

		const loadData = async () => {
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
		};

		loadData();

		return () => {
			window.removeEventListener('resize', checkMobile);
		};
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

	function handleViewChange() {
		isViewChanging = true;
		localStorage.setItem('isFullViewAudience', isFullView.toString());
		if (!isFullView && daysWithLessons.length > 0) {
			selectedDay = daysWithLessons[0];
			localStorage.setItem('lastSelectedDayAudience', selectedDay.toString());
		} else {
			localStorage.removeItem('lastSelectedDayAudience');
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

	$: daysWithLessons = Object.keys(dayLessons)
		.filter((dayIndex) => dayLessons[dayIndex as any]?.lessons?.length > 0)
		.map((dayIndex) => parseInt(dayIndex));

	$: {
		if ($isMobile && !isFullView && daysWithLessons.length > 0) {
			if (!daysWithLessons.includes(selectedDay)) {
				selectedDay = daysWithLessons[0];
				localStorage.setItem('lastSelectedDayAudience', selectedDay.toString());
			}
		}
	}
</script>

<svelte:head>
	<title>
		{selectedAudience
			? `Расписание аудитории ${selectedAudience} ЯГТУ`
			: 'Расписание аудиторий ЯГТУ | Поиск по аудиториям'}
	</title>
	<meta
		name="description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${selectedAudience} ЯГТУ. Полное расписание лекций, практик и лабораторных работ.`
			: 'Актуальное расписание занятий в аудиториях ЯГТУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий.'}
	/>
	<meta
		name="keywords"
		content={`расписание аудиторий ЯГТУ, ${
			selectedAudience
				? `расписание ${selectedAudience}, аудитория ${selectedAudience}, `
				: ''
		}ЯГТУ аудитории расписание, поиск аудиторий ЯГТУ, расписание пар в аудиториях, занятость аудиторий ЯГТУ, свободные аудитории ЯГТУ`}
	/>

	<meta
		property="og:title"
		content={selectedAudience
			? `Расписание аудитории ${selectedAudience} ЯГТУ`
			: 'Расписание аудиторий ЯГТУ | Поиск по аудиториям'}
	/>
	<meta
		property="og:description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${selectedAudience} ЯГТУ. Полное расписание лекций, практик и лабораторных работ.`
			: 'Актуальное расписание занятий в аудиториях ЯГТУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий.'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedAudience}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`https://ysturasp.netlify.app/raspaudience?audience=${encodeURIComponent(selectedAudience)}`}
		/>
	{/if}
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
		<OnlineCounter
			variant="desktop"
			slot="online-counter-desktop"
			selectedGroupLabel={selectedAudience}
			selectedDirectionLabel=""
		/>
		<OnlineCounter
			variant="mobile"
			slot="online-counter-mobile"
			selectedGroupLabel={selectedAudience}
			selectedDirectionLabel=""
		/>
		<div slot="personal-account-ystu">
			<a
				on:click={() => reachGoal('ystu_lk_click')}
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

			{#if scheduleData && selectedAudience && !isScheduleLoading}
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

					{#if filteredWeek && Object.keys(dayLessons).length > 0}
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
															'lastSelectedDayAudience',
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

										{#if dayLessons[selectedDay] && (dayLessons[selectedDay] as any)?.lessons?.length > 0}
											<AudienceScheduleDay
												dayName={getDayNameByIndex(selectedDay)}
												date={(dayLessons[selectedDay] as any)?.date}
												lessons={(dayLessons[selectedDay] as any)?.lessons}
											/>
										{/if}
									</div>
								{:else}
									<div
										class="w-full"
										in:fade={{ duration: 500, easing: quintOut }}
										out:fade={{ duration: 500, easing: quintOut }}
									>
										{#each Object.entries(dayLessons) as [dayIndex, dayData]}
											{@const dayIndexNum = parseInt(dayIndex)}
											{#if dayData?.lessons?.length > 0}
												<AudienceScheduleDay
													dayName={getDayNameByIndex(dayIndexNum)}
													date={dayData?.date}
													lessons={dayData?.lessons}
												/>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
						{:else}
							{#each Object.entries(dayLessons) as [dayIndex, dayData]}
								{@const dayIndexNum = parseInt(dayIndex)}
								{#if (dayData as any)?.lessons?.length > 0}
									<AudienceScheduleDay
										dayName={getDayNameByIndex(dayIndexNum)}
										date={(dayData as any)?.date}
										lessons={(dayData as any)?.lessons}
									/>
								{/if}
							{/each}
						{/if}
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
			{:else if isScheduleLoading && selectedAudience}
				<div class="mt-4">
					<ScheduleLoadingSkeleton
						{isFullView}
						isMobile={$isMobile}
						daysCount={daysWithLessons.length || 5}
					/>
				</div>
			{/if}
		</section>

		{#if currentSettings.showAPILink}
			<GithubApiSection />
		{/if}
	</main>

	<Footer class_name="pb-28 md:pb-18" />
	<NotificationsContainer hasScheduleSwitcher={true} />
</PageLayout>

<ScheduleSwitcher {selectedSemester} onSemesterChange={changeSemester} currentPage="audiences" />

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
