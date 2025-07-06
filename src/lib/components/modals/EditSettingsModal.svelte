<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Modal from './Modal.svelte';

  export let isOpen = false;
  let token = '';

  const dispatch = createEventDispatcher();

  function handleEdit() {
    if (!token.trim()) {
      dispatch('error', 'Пожалуйста, введите токен');
      return;
    }
    dispatch('edit', token);
  }

  function handleDelete() {
    if (!token.trim()) {
      dispatch('error', 'Пожалуйста, введите токен');
      return;
    }
    dispatch('delete', token);
  }

  function handleClose() {
    token = '';
    dispatch('close');
  }
</script>

<Modal title="Введите токен" {isOpen} on:close={handleClose}>
  <input
    type="text"
    bind:value={token}
    class="p-2 bg-slate-800 text-white rounded-lg focus:outline-none w-full mb-4"
    placeholder="Токен"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
  >
  <div class="flex justify-center gap-4">
    <button
      on:click={handleEdit}
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
    >
      Редактировать
    </button>
    <button
      on:click={handleDelete}
      class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
    >
      Удалить
    </button>
    <button
      on:click={handleClose}
      class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
    >
      Отмена
    </button>
  </div>
</Modal> 