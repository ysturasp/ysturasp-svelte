<script lang="ts">
	import type { TeacherSubgroups, SubgroupInfo } from '../stores/subgroups';
	import type { SemesterInfo } from '$lib/utils/semester';
	import type { ScheduleData } from '../types';
	import { isDateInSemester, getWeekNumberByDate } from '$lib/utils/semester';
	import * as Carousel from '$lib/components/ui/carousel';

	export let teacherSubgroups: TeacherSubgroups = {};
	export let scheduleData: ScheduleData | null = null;
	export let selectedSemester: SemesterInfo | null = null;

	interface SubgroupStats {
		subject: string;
		teacher: string;
		subgroup1Count: number;
		subgroup2Count: number;
		vucCount: number;
		totalLessons: number;
		distributedLessons: number;
		isStreamLesson: boolean;
		dates: {
			date: string;
			time: string;
			week: number;
			subgroup: number;
			isVUC: boolean;
			isNext: boolean;
		}[];
	}

	$: stats = calculateStats(teacherSubgroups, scheduleData, selectedSemester);
	$: hasUnbalancedDistribution = stats.some(
		(stat) => Math.abs(stat.subgroup1Count - stat.subgroup2Count) > 1
	);

	function calculateStats(
		data: TeacherSubgroups,
		schedule: ScheduleData | null,
		semester: SemesterInfo | null
	): SubgroupStats[] {
		if (!schedule || !semester) return [];

		const result: SubgroupStats[] = [];
		const groupedSubjects = new Map<string, any>();

		for (const [key, teacherData] of Object.entries(data)) {
			if (!teacherData.dates) continue;

			const [subject, teacher] = key.split('_');
			const groupKey = subject === 'null' ? `${subject}_${teacher}` : subject;

			if (!groupedSubjects.has(groupKey)) {
				groupedSubjects.set(groupKey, { dates: {}, teacher });
			}
			Object.assign(groupedSubjects.get(groupKey).dates, teacherData.dates);
		}

		for (const [groupKey, subjectData] of groupedSubjects) {
			const dates = subjectData.dates || {};
			const [subject, teacher] = groupKey.split('_');

			const subgroup1Dates = Object.entries(dates).filter(
				([_, info]) => (info as SubgroupInfo).subgroup === 1
			);
			const subgroup2Dates = Object.entries(dates).filter(
				([_, info]) => (info as SubgroupInfo).subgroup === 2
			);
			const vucDays = Object.entries(dates).filter(
				([_, info]) => (info as SubgroupInfo).isVUC
			);

			const totalLessons = countTotalLessons(schedule, subject, semester);
			const distributedLessons = subgroup1Dates.length + subgroup2Dates.length;

			const isStreamLesson = checkIfStreamLesson(schedule, subject);

			const allDates = [
				...subgroup1Dates.map(([dateTime, info]) => ({
					...formatDateTime(dateTime),
					subgroup: 1,
					isVUC: (info as SubgroupInfo).isVUC
				})),
				...subgroup2Dates.map(([dateTime, info]) => ({
					...formatDateTime(dateTime),
					subgroup: 2,
					isVUC: (info as SubgroupInfo).isVUC
				}))
			].sort(
				(a, b) =>
					new Date(a.date.split('.').reverse().join('-')).getTime() -
					new Date(b.date.split('.').reverse().join('-')).getTime()
			);

			const today = new Date();
			today.setHours(0, 0, 0, 0);

			for (let subgroup = 1; subgroup <= 2; subgroup++) {
				const subgroupDates = allDates.filter((d) => d.subgroup === subgroup);
				const nextLesson = subgroupDates.find((d) => {
					const lessonDate = new Date(d.date.split('.').reverse().join('-'));
					return lessonDate > today;
				});
				if (nextLesson) {
					nextLesson.isNext = true;
				}
			}

			const displayName = subject === 'null' ? `null (${subjectData.teacher})` : subject;

			result.push({
				subject: displayName,
				teacher: subjectData.teacher,
				subgroup1Count: subgroup1Dates.length,
				subgroup2Count: subgroup2Dates.length,
				vucCount: vucDays.length,
				totalLessons,
				distributedLessons,
				isStreamLesson,
				dates: allDates
			});
		}

		return result;
	}

	function countTotalLessons(
		schedule: ScheduleData,
		subject: string,
		semester: SemesterInfo
	): number {
		let count = 0;
		schedule.items.forEach((weekItem) => {
			weekItem.days.forEach((day) => {
				if (!isDateInSemester(day.info.date, semester)) return;

				if (day.lessons) {
					count += day.lessons.filter(
						(l) => l.lessonName === subject && l.type === 8
					).length;
				}
			});
		});
		return count;
	}

	function checkIfStreamLesson(schedule: ScheduleData, subject: string): boolean {
		for (const weekItem of schedule.items) {
			for (const day of weekItem.days) {
				const lesson = day.lessons?.find((l) => l.lessonName === subject && l.type === 8);
				if (lesson) {
					return !lesson.isDivision;
				}
			}
		}
		return false;
	}

	function formatDateTime(dateTimeStr: string) {
		const [date, time] = dateTimeStr.split('_');
		return {
			date,
			time: time ? time.replace('-', ' - ') : '',
			week: getWeekNumber(date),
			isNext: false
		};
	}

	function getWeekNumber(dateStr: string): number {
		if (!selectedSemester) return 0;
		const [day, month, year] = dateStr.split('.');
		const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
		return getWeekNumberByDate(date, selectedSemester);
	}

	function getDayOfWeek(dateStr: string): string {
		const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
		const date = new Date(dateStr.split('.').reverse().join('-'));
		return days[date.getDay()];
	}
</script>

{#if Object.keys(teacherSubgroups).length > 0}
	<section class="mt-4 rounded-2xl bg-slate-800">
		<h3 class="mb-4 text-2xl font-semibold text-white">📊 Распределение подгрупп</h3>

		{#if hasUnbalancedDistribution}
			<div class="rounded-lg bg-red-900/50 p-6 text-center">
				<div class="flex flex-col items-center gap-4">
					<svg
						class="h-12 w-12 text-red-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<h3 class="text-xl font-bold text-white">
						Обнаружено неравномерное распределение подгрупп
					</h3>
					<p class="text-gray-300">
						Произошел сбой в алгоритме распределения. Пожалуйста, обновите страницу.
					</p>
					<button
						on:click={() => location.reload()}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700"
					>
						<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
							/>
						</svg>
						Обновить страницу
					</button>
				</div>
			</div>
		{:else if stats.length > 0}
			<Carousel.Root
				opts={{
					align: 'center',
					loop: false
				}}
				class="w-full"
			>
				<div class="mb-4 flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Carousel.Previous
							class="static h-8 w-8 translate-y-0 rounded-lg bg-slate-800 text-white"
						/>
						<Carousel.Next
							class="static h-8 w-8 translate-y-0 rounded-lg bg-slate-800 text-white"
						/>
					</div>
					<div class="text-sm text-gray-400">
						{stats.length}
						{stats.length === 1
							? 'предмет'
							: stats.length < 5
								? 'предмета'
								: 'предметов'}
					</div>
				</div>

				<Carousel.Content class="-ml-2 md:-ml-4">
					{#each stats as stat}
						<Carousel.Item class="basis-full pl-2 md:pl-4">
							<div
								class="rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow backdrop-blur"
							>
								<div class="mb-2 flex items-center justify-between gap-2">
									<h5 class="text-lg font-medium text-white">{stat.subject}</h5>
									{#if stat.isStreamLesson}
										<span class="rounded-full bg-yellow-600 px-2 py-1 text-xs"
											>Всей группой</span
										>
									{:else}
										<span class="rounded-full bg-green-600 px-2 py-1 text-xs"
											>По подгруппам</span
										>
									{/if}
								</div>

								<div class="mb-2 grid grid-cols-3 gap-4">
									<div class="rounded-2xl bg-gray-800 p-3 text-center">
										<span class="text-sm text-blue-400">1-я подгр.</span>
										<div class="text-2xl font-bold text-white">
											{stat.subgroup1Count}
										</div>
										<span class="text-sm text-gray-400">занятий</span>
									</div>
									<div class="rounded-2xl bg-gray-800 p-3 text-center">
										<span class="text-sm text-blue-400">2-я подгр.</span>
										<div class="text-2xl font-bold text-white">
											{stat.subgroup2Count}
										</div>
										<span class="text-sm text-gray-400">занятий</span>
									</div>
									<div class="rounded-2xl bg-gray-800 p-3 text-center">
										<span class="text-sm text-blue-400">ВУЦ</span>
										<div class="text-2xl font-bold text-white">
											{stat.vucCount}
										</div>
										<span class="text-sm text-gray-400">дней</span>
									</div>
								</div>

								<div class="mb-2 text-xs text-gray-400">
									* Синяя полоса слева означает день с ВУЦ
								</div>

								<div class="grid grid-cols-2 gap-2">
									<div class="space-y-2">
										<h6 class="font-medium text-blue-400">1-я подгруппа</h6>
										<div class="grid gap-2">
											{#each stat.dates.filter((d) => d.subgroup === 1) as dateInfo}
												<div
													class="relative rounded-xl bg-gray-800 p-2 text-sm {dateInfo.isVUC
														? 'border-l-2 border-blue-400'
														: ''} {dateInfo.isNext
														? 'border-2 border-green-500'
														: ''}"
												>
													<div class="flex items-center gap-2">
														<span class="text-white"
															>{dateInfo.date}</span
														>
														<span class="text-xs text-gray-400"
															>({getDayOfWeek(dateInfo.date)})</span
														>
														{#if dateInfo.isVUC}
															<span
																class="ml-auto text-xs text-blue-400"
																>(ВУЦ)</span
															>
														{/if}
													</div>
													<div class="text-xs text-yellow-400">
														{dateInfo.week} неделя
													</div>
													{#if dateInfo.time}
														<div class="text-xs text-gray-400">
															{dateInfo.time}
														</div>
													{/if}
													{#if dateInfo.isNext}
														<div
															class="absolute -top-8 left-1/2 z-10 -translate-x-1/2 transform rounded-xl border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white"
														>
															Следующее занятие
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>

									<div class="space-y-2">
										<h6 class="font-medium text-blue-400">2-я подгруппа</h6>
										<div class="grid gap-2">
											{#each stat.dates.filter((d) => d.subgroup === 2) as dateInfo}
												<div
													class="relative rounded-xl bg-gray-800 p-2 text-sm {dateInfo.isVUC
														? 'border-l-2 border-blue-400'
														: ''} {dateInfo.isNext
														? 'border-2 border-green-500'
														: ''}"
												>
													<div class="flex items-center gap-2">
														<span class="text-white"
															>{dateInfo.date}</span
														>
														<span class="text-xs text-gray-400"
															>({getDayOfWeek(dateInfo.date)})</span
														>
														{#if dateInfo.isVUC}
															<span
																class="ml-auto text-xs text-blue-400"
																>(ВУЦ)</span
															>
														{/if}
													</div>
													<div class="text-xs text-yellow-400">
														{dateInfo.week} неделя
													</div>
													{#if dateInfo.time}
														<div class="text-xs text-gray-400">
															{dateInfo.time}
														</div>
													{/if}
													{#if dateInfo.isNext}
														<div
															class="absolute -top-8 left-1/2 z-10 -translate-x-1/2 transform rounded-xl border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white"
														>
															Следующее занятие
														</div>
													{/if}
												</div>
											{/each}
										</div>
									</div>
								</div>
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
			</Carousel.Root>
		{/if}
	</section>
{/if}
