<script lang="ts">
	import { onMount } from 'svelte';
	import { getAudiences, getAudienceSchedule } from './api';
	import { replaceState } from '$app/navigation';
	import type { AudienceScheduleData } from '$lib/types/schedule';
	import type { Audience } from './api';
	import ScheduleLoadingSkeleton from '$lib/components/loading/ScheduleLoadingSkeleton.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import AudienceScheduleForm from './components/AudienceScheduleForm.svelte';
	import AudienceScheduleDay from './components/AudienceScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import { notifications } from '$lib/stores/notifications';
	import GithubParserInfo from '../rasp/components/GithubParserInfo.svelte';
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import { page } from '$app/state';
	import type { Settings } from '$lib/stores/settings';
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
	let scheduleData: AudienceScheduleData | null = null;
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

		isFullView = localStorage.getItem('isFullViewYspuAudience') === 'true';
		selectedDay = parseInt(localStorage.getItem('lastSelectedDayYspuAudience') || '0', 10);

		const loadData = async () => {
			try {
				isLoading = true;
				audiences = await getAudiences();

				const urlParams = new URLSearchParams(window.location.search);
				const audienceFromURL = urlParams.get('audience');
				if (audienceFromURL) {
					const audience = audiences.find((a) => a.id === audienceFromURL);
					if (audience) {
						selectedAudience = audienceFromURL;
						await loadSchedule();
					} else {
						notifications.add('Аудитория не найдена', 'error');
					}
				} else {
					const lastAudience = localStorage.getItem('lastYspuAudience');
					if (lastAudience) {
						const audience = audiences.find((a) => a.id === lastAudience);
						if (audience) {
							selectedAudience = lastAudience;
							await loadSchedule();
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

	async function loadSchedule() {
		try {
			isScheduleLoading = true;

			const params = new URLSearchParams(window.location.search);
			if (selectedAudience) {
				params.set('audience', selectedAudience);
			} else {
				params.delete('audience');
			}
			replaceState(`${window.location.pathname}?${params}`, {});

			scheduleData = await getAudienceSchedule(selectedAudience, '');
			localStorage.setItem('lastYspuAudience', selectedAudience);
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

	function getDisplayAudience(id: string): string {
		const audience = audiences.find((a) => a.id === id);
		return audience ? audience.number : id;
	}

	function handleViewChange() {
		isViewChanging = true;
		localStorage.setItem('isFullViewYspuAudience', isFullView.toString());
		if (!isFullView && daysWithLessons.length > 0) {
			selectedDay = daysWithLessons[0];
			localStorage.setItem('lastSelectedDayYspuAudience', selectedDay.toString());
		} else {
			localStorage.removeItem('lastSelectedDayYspuAudience');
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

	$: audienceInfo = selectedAudience ? audiences.find((a) => a.id === selectedAudience) : null;
	$: audienceName = audienceInfo?.number || selectedAudience;

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
				localStorage.setItem('lastSelectedDayYspuAudience', selectedDay.toString());
			}
		}
	}
</script>

<svelte:head>
	<title>
		{selectedAudience
			? `Расписание аудитории ${audienceName} ФСУ ЯГПУ`
			: 'Расписание аудиторий ФСУ ЯГПУ | Поиск по аудиториям'}
	</title>
	<meta
		name="description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${audienceName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий в аудиториях факультета социального управления ЯГПУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий'}
	/>
	<meta
		name="keywords"
		content={`расписание аудиторий ЯГПУ, ${
			selectedAudience ? `расписание ${audienceName}, аудитория ${audienceName}, ` : ''
		}ягпу им ушинского, ФСУ ЯГПУ, факультет социального управления, расписание занятий ЯГПУ, ягпу расписание аудиторий, занятость аудиторий ФСУ, свободные аудитории ФСУ`}
	/>

	<meta
		property="og:title"
		content={selectedAudience
			? `Расписание аудитории ${audienceName} ФСУ ЯГПУ`
			: 'Расписание аудиторий ФСУ ЯГПУ | Поиск по аудиториям'}
	/>
	<meta
		property="og:description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${audienceName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий в аудиториях факультета социального управления ЯГПУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedAudience}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`${page.url.origin}/yspu/raspaudience?audience=${encodeURIComponent(selectedAudience)}`}
		/>
	{/if}
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="yspu"
			pageType="audience"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="yspu"
			pageType="audience"
		/>
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="mb-2 rounded-2xl bg-amber-500 p-4 text-center text-black">
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-4xl font-semibold text-white">🏛️</h2>
				<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
					Расписание аудиторий
				</h2>
			</div>

			<AudienceScheduleForm
				{audiences}
				bind:selectedAudience
				onSubmit={loadSchedule}
				{isLoading}
			/>

			{#if scheduleData && !isScheduleLoading}
				<div class="mt-4">
					{#if scheduleData.items.length > 0}
						<ScheduleTitle
							type="audience"
							title={getDisplayAudience(selectedAudience)}
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
															'lastSelectedDayYspuAudience',
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
											<AudienceScheduleDay
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
												<AudienceScheduleDay
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
									.filter((d) => d.info.type === dayIndex)
									.flatMap((d) => d.lessons)}
								{#if dayLessons.length > 0}
									<AudienceScheduleDay dayName={day} lessons={dayLessons} />
								{/if}
							{/each}
						{/if}
					{:else}
						<div class="p-4 text-center text-xl text-white">
							В аудитории нет занятий
						</div>
					{/if}
				</div>
			{:else if isScheduleLoading && selectedAudience}
				<div class="mt-4">
					<ScheduleLoadingSkeleton
						{isFullView}
						isMobile={$isMobile}
						daysCount={daysWithLessons.length || 7}
						showViewModeToggle={false}
						showWeekSwitcher={false}
					/>
				</div>
			{/if}
		</section>

		{#if currentSettings.showAPILink}
			<GithubParserInfo />
		{/if}
	</main>

	<Footer class_name="pb-38 md:pb-18" />
	<NotificationsContainer />
</PageLayout>

<ScheduleSwitcher
	selectedSemester={null}
	onSemesterChange={() => {}}
	currentPage="audiences"
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
</style>
