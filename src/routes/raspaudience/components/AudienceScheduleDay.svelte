<script lang="ts">
	import type { AudienceLesson } from '../types';
	import { LessonTypes } from '../types';

	export let dayName: string;
	export let date: string;
	export let lessons: AudienceLesson[];

	function formatDate(isoDate: string): string {
		const date = new Date(isoDate);
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();
		return `${day}.${month}.${year}`;
	}

	function getLessonTypeInfo(type: number) {
		const lessonTypeName = LessonTypes[type] || 'Занятие';

		switch (type) {
			case 2:
				return { color: 'border-green-500', text: 'text-green-500', label: lessonTypeName };
			case 4:
				return {
					color: 'border-yellow-500',
					text: 'text-yellow-500',
					label: lessonTypeName
				};
			case 8:
				return { color: 'border-blue-500', text: 'text-blue-500', label: lessonTypeName };
			case 1:
				return {
					color: 'border-purple-500',
					text: 'text-purple-500',
					label: lessonTypeName
				};
			case 5:
				return { color: 'border-pink-500', text: 'text-pink-500', label: lessonTypeName };
			case 6:
				return {
					color: 'border-indigo-500',
					text: 'text-indigo-500',
					label: lessonTypeName
				};
			case 7:
				return {
					color: 'border-orange-500',
					text: 'text-orange-500',
					label: lessonTypeName
				};
			case 3:
			case 256:
				return { color: 'border-red-500', text: 'text-red-500', label: lessonTypeName };
			case 9:
				return { color: 'border-gray-500', text: 'text-gray-500', label: lessonTypeName };
			case 10:
				return { color: 'border-teal-500', text: 'text-teal-500', label: lessonTypeName };
			case 11:
				return { color: 'border-lime-500', text: 'text-lime-500', label: lessonTypeName };
			case 12:
				return { color: 'border-black', text: 'text-black', label: lessonTypeName };
			default:
				return { color: 'border-slate-300', text: 'text-slate-400', label: lessonTypeName };
		}
	}
</script>

<div class="mb-4 rounded-2xl bg-slate-900 p-4">
	<h3 class="mb-2 text-2xl font-semibold text-white">
		{dayName} ({formatDate(date)})
	</h3>

	{#each lessons as lesson, index}
		{@const typeInfo = getLessonTypeInfo(lesson.type)}
		<div class="rounded-2xl bg-slate-800 p-4 {index !== lessons.length - 1 ? 'mb-2' : ''} flex">
			<div
				class="mr-2 flex w-14 flex-col items-end justify-between border-r-2 py-2 pr-2 {typeInfo.color}"
			>
				{#if lesson.timeRange}
					{@const [startTime, endTime] = lesson.timeRange.split('-')}
					<span class="text-sm font-bold">{startTime?.trim()}</span>
					<span class="text-sm font-bold">{endTime?.trim()}</span>
				{:else}
					<div class="flex h-full w-full items-center justify-center">
						<span class="text-2xl">❓</span>
					</div>
				{/if}
			</div>

			<div class="flex-grow">
				<p class="text-lg font-bold text-white">{lesson.lessonName}</p>
				<p class="text-sm {typeInfo.text}">{typeInfo.label}</p>

				{#if lesson.isDistant}
					<p class="text-sm text-red-500">Дистанционно</p>
				{/if}

				{#if lesson.teacherName}
					<p class="text-sm text-slate-400">
						<a
							href="/raspprep?teacher={encodeURIComponent(lesson.teacherName)}"
							class="transition-all hover:text-blue-400"
						>
							{lesson.teacherName}
						</a>
					</p>
				{/if}

				{#if lesson.groups && lesson.groups.length > 0}
					<p class="text-sm text-gray-400">{lesson.groups.join(', ')}</p>
				{/if}
			</div>
		</div>
	{/each}
</div>
