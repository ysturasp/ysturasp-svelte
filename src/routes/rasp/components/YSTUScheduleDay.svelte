<script lang="ts">
	import type { YSTULesson } from '../types';
	import { LessonTypes } from '../types';

	export let dayName: string;
	export let date: string;
	export let lessons: YSTULesson[];

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

	$: formattedDate = formatDate(date);
	$: lessonDate = new Date(date);
	$: dayOfWeek = getDayName(lessonDate.getDay());
	$: isCurrentDay = isToday(date);
</script>

<div class="mt-4">
	<div
		class="day-schedule mb-4 rounded-2xl bg-slate-900 p-4 {isCurrentDay
			? 'border-2 border-blue-500'
			: ''}"
	>
		<h3 class="mb-2 text-2xl font-semibold text-white">
			{dayOfWeek} ({formattedDate})
		</h3>

		{#each lessons as lesson}
			{@const typeInfo = getLessonTypeInfo(lesson.type)}
			<div class="mb-2 flex rounded-2xl bg-slate-800 p-4">
				<div
					class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 pr-2 {typeInfo.color}"
				>
					<span class="text-sm font-bold">{formatTime(lesson.startAt)}</span>
					<span class="text-sm font-bold">{formatTime(lesson.endAt)}</span>
				</div>

				<div class="flex-grow">
					<p class="font-bold text-white md:text-lg">
						{lesson.lessonName || 'Название предмета не указано'}
					</p>
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
								href="/raspprep?teacher={encodeURIComponent(lesson.teacherName)}"
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
			</div>
		{/each}
	</div>
</div>
