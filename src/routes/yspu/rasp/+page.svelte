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
	import LoadingOverlay from './components/LoadingOverlay.svelte';
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
	import type { Settings } from '$lib/stores/settings';

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

	let isLoading = false;
	let isScheduleLoading = false;
	let isBetaModalOpen = false;
	let isViewModeModalOpen = false;
	let directions: Direction[] = [];
	let selectedDirection = '';
	let selectedGroup = '';
	let scheduleData: ScheduleData | null = null;
	let viewMode: 'all' | 'actual' = 'all';
	let groupNumbersMap: Record<string, string> = {};

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

	onMount(async () => {
		try {
			isLoading = true;
			directions = await getDirections();
			viewMode = storage.get('scheduleViewMode', 'all') as 'all' | 'actual';

			const urlParams = new URLSearchParams(window.location.search);
			const urlDirection = urlParams.get('direction');
			const urlGroup = urlParams.get('group');

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
	});

	async function loadSchedule() {
		if (!selectedDirection || !selectedGroup) return;

		try {
			isScheduleLoading = true;
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
		} catch (error) {
			console.error('Error loading schedule:', error);
		} finally {
			isScheduleLoading = false;
		}
	}

	function handleDirectionChange() {
		selectedGroup = '';
		scheduleData = null;
		groupNumbersMap = {};
	}

	function toggleViewMode(mode: 'all' | 'actual') {
		viewMode = mode;
		storage.set('scheduleViewMode', mode);
	}

	function isLessonInDate(lesson: Lesson) {
		if (!lesson.startDate && !lesson.endDate) return true;

		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];

		if (lesson.startDate && lesson.endDate) {
			const startParts = lesson.startDate.split('.');
			const endParts = lesson.endDate.split('.');
			const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
			const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);

			return today >= startDate && today <= endDate;
		} else if (lesson.startDate) {
			const startParts = lesson.startDate.split('.');
			const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
			return today >= startDate;
		} else if (lesson.endDate) {
			const endParts = lesson.endDate.split('.');
			const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
			return today <= endDate;
		}

		return true;
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
					nextLesson.type === currentLesson.type
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

	$: actualGroupNumber = groupNumbersMap[selectedGroup];
</script>

<svelte:head>
	<title>Расписание занятий ЯГПУ | ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий ЯГПУ. Найдите свои занятия по группе"
	/>
	<meta
		name="keywords"
		content="ystuRASP, ягпу им ушинского, расписание ЯГПУ, ЯГПУ, ягпу расписание занятий, ФСУ, факультет социального управления, расписание, ягпу расписание по группам, расписание занятий, расписание студентов"
	/>

	<meta property="og:title" content="Расписание занятий ЯГПУ | ystuRASP" />
	<meta
		property="og:description"
		content="Актуальное расписание занятий ЯГПУ. Найдите свои занятия по группе"
	/>
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
				? directions.find((d) => d.id === selectedDirection)?.name || ''
				: ''}
			selectedGroupLabel={selectedGroup
				? Object.entries(
						directions.find((d) => d.id === selectedDirection)?.courses || {}
					).find(([key]) => key === selectedGroup)?.[1].name || ''
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
				scheduleShown={!!scheduleData}
				{isLoading}
			/>

			{#if scheduleData}
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
						/>

						<ViewModeToggle
							{viewMode}
							onToggle={toggleViewMode}
							onInfoClick={() => (isViewModeModalOpen = true)}
						/>

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
											(lesson) => viewMode === 'all' || isLessonInDate(lesson)
										)
								)}
							{#if dayLessons.length > 0}
								<ScheduleDay dayName={day} lessons={dayLessons} />
							{/if}
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		{#if currentSettings.showAPILink}
			<GithubParserInfo />
		{/if}
	</main>

	<Footer />
	<NotificationsContainer />
</PageLayout>

<ScheduleSwitcher
	selectedSemester={null}
	onSemesterChange={() => {}}
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

{#if isScheduleLoading}
	<LoadingOverlay />
{/if}
