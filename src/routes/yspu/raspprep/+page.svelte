<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import TeacherScheduleForm from './components/TeacherScheduleForm.svelte';
	import TeacherScheduleDay from './components/TeacherScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { getTeachers, getTeacherSchedule } from './api';
	import type { Teacher } from './api';
	import GithubParserInfo from '../rasp/components/GithubParserInfo.svelte';

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
			if (teacherFromURL) {
				selectedTeacher = teacherFromURL;
				await loadSchedule();
			} else {
				const lastTeacher = localStorage.getItem('lastTeacher');
				if (lastTeacher) {
					selectedTeacher = lastTeacher;
					await loadSchedule();
				}
			}
		} catch (error) {
			console.error('Error loading teachers:', error);
			notifications.add('Ошибка при загрузке списка преподавателей', 'error');
		} finally {
			isLoading = false;
		}
	});

	async function loadSchedule() {
		const teacher = teachers.find((t) => t.name === selectedTeacher);
		if (!teacher) return;

		try {
			isScheduleLoading = true;
			scheduleData = await getTeacherSchedule(teacher.id);
			localStorage.setItem('lastTeacher', selectedTeacher);
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
</script>

<svelte:head>
	<title>Расписание преподавателей ЯГПУ | ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий преподавателей ЯГПУ. Удобный поиск расписания по преподавателям, просмотр лекций, практик и лабораторных работ"
	/>
	<meta
		name="keywords"
		content="расписание преподавателей ЯГПУ, ЯГПУ преподаватели расписание, поиск преподавателей ЯГПУ, расписание пар преподавателей"
	/>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="sаm:p-6 mt-8 rounded-2xl bg-slate-800 p-4">
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
				<span
					class="mb-6 ml-2 flex rounded-full bg-indigo-500 px-2 py-1 text-xs font-bold uppercase"
					>Beta</span
				>
			</div>

			<TeacherScheduleForm
				{teachers}
				bind:selectedTeacher
				onSubmit={loadSchedule}
				{isLoading}
			/>

			{#if scheduleData}
				<div class="mt-2">
					{#if scheduleData.items.length > 0}
						<ScheduleTitle
							type="teacher"
							title={scheduleData.items[0].courseInfo.name}
							subtitle={scheduleData.items[0].courseInfo.startDate
								? `Начало обучения с ${scheduleData.items[0].courseInfo.startDate}`
								: undefined}
						/>

						{#each days as day, dayIndex}
							{@const dayLessons = scheduleData.items[0].days
								.filter((d: { info: { type: number } }) => d.info.type === dayIndex)
								.flatMap((d: { lessons: any[] }) => d.lessons)}
							{#if dayLessons.length > 0}
								<TeacherScheduleDay dayName={day} lessons={dayLessons} />
							{/if}
						{/each}
					{:else}
						<div class="p-4 text-center text-xl text-white">
							У преподавателя нет занятий
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

<style>
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
