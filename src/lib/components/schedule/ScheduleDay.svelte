<script lang="ts">
	import type { Lesson } from '$lib/types/schedule';
	import ScheduleLesson from './ScheduleLesson.svelte';
	import { createEventDispatcher } from 'svelte';

	export let dayName: string;
	export let lessons: Lesson[];

	const dispatch = createEventDispatcher();

	function handleLessonClick(event: MouseEvent, lesson: Lesson) {
		const target = event.target as HTMLElement;
		if (target && target.closest('a')) return;
		dispatch('lessonClick', lesson);
	}
</script>

<div class="mb-4 rounded-2xl bg-slate-900 p-4 last:mb-0">
	<h3 class="mb-2 text-2xl font-semibold text-white">{dayName}</h3>
	{#each lessons as lesson, index}
		<div class="cursor-pointer" on:click={(e) => handleLessonClick(e, lesson)}>
			<ScheduleLesson {lesson} isLastInDay={index === lessons.length - 1} />
		</div>
	{/each}
</div>
