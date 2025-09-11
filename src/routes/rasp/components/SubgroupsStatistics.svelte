<script lang="ts">
	import type { TeacherSubgroups, SubgroupInfo } from '../stores/subgroups';
	import type { SemesterInfo } from '$lib/utils/semester';
	import type { ScheduleData } from '../types';
	import { isDateInSemester, getWeekNumberByDate } from '$lib/utils/semester';
	import * as Carousel from '$lib/components/ui/carousel';
	import SubgroupsTableModal from './SubgroupsTableModal.svelte';
	import { onMount } from 'svelte';

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
		isDivision: boolean;
		dates: {
			date: string;
			time: string;
			week: number;
			subgroup: number;
			isVUC: boolean;
			isNext: boolean;
			teacher: string;
		}[];
		typePriority: number;
	}

	$: stats = calculateStats(teacherSubgroups, scheduleData, selectedSemester);
	$: sortedStats = stats.sort((a, b) => {
		const ap = a.typePriority ?? 2;
		const bp = b.typePriority ?? 2;
		if (ap !== bp) return ap - bp;
		if (a.isDivision !== b.isDivision) return a.isDivision ? -1 : 1;
		return 0;
	});
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

	let showTableModal = false;
	let isMobile = false;
	let activeTooltip: HTMLElement | null = null;

	onMount(() => {
		const checkMobile = () => {
			isMobile = window.matchMedia('(max-width: 768px)').matches;
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);

		const handleDocumentClick = (e: MouseEvent) => {
			if (!isMobile || !activeTooltip) return;

			if (!(e.target as HTMLElement).closest('.group')) {
				activeTooltip.classList.remove('opacity-100');
				activeTooltip.classList.add('opacity-0');
				setTimeout(() => {
					if (activeTooltip && !activeTooltip.classList.contains('opacity-100')) {
						activeTooltip.style.display = 'none';
					}
				}, 200);
				activeTooltip = null;
			}
		};

		document.addEventListener('click', handleDocumentClick);

		return () => {
			document.removeEventListener('click', handleDocumentClick);
			window.removeEventListener('resize', checkMobile);
		};
	});

	function handleClick(e: MouseEvent, element: HTMLElement) {
		if (!isMobile) return;

		e.stopPropagation();

		document.querySelectorAll('[data-tooltip]').forEach((tooltip) => {
			if (tooltip.parentElement !== element) {
				const tooltipEl = tooltip as HTMLElement;
				tooltipEl.classList.remove('opacity-100');
				tooltipEl.classList.add('opacity-0');
				setTimeout(() => {
					if (tooltipEl && !tooltipEl.classList.contains('opacity-100')) {
						tooltipEl.style.display = 'none';
					}
				}, 200);
			}
		});

		const tooltip = element.querySelector('[data-tooltip]') as HTMLElement;
		if (tooltip) {
			tooltip.style.display = 'block';
			requestAnimationFrame(() => {
				if (activeTooltip && activeTooltip !== tooltip) {
					activeTooltip.classList.remove('opacity-100');
					activeTooltip.classList.add('opacity-0');
					setTimeout(() => {
						if (activeTooltip && !activeTooltip.classList.contains('opacity-100')) {
							activeTooltip.style.display = 'none';
						}
					}, 200);
				}
				tooltip.classList.toggle('opacity-0');
				tooltip.classList.toggle('opacity-100');
				activeTooltip = tooltip.classList.contains('opacity-100') ? tooltip : null;
			});
		}
	}

	function handleKeyDown(e: KeyboardEvent, element: HTMLElement) {
		if (!isMobile) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			const tooltip = element.querySelector('[data-tooltip]') as HTMLElement;
			if (tooltip) {
				tooltip.style.display = 'block';
				requestAnimationFrame(() => {
					tooltip.classList.toggle('opacity-0');
					tooltip.classList.toggle('opacity-100');
					activeTooltip = tooltip.classList.contains('opacity-100') ? tooltip : null;
				});
			}
		}
	}

	function calculateStats(
		data: TeacherSubgroups,
		schedule: ScheduleData | null,
		semester: SemesterInfo | null
	): SubgroupStats[] {
		if (!schedule || !semester) return [];

		const groupedSubjects = new Map<string, any>();

		for (const [key, teacherData] of Object.entries(data)) {
			if (!teacherData.dates) continue;

			const [subject, teacher] = key.split('_');
			const groupKey = subject === 'null' ? key : subject;

			if (!groupedSubjects.has(groupKey)) {
				groupedSubjects.set(groupKey, {
					teachers: new Set<string>(),
					dates: {} as Record<string, any>,
					subgroup1Count: 0,
					subgroup2Count: 0,
					vucCount: 0,
					isDivision: teacherData.isDivision,
					displayName: teacherData.displayName
				});
			}

			const group = groupedSubjects.get(groupKey);
			group.teachers.add(teacherData.teacher);

			for (const [dateTime, info] of Object.entries(teacherData.dates)) {
				const uniqueKey = `${dateTime}_${teacherData.teacher}`;
				group.dates[uniqueKey] = {
					subgroup: info.subgroup,
					isVUC: info.isVUC,
					teacher: teacherData.teacher,
					originalDateTime: dateTime
				};
				if (info.subgroup === 1) group.subgroup1Count++;
				if (info.subgroup === 2) group.subgroup2Count++;
				if (info.isVUC) group.vucCount++;
			}
		}

		const result: SubgroupStats[] = [];

		for (const [groupKey, subjectData] of groupedSubjects) {
			const allDates = Object.entries(subjectData.dates)
				.map(([_, info]: [string, any]) => {
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
			const subjectNameForPriority = subjectData.displayName as string;
			const labsCount = countLessonsByTypes(schedule, subjectNameForPriority, semester, [8]);
			const practicesCount = countLessonsByTypes(schedule, subjectNameForPriority, semester, [
				4
			]);
			const typePriority = labsCount > 0 ? 0 : practicesCount > 0 ? 1 : 2;
			const distributedLessons = subjectData.subgroup1Count + subjectData.subgroup2Count;

			result.push({
				subject: subjectData.displayName,
				teachers: Array.from(subjectData.teachers) as string[],
				subgroup1Count: subjectData.subgroup1Count,
				subgroup2Count: subjectData.subgroup2Count,
				vucCount: subjectData.vucCount,
				totalLessons,
				distributedLessons,
				isDivision: subjectData.isDivision,
				dates: allDates,
				typePriority
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
		const isNullSubject = subject.startsWith('null (преп.');
		schedule.items.forEach((weekItem) => {
			weekItem.days.forEach((day) => {
				if (!isDateInSemester(day.info.date, semester)) return;

				if (day.lessons) {
					count += day.lessons.filter((l) => {
						if (!(l.type === 8 || l.type === 4)) return false;
						if (isNullSubject) {
							return l.lessonName === null || l.lessonName === 'null';
						}
						return l.lessonName === subject;
					}).length;
				}
			});
		});
		return count;
	}

	function countLessonsByTypes(
		schedule: ScheduleData,
		subject: string,
		semester: SemesterInfo,
		types: number[]
	): number {
		let count = 0;
		const isNullSubject = subject.startsWith('null (преп.');
		schedule.items.forEach((weekItem) => {
			weekItem.days.forEach((day) => {
				if (!isDateInSemester(day.info.date, semester)) return;
				day.lessons?.forEach((l) => {
					if (!types.includes(l.type)) return;
					if (isNullSubject) {
						if (l.lessonName === null || l.lessonName === 'null') count++;
					} else if (l.lessonName === subject) {
						count++;
					}
				});
			});
		});
		return count;
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
		<div
			class="mb-3 flex flex-col gap-2 md:mb-2 md:flex-row md:items-center md:justify-between"
		>
			<h3 class="text-2xl font-semibold text-white">📊 Распределение подгрупп</h3>
			<button
				on:click={() => (showTableModal = true)}
				class="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-500 md:w-auto"
			>
				<svg class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
					<path
						d="M3 9.5H21M3 14.5H21M8 4.5V19.5M6.2 19.5H17.8C18.9201 19.5 19.4802 19.5 19.908 19.282C20.2843 19.0903 20.5903 18.7843 20.782 18.408C21 17.9802 21 17.4201 21 16.3V7.7C21 6.5799 21 6.01984 20.782 5.59202C20.5903 5.21569 20.2843 4.90973 19.908 4.71799C19.4802 4.5 18.9201 4.5 17.8 4.5H6.2C5.0799 4.5 4.51984 4.5 4.09202 4.71799C3.71569 4.90973 3.40973 5.21569 3.21799 5.59202C3 6.01984 3 6.57989 3 7.7V16.3C3 17.4201 3 17.9802 3.21799 18.408C3.40973 18.7843 3.71569 19.0903 4.09202 19.282C4.51984 19.5 5.07989 19.5 6.2 19.5Z"
						stroke="#FFFFFF"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
				<span class="mb-1">Открыть таблицу</span>
			</button>
		</div>

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
										class="{stat.isDivision
											? 'bg-green-600/20'
											: 'bg-yellow-600/20'} -mx-4 -mt-4 rounded-t-2xl px-4 py-2"
									>
										<div class="flex justify-center text-center">
											<div class="text-sm">
												<span
													class={stat.isDivision
														? 'text-green-400'
														: 'text-yellow-400'}
												>
													{stat.isDivision
														? 'По подгруппам'
														: 'Всей группой'}
												</span>
												{#if !stat.isDivision}
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
													class="group relative rounded-xl bg-gray-800 p-2 text-sm {dateInfo.isVUC
														? 'border-l-2 border-blue-400'
														: ''} {dateInfo.isNext
														? 'border-2 border-green-500'
														: ''}"
													role="button"
													tabindex="0"
													on:click={(e) =>
														handleClick(
															e,
															e.currentTarget as HTMLElement
														)}
													on:keydown={(e) =>
														handleKeyDown(
															e,
															e.currentTarget as HTMLElement
														)}
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
															class="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 translate-y-1 transform rounded-lg border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 md:block"
														>
															Следующее занятие
														</div>
														<div
															class="absolute -top-10 left-1/2 z-10 -translate-x-1/2 translate-y-1 transform rounded-lg border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all duration-200 ease-in-out md:hidden"
															data-tooltip
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
													class="group relative rounded-xl bg-gray-800 p-2 text-sm {dateInfo.isVUC
														? 'border-l-2 border-blue-400'
														: ''} {dateInfo.isNext
														? 'border-2 border-green-500'
														: ''}"
													role="button"
													tabindex="0"
													on:click={(e) =>
														handleClick(
															e,
															e.currentTarget as HTMLElement
														)}
													on:keydown={(e) =>
														handleKeyDown(
															e,
															e.currentTarget as HTMLElement
														)}
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
															class="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 translate-y-1 transform rounded-lg border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 md:block"
														>
															Следующее занятие
														</div>
														<div
															class="absolute -top-10 left-1/2 z-10 -translate-x-1/2 translate-y-1 transform rounded-lg border border-green-500 bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-all duration-200 ease-in-out md:hidden"
															data-tooltip
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

<SubgroupsTableModal bind:show={showTableModal} {teacherSubgroups} {selectedSemester} />
