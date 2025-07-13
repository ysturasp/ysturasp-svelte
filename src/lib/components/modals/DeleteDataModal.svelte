<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';
  import type { CacheItem } from '$lib/utils/cache';

  export let isOpen = false;
  export let items: CacheItem[] = [];

  const dispatch = createEventDispatcher();

  function selectAll() {
    const allChecked = items.every(item => item.checked);
    items = items.map(item => ({ ...item, checked: !allChecked }));
  }

  function handleDelete() {
    dispatch('delete', items);
  }

  function handleClose() {
    dispatch('close');
  }
</script>

<Modal title="Удаление данных" {isOpen} on:close={handleClose}>
  <p class="text-slate-400 mb-4">Выберите данные для удаления:</p>
  
  <div class="mb-4 p-4 bg-gray-800 rounded-2xl overflow-y-auto max-h-60">
    {#each items as item}
      <div class="flex items-center justify-start gap-2 mb-2">
        <input
          type="checkbox"
          id={item.key}
          bind:checked={item.checked}
          class="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
        >
        <label for={item.key} class="text-slate-400 text-left">{item.displayText}</label>
      </div>
    {/each}
  </div>

  <div class="flex justify-center gap-4">
    <button
      on:click={selectAll}
      class="px-4 py-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all"
    >
      Выбрать всё
    </button>
    <button
      on:click={handleDelete}
      class="px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all"
    >
      Удалить
    </button>
    <button
      on:click={handleClose}
      class="px-4 py-2 bg-gray-600 text-white rounded-2xl hover:bg-gray-700 transition-all"
    >
      Отмена
    </button>
  </div>
</Modal> 