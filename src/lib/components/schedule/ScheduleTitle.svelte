<script lang="ts">
  export let title: string;
  export let subtitle: string | undefined = undefined;
  export let type: 'group' | 'teacher' | 'audience' = 'group';

  const typeLabels = {
    group: 'Расписание группы',
    teacher: 'Расписание преподавателя',
    audience: 'Расписание аудитории'
  };
</script>

<div class="flex justify-center md:items-center flex-col">
  <h2 
    class="p-4 md:pr-20 md:pl-20 md:ml-20 md:mr-20 sm:ml-0 sm:mr-0 rounded-lg text-center text-xl lg:text-3xl md:text-xl font-bold text-white shadow-lg transition"
    style="background: radial-gradient(rgba(0, 96, 255, 0.74) 10%, rgba(255, 255, 255, 0) 100%);"
  >
    {typeLabels[type]} {title}
    {#if subtitle}
      <p class="text-sm text-gray-400 mt-2">
        {subtitle}
      </p>
    {/if}
  </h2>
</div> 