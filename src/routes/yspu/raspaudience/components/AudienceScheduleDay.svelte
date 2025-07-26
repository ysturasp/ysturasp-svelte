<script lang="ts">
	import type { AudienceLesson } from '$lib/types/schedule';

	export let dayName: string;
	export let lessons: AudienceLesson[];

	function getDirectionAbbreviation(direction: string) {
		const stopWords = [
			'по',
			'на',
			'в',
			'с',
			'для',
			'со',
			'за',
			'от',
			'до',
			'о',
			'об',
			'а',
			'у',
			'к',
			'над',
			'под',
			'из',
			'при',
			'про',
			'без',
			'через',
			'при',
			'под',
			'над',
			'из',
			'от',
			'до',
			'об',
			'обо',
			'про',
			'без',
			'через',
			'со',
			'во',
			'вне',
			'между'
		];
		const words = direction.trim().split(/\s+/);
		let abbr = '';
		for (let i = 0; i < words.length; i++) {
			const word = words[i];
			if (word.toLowerCase() === 'и') {
				abbr += 'и';
				continue;
			}
			if (stopWords.includes(word.toLowerCase()) || word.length === 1) continue;
			abbr += word[0].toUpperCase();
		}
		return abbr;
	}

	function getLessonTypeInfo(type: 'lecture' | 'practice' | 'other') {
		switch (type) {
			case 'lecture':
				return { color: 'border-blue-400', text: 'text-blue-400', label: 'Лекция' };
			case 'practice':
				return { color: 'border-yellow-500', text: 'text-yellow-500', label: 'Практика' };
			default:
				return { color: 'border-slate-300', text: 'text-slate-400', label: 'Занятие' };
		}
	}

	function getEndTime(lesson: AudienceLesson): string {
		if (lesson.additionalSlots && lesson.additionalSlots.length > 0) {
			const lastSlot = lesson.additionalSlots[lesson.additionalSlots.length - 1];
			return lastSlot?.endAt || lesson.endAt;
		}
		return lesson.endAt;
	}
</script>

<div class="mb-4 rounded-2xl bg-slate-900 p-4">
	<h3 class="mb-2 text-2xl font-semibold text-white">{dayName}</h3>
	{#each lessons as lesson, index}
		{#if true}
			{@const typeInfo = getLessonTypeInfo(lesson.type)}
			{@const totalLessons = lesson.additionalSlots?.length
				? lesson.additionalSlots.length + 1
				: 1}
			{@const startTime = lesson.startAt}
			{@const endTime = getEndTime(lesson)}
			<div
				class="rounded-2xl bg-slate-800 p-4 {index !== lessons.length - 1
					? 'mb-2'
					: ''} relative flex"
			>
				{#if totalLessons > 1}
					<div
						class="absolute top-1/2 -left-2 h-4/5 w-1 -translate-y-1/2 transform rounded-full bg-blue-400"
					></div>
				{/if}

				<div
					class="flex flex-col items-end justify-between border-r-2 {typeInfo.color} mr-2 w-14 pr-2"
				>
					<span class="text-sm font-bold">{startTime}</span>
					<span class="text-sm font-bold">{endTime}</span>
				</div>

				<div class="flex-grow">
					<p class="lg:text:md md:text-md sm:text:sm font-bold text-white">
						{lesson.lessonName}
					</p>
					<p class="text-sm {typeInfo.text}">{typeInfo.label}</p>
					{#if totalLessons > 1}
						<p class="text-sm text-blue-400">Занятие на {totalLessons} пары</p>
					{/if}
					{#if lesson.isStream}
						<p class="text-sm text-purple-400">Поток</p>
					{/if}
					{#if lesson.isDistant}
						<p class="text-sm text-red-400">Дистанционно</p>
					{/if}
					<a
						href="/yspu/raspprep?teacher={encodeURIComponent(lesson.teacherName)}"
						class="text-sm text-blue-400 transition-all hover:text-blue-300"
					>
						{lesson.teacherName}
					</a>
					{#if lesson.groups}
						<p class="text-sm text-gray-400">Группы: {lesson.groups}</p>
					{/if}
					{#if lesson.direction}
						<p class="flex flex-wrap items-center text-sm text-gray-400">
							Направления:
							{#each lesson.direction
								.split(',')
								.map((dir: string) => dir.trim()) as direction}
								<span class="group relative ml-1">
									<span>{getDirectionAbbreviation(direction)}</span>
									<span
										class="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 -translate-x-1/2 transform rounded-md bg-blue-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
									>
										{direction}
									</span>
								</span>
							{/each}
						</p>
					{/if}
				</div>
			</div>
		{/if}
	{/each}
</div>
