<script lang="ts">
    import type { Lesson } from '$lib/types/schedule';
    import ScheduleLesson from './ScheduleLesson.svelte';

    export let dayName: string;
    export let lessons: Lesson[];
</script>

<div class="p-4 bg-slate-900 rounded-2xl mb-4">
    <h3 class="text-2xl font-semibold text-white mb-2">{dayName}</h3>
    {#each lessons as lesson, index}
        <ScheduleLesson 
            {lesson}
            isLastInDay={index === lessons.length - 1}
        />
    {/each}
</div> 