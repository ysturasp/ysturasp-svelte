<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Setting } from '$lib/types';

  export let setting: Setting;

  const dispatch = createEventDispatcher();

  function extractGroupFromName(name: string): string {
    const match = name.match(/\((.*?)\)$/);
    return match ? match[1] : '';
  }

  $: group = extractGroupFromName(setting.name);
  $: nameWithoutGroup = setting.name.replace(/ \(.*?\)$/, '');
</script>

<div class="bg-slate-800 p-4 rounded-2xl">
  <h4 class="text-white font-semibold mb-1">
    {nameWithoutGroup}
    <span class="inline-flex items-center align-text-bottom">
      <span class="relative group mr-1">
        {#if setting.verified}
          <svg class="w-5 h-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-blue-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Проверено администратором
          </div>
        {/if}
      </span>
    </span>
  </h4>
  
  {#if group}
    <p class="text-slate-400 text-sm">Группа: {group}</p>
  {/if}
  
  <p class="text-slate-400 text-sm mb-1">
    Опубликовано: {new Date(setting.date).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })}
  </p>
  
  <div class="flex flex-wrap gap-2 mb-3">
    {#if setting.hasHiddenSubjects}
      <span class="text-xs bg-blue-900 text-blue-300 px-2 py-1 rounded">Скрытые предметы</span>
    {/if}
    {#if setting.hasSubgroupSettings}
      <span class="text-xs bg-emerald-900 text-green-300 px-2 py-1 rounded">Настройки подгрупп</span>
    {/if}
  </div>
  
  <button
    on:click={() => dispatch('apply', setting.id)}
    class="w-full p-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all"
  >
    Применить настройки
  </button>
</div> 