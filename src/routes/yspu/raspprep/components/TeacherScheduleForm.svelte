<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { notifications } from '$lib/stores/notifications';

  export let teachers: { id: string; name: string }[] = [];
  export let selectedTeacher = '';
  export let onSubmit: () => void;

  let searchQuery = '';
  let showOptions = false;
  let filteredTeachers: { id: string; name: string }[] = [];
  let overlay: HTMLDivElement;

  $: {
    filteredTeachers = teachers.filter(teacher =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  function selectTeacher(teacher: { id: string; name: string }) {
    selectedTeacher = teacher.name;
    searchQuery = teacher.name;
    showOptions = false;
    overlay.classList.add('hidden');
  }

  function clearSelection() {
    selectedTeacher = '';
    searchQuery = '';
  }

  function handleFocus() {
    showOptions = true;
    overlay.classList.remove('hidden');
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const input = document.getElementById('combobox-input');
    const options = document.getElementById('combobox-options');
    
    if (input && options && !input.contains(target) && !options.contains(target)) {
      showOptions = false;
      overlay.classList.add('hidden');
    }
  }

  async function copyScheduleLink() {
    if (!selectedTeacher) {
      notifications.add('Сначала выберите преподавателя', 'error');
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('teacher', selectedTeacher);
    const textToCopy = url.toString();

    try {
      await navigator.clipboard.writeText(textToCopy);
      notifications.add('Ссылка скопирована в буфер обмена', 'success');
    } catch (error) {
      try {
        const tempInput = document.createElement('input');
        tempInput.value = textToCopy;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        notifications.add('Ссылка скопирована в буфер обмена', 'success');
      } catch (fallbackError) {
        notifications.add('Не удалось скопировать ссылку', 'error');
      }
    }
  }

  onMount(() => {
    overlay = document.createElement('div');
    overlay.classList.add('ambient-overlay', 'hidden');
    document.body.appendChild(overlay);

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
  });
</script>

<form class="grid grid-cols-1 gap-4" on:submit|preventDefault={onSubmit}>
  <div class="relative">
    <input
      id="combobox-input"
      type="text"
      class="block w-full p-2.5 bg-slate-900 border border-gray-600 rounded-2xl text-gray-300 focus:ring-blue-500 focus:border-blue-500"
      class:ambient-focuss={showOptions}
      placeholder="Выберите преподавателя..."
      bind:value={searchQuery}
      on:focus={handleFocus}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
    />

    {#if selectedTeacher}
      <button
        type="button"
        class="clear-button"
        on:click|stopPropagation={clearSelection}
      >
        ×
      </button>
    {/if}

    {#if showOptions}
      <ul
        id="combobox-options"
        class="absolute w-full p-2 bg-slate-900 border border-gray-600 rounded-2xl mt-1 overflow-hidden combobox-options"
        class:active={showOptions}
        class:ambient-focus={showOptions}
      >
        {#each filteredTeachers as teacher}
          <li
            class="p-2 cursor-pointer hover:bg-gray-700 rounded"
            on:mousedown={() => selectTeacher(teacher)}
          >
            {teacher.name}
          </li>
        {/each}
      </ul>
    {/if}
  </div>

  <button
    type="submit"
    class="p-2 bg-blue-700 text-white rounded-2xl hover:bg-blue-600 transition-all"
    disabled={!selectedTeacher}
  >
    Показать расписание
  </button>

  <button
    type="button"
    class="p-2 border-2 border-blue-700 text-white rounded-lg hover:border-blue-800 transition-all flex items-center justify-center"
    on:click={copyScheduleLink}
    disabled={!selectedTeacher}
  >
    <span class="text-3xl md:text-xl align-middle">🔗</span>
    <span class="ml-2 text-sm align-middle hidden md:inline">Скопировать ссылку на расписание</span>
  </button>
</form>

<style>
  .clear-button {
    display: none;
    position: absolute;
    padding-left: 7px;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    color: gray;
    font-size: 2rem;
    cursor: pointer;
    z-index: 9999;
  }

  .relative input:not(:placeholder-shown) + .clear-button {
    display: block;
  }

  .combobox-options {
    max-height: 300px;
    overflow-y: auto;
    opacity: 0;
    transform: translateY(-10px);
    transition: opacity 0.8s ease, transform 0.8s ease;
    max-height: 0;
    overflow: scroll;
  }

  .combobox-options.active {
    opacity: 1;
    transform: translateY(0);
    max-height: 300px;
  }

  .combobox-options li {
    border-radius: 18px;
    transition: background-color 0.3s ease-in-out;
  }

  .combobox-options li:hover {
    border-radius: 18px;
    background-color: #0072e461;
  }
</style> 