<script lang="ts">
	import type { TeacherSubgroups, SubgroupInfo } from '../stores/subgroups';
	import type { SemesterInfo } from '$lib/utils/semester';
	import type { ScheduleData } from '../types';
	import { isDateInSemester, getWeekNumberByDate } from '$lib/utils/semester';
	import * as Carousel from '$lib/components/ui/carousel';

	interface RawDate {
		dateTime: string;
		teacher: string;
		isVUC: boolean;
	}

	export let teacherSubgroups: TeacherSubgroups = {};
	export let scheduleData: ScheduleData | null = null;
	export let selectedSemester: SemesterInfo | null = null;

	interface SubgroupStats {
		subject: string;
		teachers: string[];
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
			teacher: string;
		}[];
	}

	$: stats = calculateStats(teacherSubgroups, scheduleData, selectedSemester);
	$: sortedStats = stats.sort((a, b) => a.isStreamLesson ? 1 : -1);
	$: {
		console.log(
			'Stats:',
			stats.map((stat) => ({
				subject: stat.subject,
				teachers: stat.teachers,
				subgroup1: stat.subgroup1Count,
				subgroup2: stat.subgroup2Count,
				total: stat.subgroup1Count + stat.subgroup2Count
			}))
		);
	}

	$: hasUnbalancedDistribution = stats.some((stat) => {
		const totalCount = stat.subgroup1Count + stat.subgroup2Count;
		const diff = Math.abs(stat.subgroup1Count - stat.subgroup2Count);
		if (totalCount > 1 && diff > 1) {
			console.log('Unbalanced distribution found:', {
				subject: stat.subject,
				subgroup1: stat.subgroup1Count,
				subgroup2: stat.subgroup2Count,
				diff
			});
			return true;
		}
		return false;
	});

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
			const groupKey = subject === 'null' ? key : subject;

			if (!groupedSubjects.has(groupKey)) {
				groupedSubjects.set(groupKey, {
					rawDates: [],
					teachers: new Set(),
					teacherDates: new Map(),
					dates: {},
					subgroup1Count: 0,
					subgroup2Count: 0,
					vucCount: 0
				});
			}
			const group = groupedSubjects.get(groupKey);
			group.teachers.add(teacherData.teacher);

			for (const [dateTime, info] of Object.entries(teacherData.dates)) {
				group.rawDates.push({
					dateTime,
					teacher: teacherData.teacher,
					isVUC: info.isVUC
				});

				if (!group.teacherDates.has(teacherData.teacher)) {
					group.teacherDates.set(teacherData.teacher, []);
				}
				group.teacherDates.get(teacherData.teacher).push({
					dateTime,
					isVUC: info.isVUC
				});
			}
		}

		for (const [groupKey, subjectData] of groupedSubjects) {
			const teachers = Array.from(subjectData.teachers) as string[];
			const canSplitByTeachers =
				teachers.length === 2 && !subjectData.rawDates.some((d: RawDate) => d.isVUC);

			if (canSplitByTeachers) {
				const [teacher1, teacher2] = teachers;
				const teacher1Dates = subjectData.teacherDates.get(teacher1);
				const teacher2Dates = subjectData.teacherDates.get(teacher2);

				if (teacher1Dates.length === teacher2Dates.length) {
					for (const dateInfo of teacher1Dates) {
						const uniqueKey = `${dateInfo.dateTime}_${teacher1}`;
						subjectData.dates[uniqueKey] = {
							subgroup: 1,
							isVUC: false,
							teacher: teacher1,
							originalDateTime: dateInfo.dateTime
						};
						subjectData.subgroup1Count++;
					}

					for (const dateInfo of teacher2Dates) {
						const uniqueKey = `${dateInfo.dateTime}_${teacher2}`;
						subjectData.dates[uniqueKey] = {
							subgroup: 2,
							isVUC: false,
							teacher: teacher2,
							originalDateTime: dateInfo.dateTime
						};
						subjectData.subgroup2Count++;
					}
				} else {
					distributeRegularly(subjectData);
				}
			} else {
				distributeRegularly(subjectData);
			}

			const allDates = Object.entries(subjectData.dates)
				.map(([key, info]: [string, any]) => {
					const [date, time] = info.originalDateTime.split('_');
					return {
						...formatDateTime(`${date}_${time}`),
						subgroup: info.subgroup,
						isVUC: info.isVUC,
						teacher: info.teacher,
						isNext: false
					};
				})
				.sort(
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

			const totalLessons = countTotalLessons(schedule, groupKey.split('_')[0], semester);
			const distributedLessons = subjectData.subgroup1Count + subjectData.subgroup2Count;
			const isStreamLesson = checkIfStreamLesson(schedule, groupKey.split('_')[0]);

			const [subject, teacher] = groupKey.split('_');
			const displayName = subject === 'null' ? `${subject} (${teacher})` : subject;

			result.push({
				subject: displayName,
				teachers,
				subgroup1Count: subjectData.subgroup1Count,
				subgroup2Count: subjectData.subgroup2Count,
				vucCount: subjectData.vucCount,
				totalLessons,
				distributedLessons,
				isStreamLesson,
				dates: allDates
			});
		}

		return result;
	}

	function distributeRegularly(subjectData: any) {
		subjectData.rawDates.sort((a: any, b: any) => {
			const dateA = new Date(a.dateTime.split('_')[0].split('.').reverse().join('-'));
			const dateB = new Date(b.dateTime.split('_')[0].split('.').reverse().join('-'));
			return dateA.getTime() - dateB.getTime();
		});

		const vucDays = subjectData.rawDates.filter((d: RawDate) => d.isVUC);
		const nonVucDays = subjectData.rawDates.filter((d: RawDate) => !d.isVUC);
		const assignments = new Map();

		const totalDays = subjectData.rawDates.length;
		const targetPerGroup = Math.ceil(totalDays / 2);
		const maxDiff = Math.ceil(totalDays * 0.3);

		let group1NonVUC = [];
		let group2NonVUC = [];
		let group1VUC = [];
		let group2VUC = [];

		for (const dateInfo of vucDays) {
			const currentDiff = subjectData.subgroup2Count - subjectData.subgroup1Count;
			if (currentDiff >= maxDiff) {
				group1VUC.push(dateInfo);
				subjectData.subgroup1Count++;
			} else {
				group2VUC.push(dateInfo);
				subjectData.subgroup2Count++;
			}
			subjectData.vucCount++;
		}

		for (const dateInfo of nonVucDays) {
			const assignedSubgroup =
				subjectData.subgroup1Count <= subjectData.subgroup2Count ? 1 : 2;
			if (assignedSubgroup === 1) {
				group1NonVUC.push(dateInfo);
				subjectData.subgroup1Count++;
			} else {
				group2NonVUC.push(dateInfo);
				subjectData.subgroup2Count++;
			}
		}

		for (let i = 0; i < group1VUC.length; i++) {
			if (group2NonVUC.length > 0) {
				const vucDate = group1VUC[i];
				const nonVucDate = group2NonVUC[0];
				group2VUC.push(vucDate);
				group1NonVUC.push(nonVucDate);
				group1VUC.splice(i, 1);
				group2NonVUC.splice(0, 1);
				i--;
			}
		}

		function addToSubjectData(dateInfo: RawDate, subgroup: number, isVUC: boolean) {
			const uniqueKey = `${dateInfo.dateTime}_${dateInfo.teacher}`;
			subjectData.dates[uniqueKey] = {
				subgroup,
				isVUC,
				teacher: dateInfo.teacher,
				originalDateTime: dateInfo.dateTime
			};
		}

		group1VUC.forEach((d) => addToSubjectData(d, 1, true));
		group2VUC.forEach((d) => addToSubjectData(d, 2, true));
		group1NonVUC.forEach((d) => addToSubjectData(d, 1, false));
		group2NonVUC.forEach((d) => addToSubjectData(d, 2, false));
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

	function pluralize(number: number, one: string, few: string, many: string): string {
		const lastDigit = number % 10;
		const lastTwoDigits = number % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return many;
		if (lastDigit === 1) return one;
		if (lastDigit >= 2 && lastDigit <= 4) return few;
		return many;
	}

	function getTeacherInitial(teacherName: string): string {
		const withoutPosition = teacherName
			.replace(/^(асс\.|доц\.|ст\.преп\.|проф\.|преп\.) /, '')
			.trim();
		const lastName = withoutPosition.split(' ')[0];
		return lastName.charAt(0).toUpperCase();
	}

	function getTeacherColor(teacherName: string): string {
		const colorMap: Record<string, string> = {
			А: 'bg-red-500 border-red-400',
			Б: 'bg-blue-500 border-blue-400',
			В: 'bg-emerald-500 border-emerald-400',
			Г: 'bg-amber-500 border-amber-400',
			Д: 'bg-purple-500 border-purple-400',
			Е: 'bg-pink-500 border-pink-400',
			Ж: 'bg-cyan-500 border-cyan-400',
			З: 'bg-orange-500 border-orange-400',
			И: 'bg-lime-500 border-lime-400',
			К: 'bg-indigo-500 border-indigo-400',
			Л: 'bg-rose-500 border-rose-400',
			М: 'bg-teal-500 border-teal-400',
			Н: 'bg-fuchsia-500 border-fuchsia-400',
			О: 'bg-sky-500 border-sky-400',
			П: 'bg-violet-500 border-violet-400',
			Р: 'bg-yellow-500 border-yellow-400',
			С: 'bg-green-500 border-green-400',
			Т: 'bg-blue-600 border-blue-500',
			У: 'bg-red-600 border-red-500',
			Ф: 'bg-purple-600 border-purple-500',
			Х: 'bg-emerald-600 border-emerald-500',
			Ц: 'bg-orange-600 border-orange-500',
			Ч: 'bg-cyan-600 border-cyan-500',
			Ш: 'bg-pink-600 border-pink-500',
			Щ: 'bg-indigo-600 border-indigo-500',
			Э: 'bg-amber-600 border-amber-500',
			Ю: 'bg-teal-600 border-teal-500',
			Я: 'bg-rose-600 border-rose-500'
		};

		const initial = getTeacherInitial(teacherName);
		return colorMap[initial] || 'bg-gray-500 border-gray-400';
	}
</script>

{#if Object.keys(teacherSubgroups).length > 0}
	<section class="rounded-2xl bg-slate-800">
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
						{sortedStats.length}
						{sortedStats.length === 1
							? 'предмет'
							: sortedStats.length < 5
								? 'предмета'
								: 'предметов'}
					</div>
				</div>

				<Carousel.Content class="-ml-2 md:-ml-4">
					{#each sortedStats as stat}
						<Carousel.Item class="basis-full pl-2 md:pl-4">
							<div
								class="rounded-2xl border border-gray-700 bg-gray-900 p-4 shadow backdrop-blur"
							>
								<div class="mb-2">
									<div
										class="{stat.isStreamLesson
											? 'bg-yellow-600/20'
											: 'bg-green-600/20'} -mx-4 -mt-4 rounded-t-2xl px-4 py-2"
									>
										<div class="flex justify-center text-center">
											<div class="text-sm">
												<span
													class={stat.isStreamLesson
														? 'text-yellow-400'
														: 'text-green-400'}
												>
													{stat.isStreamLesson
														? 'Всей группой'
														: 'По подгруппам'}
												</span>
												{#if stat.isStreamLesson}
													<div class="mt-1 text-xs text-yellow-400/70">
														но.. мы всё равно рассчитываем, мало ли
														пригодится
													</div>
												{/if}
											</div>
										</div>
									</div>
									<h5 class="mt-2 text-lg font-medium text-white">
										{stat.subject}
									</h5>
									{#if stat.teachers.length > 0}
										<div class="flex flex-wrap gap-2">
											{#each stat.teachers as teacher}
												<div class="flex items-center gap-1">
													<div
														class="flex h-5 w-5 items-center justify-center rounded-full border {getTeacherColor(
															teacher
														)} text-xs font-bold text-white"
													>
														{getTeacherInitial(teacher)}
													</div>
													<span class="text-sm text-gray-400"
														>{teacher}</span
													>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<div
									class="mb-2 grid {stat.vucCount > 0
										? 'grid-cols-3'
										: 'grid-cols-2'} gap-2"
								>
									<div
										class="flex flex-col items-center justify-center rounded-2xl bg-gray-800 p-3 text-center"
									>
										<p class="text-sm text-blue-400">первая подгруппа</p>
										<div class="text-2xl font-bold text-white">
											{stat.subgroup1Count}
										</div>
										<span class="text-sm text-gray-400"
											>{pluralize(
												stat.subgroup1Count,
												'занятие',
												'занятия',
												'занятий'
											)}</span
										>
									</div>
									{#if stat.vucCount > 0}
										<div
											class="flex flex-col items-center justify-center rounded-2xl bg-gray-800 p-3 text-center"
										>
											<span class="text-sm text-blue-400">ВУЦ</span>
											<div class="text-2xl font-bold text-white">
												{stat.vucCount}
											</div>
											<span class="text-sm text-gray-400"
												>{pluralize(
													stat.vucCount,
													'день',
													'дня',
													'дней'
												)}</span
											>
										</div>
									{/if}
									<div
										class="flex flex-col items-center justify-center rounded-2xl bg-gray-800 p-3 text-center"
									>
										<p class="text-sm text-blue-400">вторая подгруппа</p>
										<div class="text-2xl font-bold text-white">
											{stat.subgroup2Count}
										</div>
										<span class="text-sm text-gray-400"
											>{pluralize(
												stat.subgroup2Count,
												'занятие',
												'занятия',
												'занятий'
											)}</span
										>
									</div>
								</div>

								<div
									class={stat.vucCount > 0
										? 'mb-2 text-xs text-gray-400'
										: 'hidden'}
								>
									* Синяя полоса слева означает день с ВУЦ
								</div>

								<div class="grid grid-cols-2 gap-2">
									<div class="space-y-2">
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
														{#if stat.teachers.length > 1}
															<div
																class="flex h-4 w-4 items-center justify-center rounded-full border {getTeacherColor(
																	dateInfo.teacher
																)} text-[10px] font-bold text-white"
															>
																{getTeacherInitial(
																	dateInfo.teacher
																)}
															</div>
														{/if}
														<span class="text-white"
															>{dateInfo.date}</span
														>
														<span class="text-xs text-gray-400"
															>({getDayOfWeek(dateInfo.date)})</span
														>
														<span
															class="hidden text-xs text-yellow-400 md:block"
															>{dateInfo.week} неделя</span
														>
														{#if dateInfo.isVUC}
															<span
																class="ml-auto hidden text-xs text-blue-400 md:block"
																>(ВУЦ)</span
															>
														{/if}
													</div>
													<div class="text-xs text-yellow-400 md:hidden">
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
														{#if stat.teachers.length > 1}
															<div
																class="flex h-4 w-4 items-center justify-center rounded-full border {getTeacherColor(
																	dateInfo.teacher
																)} text-[10px] font-bold text-white"
															>
																{getTeacherInitial(
																	dateInfo.teacher
																)}
															</div>
														{/if}
														<span class="text-white"
															>{dateInfo.date}</span
														>
														<span class="text-xs text-gray-400"
															>({getDayOfWeek(dateInfo.date)})</span
														>
														<span
															class="hidden text-xs text-yellow-400 md:block"
															>{dateInfo.week} неделя</span
														>
														{#if dateInfo.isVUC}
															<span
																class="ml-auto hidden text-xs text-blue-400 md:block"
																>(ВУЦ)</span
															>
														{/if}
													</div>
													<div class="text-xs text-yellow-400 md:hidden">
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
