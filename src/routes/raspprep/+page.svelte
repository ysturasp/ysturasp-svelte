<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import TeacherScheduleForm from './components/TeacherScheduleForm.svelte';
	import TeacherScheduleDay from './components/TeacherScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import GithubParserInfo from './components/GithubParserInfo.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { getTeachers, getTeacherSchedule } from './api';
	import type { Teacher } from './api';
	import type { TeacherScheduleData } from './types';

	let isLoading = false;
	let isScheduleLoading = false;
	let teachers: Teacher[] = [];
	let selectedTeacher = '';
	let selectedWeek = 1;
	let scheduleData: TeacherScheduleData | null = null;

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
			teachers = await getTeachers();

			const urlParams = new URLSearchParams(window.location.search);
			const teacherFromURL = urlParams.get('teacher');
			const weekFromURL = urlParams.get('week');

			if (teacherFromURL) {
				selectedTeacher = decodeURIComponent(teacherFromURL);
			} else {
				const lastTeacher = localStorage.getItem('lastTeacher');
				if (lastTeacher) {
					selectedTeacher = lastTeacher;
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

			if (selectedTeacher && selectedWeek) {
				await loadSchedule();
			}
		} catch (error) {
			console.error('Error loading teachers:', error);
			notifications.add('Ошибка при загрузке списка преподавателей', 'error');
		} finally {
			isLoading = false;
		}
	});

	function getCurrentWeek(): number {
		const today = new Date();
		const currentMonth = today.getMonth();

		if (currentMonth >= 1 && currentMonth <= 5) {
			const weeksSinceFebruary = Math.floor(
				(today.getTime() - new Date(today.getFullYear(), 1, 3).getTime()) /
					(7 * 24 * 60 * 60 * 1000)
			);
			return Math.max(1, Math.min(18, weeksSinceFebruary + 1));
		} else if (currentMonth >= 8 || currentMonth === 0) {
			const startDate =
				currentMonth >= 8
					? new Date(today.getFullYear(), 8, 1)
					: new Date(today.getFullYear() - 1, 8, 1);
			const weeksSinceStart = Math.floor(
				(today.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
			);
			return Math.max(1, Math.min(18, weeksSinceStart + 1));
		}
		return 1;
	}

	async function loadSchedule() {
		const teacher = teachers.find((t) => t.name === selectedTeacher);
		if (!teacher) return;

		try {
			isScheduleLoading = true;
			scheduleData = await getTeacherSchedule(teacher.id);

			localStorage.setItem('lastTeacher', selectedTeacher);
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
		if (newWeek >= 1 && newWeek <= 18) {
			selectedWeek = newWeek;
			localStorage.setItem('lastWeek', selectedWeek.toString());
			updateURL();
		}
	}

	function updateURL() {
		const url = new URL(window.location.href);
		url.searchParams.set('teacher', selectedTeacher);
		url.searchParams.set('week', selectedWeek.toString());
		window.history.replaceState({}, '', url.toString());
	}

	function getDayNameByIndex(index: number): string {
		return days[index] || 'Неизвестный день';
	}

	$: filteredWeek = scheduleData?.items?.find((week) => week.number === selectedWeek);

	$: dayLessons = filteredWeek
		? (() => {
				const lessonsByDay: { [key: number]: { date: string; lessons: any[] } } = {};

				filteredWeek.days.forEach((day) => {
					const dayDate = new Date(day.info.date);
					const dayOfWeek = (dayDate.getDay() + 6) % 7;

					if (!lessonsByDay[dayOfWeek]) {
						lessonsByDay[dayOfWeek] = {
							date: day.info.date,
							lessons: []
						};
					}

					lessonsByDay[dayOfWeek].lessons.push(...day.lessons);
				});

				return lessonsByDay;
			})()
		: {};
</script>

<svelte:head>
	<title>Расписание преподавателей ЯГТУ | ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий преподавателей ЯГТУ. Удобный поиск расписания по преподавателям, просмотр лекций, практик и лабораторных работ"
	/>
	<meta
		name="keywords"
		content="расписание преподавателей ЯГТУ, ЯГТУ преподаватели расписание, поиск преподавателей ЯГТУ, расписание пар преподавателей"
	/>
</svelte:head>

<PageLayout>
	<Header />

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
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-3xl font-semibold text-white">📅</h2>
				<h2 class="text-md ml-2 font-semibold text-white md:text-4xl">
					Расписание преподавателей
				</h2>
			</div>

			<TeacherScheduleForm
				{teachers}
				bind:selectedTeacher
				bind:selectedWeek
				onSubmit={loadSchedule}
				{isLoading}
				submitButtonText="Показать расписание"
				copyButtonText="Скопировать ссылку на расписание"
			/>

			{#if scheduleData && selectedTeacher}
				<div class="mt-4">
					<div class="mb-4 flex items-center justify-center">
						<button
							on:click={() => changeWeek(-1)}
							class="mr-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={selectedWeek <= 1}
						>
							👈
						</button>

						<ScheduleTitle
							type="teacher"
							title={`${selectedTeacher.split(' ')[0]} ${selectedTeacher.split(' ')[1]?.[0] || ''}${selectedTeacher.split(' ')[2]?.[0] || ''}`}
							subtitle={`Неделя ${selectedWeek}`}
						/>

						<button
							on:click={() => changeWeek(1)}
							class="ml-2 rounded-lg bg-blue-700 p-2 text-3xl text-white transition-all hover:bg-blue-600"
							disabled={selectedWeek >= 18}
						>
							👉
						</button>
					</div>

					{#if filteredWeek && Object.keys(dayLessons).length > 0}
						{#each Object.entries(dayLessons) as [dayIndex, dayData]}
							{@const dayIndexNum = parseInt(dayIndex)}
							{#if dayData.lessons.length > 0}
								<TeacherScheduleDay
									dayName={getDayNameByIndex(dayIndexNum)}
									date={dayData.date}
									lessons={dayData.lessons}
								/>
							{/if}
						{/each}
					{:else}
						<div class="p-4 text-center">
							<p class="text-xl font-bold text-green-500">
								На этой неделе у преподавателя нет пар
							</p>
							<img
								src="https://steamuserimages-a.akamaihd.net/ugc/543050193621050493/822D951ADFCB3C9ADE095AC49917043365AFD48E/"
								alt="Chill"
								class="mx-auto my-4 rounded-lg"
							/>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<GithubParserInfo />
	</main>

	<Footer />
	<NotificationsContainer />
</PageLayout>

{#if isScheduleLoading}
	<LoadingOverlay />
{/if}
