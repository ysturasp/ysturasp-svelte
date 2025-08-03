<script lang="ts">
	import type { YSTULesson } from '../types';
	import { LessonTypes } from '../types';
	import { hiddenSubjects, toggleSubjectVisibility } from '../stores';
	import { crossfade, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';
	import { getSubgroupIndicator } from '../stores/subgroups';
	import type { SubgroupSettings, TeacherSubgroups } from '../stores/subgroups';

	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 1000),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform = style.transform === 'none' ? '' : style.transform;

			return {
				duration: 600,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`
			};
		}
	});

	export let date: string;
	export let lessons: YSTULesson[];
	export let selectedGroup: string;
	export let subgroupSettings: SubgroupSettings = {};
	export let teacherSubgroups: TeacherSubgroups = {};

	function getLessonTypeInfo(type: number) {
		const label = LessonTypes[type] || 'Занятие';

		switch (type) {
			case 2:
				return { color: 'border-green-500', text: 'text-green-400', label };
			case 4:
				return { color: 'border-yellow-500', text: 'text-yellow-400', label };
			case 8:
				return { color: 'border-blue-500', text: 'text-blue-400', label };
			case 1:
				return { color: 'border-purple-500', text: 'text-purple-400', label };
			case 5:
				return { color: 'border-pink-500', text: 'text-pink-400', label };
			case 6:
				return { color: 'border-indigo-500', text: 'text-indigo-400', label };
			case 7:
				return { color: 'border-orange-500', text: 'text-orange-400', label };
			case 3:
				return { color: 'border-red-500', text: 'text-red-400', label };
			case 9:
				return { color: 'border-gray-500', text: 'text-gray-400', label };
			default:
				return { color: 'border-slate-300', text: 'text-slate-400', label };
		}
	}

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}

	function formatTime(timeString: string): string {
		const date = new Date(timeString);
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Europe/Moscow'
		});
	}

	function getDayName(dayIndex: number): string {
		const days = [
			'Воскресенье',
			'Понедельник',
			'Вторник',
			'Среда',
			'Четверг',
			'Пятница',
			'Суббота'
		];
		return days[dayIndex];
	}

	function isToday(dateString: string): boolean {
		const lessonDate = new Date(dateString);
		const today = new Date();
		lessonDate.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);
		return lessonDate.getTime() === today.getTime();
	}

	function isLessonHidden(lesson: YSTULesson): boolean {
		if (!selectedGroup || !$hiddenSubjects[selectedGroup]) return false;
		return $hiddenSubjects[selectedGroup].some(
			(s) =>
				s.lessonName === lesson.lessonName &&
				s.type === lesson.type &&
				s.teacher === lesson.teacherName
		);
	}

	$: formattedDate = formatDate(date);
	$: lessonDate = new Date(date);
	$: dayOfWeek = getDayName(lessonDate.getDay());
	$: isCurrentDay = isToday(date);

	$: filteredLessons = lessons
		.filter((lesson) => {
			if (!selectedGroup || !$hiddenSubjects[selectedGroup]) return true;
			return !$hiddenSubjects[selectedGroup].some(
				(s) =>
					s.lessonName === lesson.lessonName &&
					s.type === lesson.type &&
					s.teacher === lesson.teacherName
			);
		})
		.map((lesson, index, array) => {
			const key =
				lesson.lessonName +
				lesson.type +
				lesson.teacherName +
				lesson.startAt +
				lesson.endAt;
			const duplicateIndex = array.findIndex(
				(l, i) =>
					i < index && l.lessonName + l.type + l.teacherName + l.startAt + l.endAt === key
			);
			if (duplicateIndex !== -1) {
				return {
					...lesson,
					uniqueIndex: index
				};
			}
			return lesson;
		});
</script>

<div class="mt-4">
	<div
		class="day-schedule mb-4 rounded-2xl bg-slate-900 p-4 transition-[height] duration-500 ease-out last:mb-0"
		class:border-2={isCurrentDay}
		class:border-blue-500={isCurrentDay}
	>
		<h3 class="mb-2 text-2xl font-semibold text-white">
			{dayOfWeek} ({formattedDate})
		</h3>

		<div class="relative">
			{#each filteredLessons as lesson, i (lesson.lessonName + lesson.type + lesson.teacherName + lesson.startAt + lesson.endAt + (lesson.uniqueIndex ?? ''))}
				{@const typeInfo = getLessonTypeInfo(lesson.type)}
				{@const subgroupIndicator = getSubgroupIndicator(
					lesson,
					date,
					subgroupSettings,
					teacherSubgroups
				)}
				<div
					class="mb-2 flex rounded-2xl bg-slate-800 p-4 last:mb-0"
					animate:flip={{
						duration: 500,
						easing: quintOut
					}}
					in:receive|local={{
						key:
							lesson.lessonName +
							lesson.type +
							lesson.teacherName +
							lesson.startAt +
							lesson.endAt +
							(lesson.uniqueIndex ?? ''),
						duration: 500
					}}
					out:send|local={{
						key:
							lesson.lessonName +
							lesson.type +
							lesson.teacherName +
							lesson.startAt +
							lesson.endAt +
							(lesson.uniqueIndex ?? ''),
						duration: 500
					}}
				>
					<div
						class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 pr-2 {typeInfo.color}"
					>
						<span class="text-sm font-bold">{formatTime(lesson.startAt)}</span>
						<span class="text-sm font-bold">{formatTime(lesson.endAt)}</span>
					</div>

					<div class="flex-grow">
						<div class="flex items-center justify-between">
							<div class="flex flex-wrap items-center gap-2">
								<p class="font-bold text-white md:text-lg">
									{lesson.lessonName || 'Название предмета не указано'}
								</p>
								{#if subgroupIndicator}
									<span
										class="rounded-full bg-yellow-900/30 px-2 py-1 text-xs text-yellow-500"
									>
										{subgroupIndicator}
									</span>
								{/if}
							</div>
						</div>
						<p class="text-sm {typeInfo.text}">{typeInfo.label}</p>

						{#if lesson.isDistant}
							<p class="text-sm text-red-400">Дистанционно</p>
						{:else}
							<p class="text-sm text-slate-400">
								<a
									href="/raspaudience?audience={encodeURIComponent(
										lesson.auditoryName
									)}"
									class="text-sm text-slate-400 transition-all hover:text-blue-400"
								>
									{lesson.auditoryName}
								</a>
							</p>
						{/if}

						{#if lesson.teacherName}
							<p class="text-sm text-gray-400">
								<a
									href="/raspprep?teacher={encodeURIComponent(
										lesson.teacherName
									)}"
									class="text-sm text-gray-400 transition-all hover:text-blue-400"
								>
									{lesson.teacherName}
								</a>
							</p>
						{/if}

						{#if lesson.groups}
							<p class="text-sm text-gray-400">Группы: {lesson.groups}</p>
						{/if}
					</div>
					<label class="switch ml-auto self-center">
						<input
							type="checkbox"
							checked={!isLessonHidden(lesson)}
							on:change={() =>
								toggleSubjectVisibility(selectedGroup, {
									lessonName: lesson.lessonName,
									type: lesson.type,
									teacher: lesson.teacherName
								})}
						/>
						<span class="slider round"></span>
					</label>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
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

	:global(.day-schedule) {
		transition: height 500ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	.relative {
		position: relative;
	}
</style>
