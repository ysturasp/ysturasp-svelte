<script lang="ts">
  import type { Teacher } from '../api';
  import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';

  export let teachers: Teacher[] = [];
  export let selectedTeacher = '';
  export let onSubmit: () => void;
  export let isLoading = false;
  let error = false;

  function handleSubmit() {
    if (!selectedTeacher) {
      error = true;
      return;
  }
    error = false;
    onSubmit();
  }

  $: items = teachers.map(teacher => ({
    id: teacher.name,
    displayValue: teacher.name
  }));
</script>

<ScheduleCombobox
  {items}
  bind:selectedId={selectedTeacher}
  onSubmit={handleSubmit}
      placeholder={isLoading ? "Загрузка преподавателей..." : "Выберите преподавателя"}
  paramName="teacher"
  copyLinkMessage="Ссылка на расписание преподавателя скопирована"
  {error}
  {isLoading}
/> 