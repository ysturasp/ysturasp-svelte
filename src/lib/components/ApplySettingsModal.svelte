<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import type { Setting, SubjectType } from '$lib/types';

  export let isOpen = false;
  export let setting: Setting | null = null;

  const dispatch = createEventDispatcher();

  let group = '';
  $: {
    if (setting?.hiddenSubjects) {
      const hiddenSubjects = JSON.parse(setting.hiddenSubjects);
      group = Object.keys(hiddenSubjects)[0]?.split('hiddenSubjects_')[1] || '';
    } else if (setting?.name) {
      const match = setting.name.match(/\((.*?)\)$/);
      group = match ? match[1] : '';
    }
  }

  const lessonTypes: { [key: number]: string } = {
    0: 'none',
    2: 'Лекция',
    4: 'Практика',
    8: 'Лабораторная работа',
    1: 'Курсовой проект',
    5: 'Консультация',
    6: 'Лекция + Практика',
    7: 'Дифференцированный зачет',
    3: 'Экзамен',
    9: 'Библиотека',
    10: 'Лекция + Лабораторная работа',
    11: 'Организационное собрание',
    12: 'Не поддерживается'
  };

  function parseSubjectTypes(types: unknown): SubjectType[] {
    if (Array.isArray(types)) {
      return types.map(type => ({
        type: Number(type.type),
        teacher: String(type.teacher)
      }));
    }
    return [];
  }
</script>

<Modal
  title="Подтверждение"
  {isOpen}
  on:close={() => dispatch('close')}
>
  {#if setting}
    <div class="text-slate-300 mb-6">
      <p class="mb-4">Это действие перезапишет ваши текущие настройки для группы {group}.</p>
      
      <div class="bg-slate-800 p-4 rounded-lg mb-4">
        <h4 class="text-white font-semibold mb-2">Скрытые предметы:</h4>
        <div class="space-y-2">
          {#if setting.hiddenSubjects}
            {#each Object.entries(JSON.parse(setting.hiddenSubjects)[`hiddenSubjects_${group}`] || {}) as [subject, types]}
              <div class="text-slate-400">
                <span class="text-blue-400">{subject}</span>
                <ul class="ml-4 list-disc">
                  {#each parseSubjectTypes(types) as type}
                    <li>{type.teacher} ({lessonTypes[type.type] || 'Неизвестный тип'})</li>
                  {/each}
                </ul>
              </div>
            {/each}
          {:else}
            <p class="text-slate-400">Нет скрытых предметов</p>
          {/if}
        </div>
      </div>

      <div class="bg-slate-800 p-4 rounded-lg">
        <h4 class="text-white font-semibold mb-2">Настройки подгрупп:</h4>
        <div class="space-y-2">
          {#if setting.subgroupSettings}
            {#each Object.entries(JSON.parse(JSON.parse(setting.subgroupSettings).subgroupSettings)) as [subject, isEnabled]}
              {#if subject}
                <div class="flex items-center gap-2">
                  <span class={isEnabled ? 'text-green-400' : 'text-red-400'}>
                    {isEnabled ? '✓' : '✗'}
                  </span>
                  <span class="text-slate-400">{subject === 'null' ? 'null' : subject}</span>
                </div>
              {/if}
            {/each}
          {:else}
            <p class="text-slate-400">Нет настроек подгрупп</p>
          {/if}
        </div>
      </div>
    </div>
    <div class="flex justify-end gap-4">
      <button
        class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-all"
        on:click={() => dispatch('close')}
      >
        Отмена
      </button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all"
        on:click={() => dispatch('confirm')}
      >
        Продолжить
      </button>
    </div>
  {/if}
</Modal> 