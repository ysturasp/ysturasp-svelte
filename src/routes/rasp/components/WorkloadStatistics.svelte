<script lang="ts">
	import type { ScheduleData, YSTULesson } from '../types';
	import { LessonTypes } from '../types';
	import type { SemesterInfo } from '$lib/utils/semester';
	import { isDateInSemester } from '$lib/utils/semester';

	export let scheduleData: ScheduleData | null = null;
	export let selectedSemester: SemesterInfo | null = null;

	interface ExamInfo {
		date: string;
		time: string;
		auditory: string;
		teacher: string;
	}

	interface WorkloadStats {
		subject: string;
		teacher: string;
		totalLessons: number;
		typeStats: {
			[key: number]: {
				count: number;
				total: number;
				label: string;
				color: string;
			};
		};
		exams: ExamInfo[];
	}

	interface SubjectStats {
		discipline: string;
		average: number;
		count5: number;
		count4: number;
		count3: number;
		count2: number;
		emptyCount: number;
	}

	const statsCache = new Map<string, SubjectStats>();
	const apiUrl =
		'https://script.google.com/macros/s/AKfycbxdL_UC__SmYJiPHmlsD4-T1ZiglPvgnehXed1OR9Qjk_fJ3rPxrVBT5Z0Zh1CiI7sC/exec';

	async function fetchSubjectStats(subject: string): Promise<SubjectStats | null> {
		if (subject.includes('(')) {
			subject = subject.split('(')[0].trim();
		}

		if (statsCache.has(subject)) {
			return statsCache.get(subject)!;
		}

		try {
			const response = await fetch(`${apiUrl}?discipline=${encodeURIComponent(subject)}`);
			const data = await response.json();

			if (data.error) return null;

			statsCache.set(subject, data);
			return data;
		} catch (error) {
			console.error('Error fetching stats:', error);
			return null;
		}
	}

	function getLessonTypeColor(type: number): string {
		switch (type) {
			case 2:
				return 'bg-green-500/20 text-green-400';
			case 4:
				return 'bg-yellow-500/20 text-yellow-400';
			case 8:
				return 'bg-blue-500/20 text-blue-400';
			case 1:
				return 'bg-purple-500/20 text-purple-400';
			case 5:
				return 'bg-pink-500/20 text-pink-400';
			case 6:
				return 'bg-indigo-500/20 text-indigo-400';
			case 7:
				return 'bg-orange-500/20 text-orange-400';
			case 3:
				return 'bg-red-500/20 text-red-400';
			case 9:
				return 'bg-gray-500/20 text-gray-400';
			case 256:
				return 'bg-red-500/20 text-red-400';
			default:
				return 'bg-slate-500/20 text-slate-400';
		}
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('ru-RU');
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
	}

	function transliterateName(name: string): string {
		const translitMap: { [key: string]: string } = {
			а: 'a',
			б: 'b',
			в: 'v',
			г: 'g',
			д: 'd',
			е: 'e',
			ё: 'e',
			ж: 'zh',
			з: 'z',
			и: 'i',
			й: 'y',
			к: 'k',
			л: 'l',
			м: 'm',
			н: 'n',
			о: 'o',
			п: 'p',
			р: 'r',
			с: 's',
			т: 't',
			у: 'u',
			ф: 'f',
			х: 'h',
			ц: 'ts',
			ч: 'ch',
			ш: 'sh',
			щ: 'sch',
			ъ: '',
			ы: 'y',
			ь: '',
			э: 'e',
			ю: 'yu',
			я: 'ya'
		};

		return (
			name
				.toLowerCase()
				.split('')
				.map((char) => translitMap[char] || char)
				.join('')
				.replace(/[^a-z0-9]/g, '') + '@edu.ystu.ru'
		);
	}

	function isDateInSemesterRange(date: Date, semester: SemesterInfo): boolean {
		const dateYear = date.getFullYear();
		const dateMonth = date.getMonth();

		if (semester.type === 'autumn') {
			if (dateMonth >= 8 && dateMonth <= 11) {
				return dateYear === semester.year;
			}
			if (dateMonth === 0) {
				return dateYear === semester.year + 1;
			}
			return false;
		} else {
			if (dateMonth >= 1 && dateMonth <= 5) {
				return dateYear === semester.year;
			}
			return false;
		}
	}

	function shouldSkipLesson(lesson: YSTULesson): boolean {
		if (lesson.lessonName?.toLowerCase().includes('конференц')) return true;

		if (
			lesson.lessonName?.toLowerCase().includes('вуц') ||
			lesson.teacherName?.toLowerCase().includes('вуц')
		)
			return true;

		if (lesson.lessonName?.toLowerCase().includes('free miniot')) return true;

		if (!LessonTypes[lesson.type] && lesson.type !== 256) return true;

		return false;
	}

	function calculateWorkloadStats(): WorkloadStats[] {
		if (!scheduleData || !selectedSemester) return [];

		const stats = new Map<string, WorkloadStats>();
		const currentDate = new Date();

		console.log('Selected semester:', selectedSemester);
		console.log('Schedule data:', scheduleData);

		scheduleData.items.forEach((weekItem) => {
			weekItem.days.forEach((day) => {
				const lessonDate = new Date(day.info.date);
				const isInSemester = isDateInSemesterRange(lessonDate, selectedSemester);

				if (!isInSemester) {
					console.log(
						'Skipping date:',
						day.info.date,
						'semester:',
						selectedSemester.type,
						selectedSemester.year
					);
					return;
				}

				console.log(
					'Including date:',
					day.info.date,
					'semester:',
					selectedSemester.type,
					selectedSemester.year
				);

				day.lessons?.forEach((lesson) => {
					if (shouldSkipLesson(lesson)) {
						console.log('Skipping lesson:', lesson.lessonName);
						return;
					}

					if (lesson.type === 256) {
						console.log('Found exam:', {
							date: day.info.date,
							subject: lesson.lessonName,
							teacher: lesson.teacherName,
							type: lesson.type
						});
					}

					const key =
						lesson.lessonName === null || lesson.lessonName === undefined
							? `null_${lesson.teacherName}`
							: lesson.lessonName;

					if (!stats.has(key)) {
						stats.set(key, {
							subject:
								lesson.lessonName === null || lesson.lessonName === undefined
									? `Без названия`
									: lesson.lessonName,
							teacher: lesson.teacherName || 'Преподаватель не указан',
							totalLessons: 0,
							typeStats: {},
							exams: []
						});
					}

					const subjectStats = stats.get(key)!;
					subjectStats.totalLessons++;

					if (lesson.type === 256) {
						console.log('Adding exam to stats:', {
							subject: subjectStats.subject,
							date: formatDate(lessonDate),
							teacher: lesson.teacherName
						});
						subjectStats.exams.push({
							date: formatDate(lessonDate),
							time: formatTime(lessonDate),
							auditory: lesson.auditoryName,
							teacher: lesson.teacherName
						});
					}

					if (!subjectStats.typeStats[lesson.type]) {
						subjectStats.typeStats[lesson.type] = {
							count: 0,
							total: 0,
							label:
								lesson.type === 256
									? 'Экзамен'
									: LessonTypes[lesson.type] || 'Неизвестный тип',
							color: getLessonTypeColor(lesson.type)
						};
					}

					subjectStats.typeStats[lesson.type].total++;
					if (lessonDate < currentDate) {
						subjectStats.typeStats[lesson.type].count++;
					}
				});
			});
		});

		const result = Array.from(stats.values()).sort((a, b) => {
			if (a.exams.length > 0 && b.exams.length === 0) return -1;
			if (a.exams.length === 0 && b.exams.length > 0) return 1;

			return b.totalLessons - a.totalLessons;
		});
		console.log('Final stats:', result);
		return result;
	}

	$: workloadStats = calculateWorkloadStats();
	$: totalStats = calculateTotalCompletedLessons();
	$: {
		if (selectedSemester || scheduleData) {
			workloadStats = calculateWorkloadStats();
			totalStats = calculateTotalCompletedLessons();
		}
	}

	function pluralize(number: number, one: string, few: string, many: string): string {
		const lastDigit = number % 10;
		const lastTwoDigits = number % 100;

		if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return many;
		if (lastDigit === 1) return one;
		if (lastDigit >= 2 && lastDigit <= 4) return few;
		return many;
	}

	function calculateTotalCompletedLessons(): { completed: number; total: number } {
		let completed = 0;
		let total = 0;

		workloadStats.forEach((stat) => {
			Object.values(stat.typeStats).forEach((typeStat) => {
				completed += typeStat.count;
				total += typeStat.total;
			});
		});

		return { completed, total };
	}

	function getGradient(mouseX: number, mouseY: number): string {
		return `radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(17, 51, 107, 1) 10%, rgba(7, 24, 39, 1) 100%)`;
	}

	function getGradeBackground(grade: number): string {
		if (grade >= 4.5) return 'bg-green-600/20';
		if (grade >= 4.0) return 'bg-blue-600/20';
		if (grade >= 3.5) return 'bg-orange-600/20';
		return 'bg-red-600/20';
	}

	function getGradeTextColor(grade: number): string {
		if (grade >= 4.5) return 'text-green-400';
		if (grade >= 4.0) return 'text-blue-400';
		if (grade >= 3.5) return 'text-orange-400';
		return 'text-red-400';
	}

	let hoveredCard: HTMLElement | null = null;

	function handleMouseMove(event: MouseEvent, card: HTMLElement) {
		const rect = card.getBoundingClientRect();
		const mouseX = ((event.clientX - rect.left) / rect.width) * 100;
		const mouseY = ((event.clientY - rect.top) / rect.height) * 100;
		card.style.background = getGradient(mouseX, mouseY);
	}

	function handleMouseLeave(card: HTMLElement) {
		card.style.background = '';
	}
</script>

{#if workloadStats.length > 0}
	<section>
		<h3 class="text-2xl font-semibold text-white">📚 Учебная нагрузка</h3>
		<h3 class="mt-2 text-xl font-medium text-white">
			Количество завершенных занятий ко всем: {totalStats.completed} из {totalStats.total} ({(
				(totalStats.completed / totalStats.total) *
				100
			).toFixed(2)}%)
		</h3>

		<div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each workloadStats as stat}
				<div
					role="button"
					tabindex="0"
					class="relative rounded-lg bg-slate-900 p-4 shadow-lg transition-all"
					on:mousemove={(e) => handleMouseMove(e, e.currentTarget)}
					on:mouseleave={(e) => handleMouseLeave(e.currentTarget)}
				>
					{#await fetchSubjectStats(stat.subject)}
						<h2 class="text-xl font-bold break-words hyphens-auto text-white">
							{stat.subject}
						</h2>
					{:then stats}
						{#if stats}
							<div
								class="{getGradeBackground(
									stats.average
								)} -mx-4 -mt-4 rounded-t-lg px-4 py-2"
							>
								<div class="flex items-center gap-3">
									<div class="flex items-baseline gap-1.5">
										<span
											class="text-2xl font-bold {getGradeTextColor(
												stats.average
											)}"
										>
											{stats.average.toFixed(1)}
										</span>
										<span class="text-xs text-gray-400">балл</span>
									</div>
									<div class="h-4 w-px bg-gray-700"></div>
									<div class="flex flex-col gap-1">
										<div class="flex items-center gap-2 text-xs">
											<div class="flex items-center">
												<span class="font-medium text-green-400">5</span>
												<span class="mx-0.5 text-gray-500">×</span>
												<span class="text-green-400">{stats.count5}</span>
											</div>
											<div class="flex items-center">
												<span class="font-medium text-blue-400">4</span>
												<span class="mx-0.5 text-gray-500">×</span>
												<span class="text-blue-400">{stats.count4}</span>
											</div>
											<div class="flex items-center">
												<span class="font-medium text-orange-400">3</span>
												<span class="mx-0.5 text-gray-500">×</span>
												<span class="text-orange-400">{stats.count3}</span>
											</div>
										</div>
										<div class="text-[10px] text-gray-400">
											всего: {(() => {
												const total =
													stats.count5 + stats.count4 + stats.count3;
												return `${total} ${pluralize(total, 'оценка', 'оценки', 'оценок')}`;
											})()}
										</div>
									</div>
								</div>
							</div>
							<h2 class="mt-2 text-xl font-bold break-words hyphens-auto text-white">
								{stat.subject}
							</h2>
						{:else}
							<h2 class="text-xl font-bold break-words hyphens-auto text-white">
								{stat.subject}
							</h2>
						{/if}
					{/await}
					<p class="text-sm break-words text-gray-400">{stat.teacher}</p>

					<div class="mt-2">
						{#each Object.entries(stat.typeStats) as [type, info]}
							{#if info.total > 0 && type !== '256'}
								<div class="mb-1 flex items-center justify-between text-slate-300">
									<span>{info.label}: {info.count} из {info.total}</span>
									<div class="ml-2 flex items-center">
										<div
											class="relative mr-2 h-2 w-24 rounded-full bg-gray-300"
										>
											<div
												class="absolute top-0 left-0 h-full rounded-full"
												style="width: {(info.count / info.total) *
													100}%; background-color: {info.count ===
												info.total
													? '#00ff00b5'
													: '#0000ffb5'};"
											></div>
										</div>
										<span class="text-sm text-slate-400"
											>{Math.round((info.count / info.total) * 100)}%</span
										>
									</div>
								</div>
							{/if}
						{/each}
					</div>

					{#if stat.exams.length > 0}
						<h3 class="mt-2 mb-2 text-xl font-bold text-white sm:text-2xl">Экзамен:</h3>
						<div class="rounded-lg bg-slate-900 shadow-md">
							{#each stat.exams as exam}
								<div
									class="mb-2 flex flex-col items-start justify-between rounded-lg bg-slate-800 p-3 text-slate-300 transition-all hover:bg-slate-700"
								>
									<span class="text-lg font-medium sm:text-xl">{exam.date}</span>
									<span class="text-slate-400">{exam.auditory}</span>
									<div class="flex items-center">
										<span class="mr-2 font-light text-slate-400"
											>{exam.teacher}</span
										>
										<a
											href="https://teams.microsoft.com/l/chat/0/0?users={transliterateName(
												exam.teacher
											)}"
											target="_blank"
											class="flex items-center text-blue-500 hover:text-blue-300"
										>
											<img
												src="https://1.bp.blogspot.com/-tZ96Uvd516Y/Xc1nRonJtoI/AAAAAAAAJOo/M5DQUKUBjKADfMIzD-0oUrfzn4fZsK1SwCLcBGAsYHQ/s1600/Teams.png"
												alt="Связаться с преподавателем"
												class="mr-1 h-6 w-6"
											/>
										</a>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</section>
{/if}
