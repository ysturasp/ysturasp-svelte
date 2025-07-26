<script lang="ts">
	import type { Lesson } from '$lib/types/schedule';
	import ScheduleLesson from './ScheduleLesson.svelte';

	export let dayName: string;
	export let lessons: Lesson[];
</script>

<div class="mb-4 rounded-2xl bg-slate-900 p-4">
	<h3 class="mb-2 text-2xl font-semibold text-white">{dayName}</h3>
	{#each lessons as lesson, index}
		<ScheduleLesson {lesson} isLastInDay={index === lessons.length - 1} />
	{/each}
</div>
