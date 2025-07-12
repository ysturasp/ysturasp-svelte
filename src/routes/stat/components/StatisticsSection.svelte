<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { disciplinesDigitalSystems, disciplinesAiD, disciplinesCivilTransport } from '../data/disciplines';
  import type { Stats, Instructors, InstituteId, NotificationOptions } from '../types';
  import { getSubjectStats, getInstructors } from '../utils/api';
  
  const dispatch = createEventDispatcher<{
    showNotification: NotificationOptions;
    loading: { value: boolean };
    showReferral: void;
    instituteChange: InstituteId;
  }>();

  let selectedInstitute: InstituteId = 'btn-digital-systems';
  let currentDisciplines: string[] = disciplinesDigitalSystems;
  let filteredDisciplines: string[] = [];
  let selectedDiscipline = '';
  let searchQuery = '';
  let showOptions = false;
  let statistics: Stats | null = null;
  let instructors: Instructors | null = null;
  let remainingViews = '...';

  $: {
    filteredDisciplines = currentDisciplines.filter(discipline =>
      discipline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  function handleInstituteChange(institute: InstituteId) {
    selectedInstitute = institute;
    switch (institute) {
      case 'btn-digital-systems':
        currentDisciplines = disciplinesDigitalSystems;
        break;
      case 'btn-architecture-design':
        currentDisciplines = disciplinesAiD;
        break;
      case 'btn-civil-transport':
        currentDisciplines = disciplinesCivilTransport;
        break;
    }
    updateOptions();
    dispatch('instituteChange', institute);
  }

  function updateOptions() {
    filteredDisciplines = currentDisciplines.filter(discipline =>
      discipline.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  function selectDiscipline(discipline: string) {
    selectedDiscipline = discipline;
    showOptions = false;
  }

  function clearSelection() {
    selectedDiscipline = '';
    searchQuery = '';
  }

  async function getStatistics() {
    if (!selectedDiscipline) {
      dispatch('showNotification', {
        message: 'Пожалуйста, выберите дисциплину',
        type: 'error'
      });
      return;
    }

    dispatch('loading', { value: true });
    
    try {
      const [statsData, instructorsData] = await Promise.all([
        getSubjectStats(selectedInstitute, selectedDiscipline),
        getInstructors(selectedInstitute, selectedDiscipline)
      ]);

      statistics = statsData;
      instructors = instructorsData;

      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const newItem = { discipline: selectedDiscipline, stats: statsData };
      
      const updatedRecentlyViewed = [
        newItem,
        ...recentlyViewed.filter((item: { discipline: string }) => item.discipline !== selectedDiscipline)
      ].slice(0, 5);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));

    } catch (error) {
      dispatch('showNotification', {
        message: 'Ошибка при получении данных',
        type: 'error'
      });
      console.error('Error:', error);
    } finally {
      dispatch('loading', { value: false });
    }
  }

  export function viewSubject(subject: string) {
    selectedDiscipline = subject;
    searchQuery = subject;
    getStatistics();
  }

  onMount(() => {
    handleInstituteChange('btn-digital-systems');
  });
</script>

<section class="bg-slate-800 rounded-lg md:p-6 p-4 mt-8">
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <div class="flex items-center mb-0">
      <h2 class="text-2xl md:text-4xl font-semibold text-white">👨‍💻 Статистика оценок</h2>
      <span class="flex ml-2 mb-6 rounded-full bg-indigo-500 uppercase px-2 py-1 text-xs font-bold">Beta</span>
    </div>
    <div class="flex items-center justify-center">
      <span class="text-slate-300 mr-2">Доступно запросов:</span>
      <span class="text-white font-bold text-xl">{remainingViews}</span>
      <button 
        class="ml-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        on:click={() => dispatch('showReferral')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
  
  <div class="form-group">
    <p class="text-slate-300 mt-2">
      На данный момент поддерживается статистика предметов только ИЦС, ИАиД и ИИСиТ. 
      В будующем планируется добавление статистики и для других Институтов
    </p>
    
    <div class="flex items-center justify-center">
      <div class="mt-4 p-4 bg-indigo-800 items-center text-indigo-100 leading-none rounded-3xl flex lg:inline-flex mb-4">
        <h2 class="text-3xl font-semibold text-white mr-2">⚠️</h2>
        <p class="text-slate-300 text-center">
          Не полагайтесь стопроцентно на эти данные. 
          Большая часть в получении желаемой оценки всё же зависит только от ВАС
        </p>
        <h2 class="text-3xl font-semibold text-white ml-2">⚠️</h2>
      </div>
    </div>

    <label class="block mb-2 text-sm font-medium text-slate-400">Выберите институт:</label>
    <div class="institute-buttons mb-3">
      <button 
        class="institute-button {selectedInstitute === 'btn-digital-systems' ? 'active' : ''}"
        on:click={() => handleInstituteChange('btn-digital-systems')}
      >
        Институт Цифровых Систем
      </button>
      <button 
        class="institute-button {selectedInstitute === 'btn-architecture-design' ? 'active' : ''}"
        on:click={() => handleInstituteChange('btn-architecture-design')}
      >
        Институт Архитектуры и Дизайна
      </button>
      <button 
        class="institute-button {selectedInstitute === 'btn-civil-transport' ? 'active' : ''}"
        on:click={() => handleInstituteChange('btn-civil-transport')}
      >
        Институт Инженеров Строительства и Транспорта
      </button>
    </div>

    <label for="discipline-input" class="block mb-2 text-sm font-medium text-slate-400">
      Выберите дисциплину:
    </label>
    <div class="relative">
      <input
        id="discipline-input"
        type="text"
        class="block w-full p-2.5 bg-slate-900 border border-gray-600 rounded-lg text-gray-300 focus:ring-blue-500 focus:border-blue-500"
        placeholder="Выберите дисциплину..."
        bind:value={searchQuery}
        on:focus={() => showOptions = true}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />

      {#if selectedDiscipline}
        <button
          class="clear-button absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
          on:click={clearSelection}
        >
          ×
        </button>
      {/if}

      {#if showOptions}
        <ul
          class="absolute w-full bg-slate-900 border border-gray-600 rounded-lg mt-1 max-h-60 overflow-y-auto z-50"
        >
          {#each filteredDisciplines as discipline}
            <li
              class="p-2 cursor-pointer hover:bg-gray-700 rounded"
              on:click={() => selectDiscipline(discipline)}
            >
              {discipline}
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <button
      class="btn btn-primary btn-block mt-3 p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-all w-full"
      on:click={getStatistics}
    >
      Получить статистику
    </button>
  </div>

  {#if statistics}
    <div class="result mt-4">
      <div style="text-align: center;">
        <h3 class="text-2xl md:text-3xl font-bold mb-4">
          Статистика по предмету "{selectedDiscipline}"
        </h3>
      </div>
      
      {#if (statistics.count5 + statistics.count4 + statistics.count3 + statistics.count2) < 25}
        <div class="bg-red-500 text-white font-bold p-2 rounded-lg mb-4">
          ⚠️⚠️⚠️ Данных недостаточно, статистика может быть неточна ⚠️⚠️⚠️
        </div>
      {/if}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="rounded-lg p-4 text-center" style="border: 3px solid #f8fafc;">
          <h2 class="text-2xl font-bold mb-2">
            Средний балл {statistics.average >= 4 ? "😍" : "😭"}
          </h2>
          <p class="text-slate-300 text-2xl">{statistics.average.toFixed(2)}</p>
        </div>
        <div class="rounded-lg p-4 text-center" style="border: 3px solid #f8fafc;">
          <h2 class="text-2xl font-bold mb-2">Всего оценок проанализировано</h2>
          <p class="text-slate-300 text-2xl">
            {statistics.count5 + statistics.count4 + statistics.count3 + statistics.count2}
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <div class="rounded-lg p-4 text-center grade-element cursor-pointer" style="border: 3px solid #f8fafc;">
          <h3 class="text-xl font-bold mb-2">Пятерок</h3>
          <p class="text-slate-300 text-2xl">{statistics.count5}</p>
        </div>
        <div class="rounded-lg p-4 text-center grade-element cursor-pointer" style="border: 3px solid #f8fafc;">
          <h3 class="text-xl font-bold mb-2">Четверок</h3>
          <p class="text-slate-300 text-2xl">{statistics.count4}</p>
        </div>
        <div class="rounded-lg p-4 text-center grade-element cursor-pointer" style="border: 3px solid #f8fafc;">
          <h3 class="text-xl font-bold mb-2">Троек</h3>
          <p class="text-slate-300 text-2xl">{statistics.count3}</p>
        </div>
        <div class="rounded-lg p-4 text-center grade-element cursor-pointer" style="border: 3px solid #f8fafc;">
          <h3 class="text-xl font-bold mb-2">Двоек</h3>
          <p class="text-slate-300 text-2xl">{statistics.count2}</p>
        </div>
      </div>
    </div>
  {/if}

  {#if instructors}
    <div class="result mt-4">
      <h3 class="text-xl font-bold mb-2">
        <span>Преподаватели:</span>
        <span class="text-sm">{instructors.teachers[0].split(',').join(', ')}</span>
      </h3>
    </div>
  {/if}
</section>

<style>
  .institute-button {
    background-color: #374151;
    color: #ffffff;
    padding: 6px 12px;
    margin: 5px;
    border-radius: 8px;
    font-weight: 500;
    text-align: center;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.3s, box-shadow 0.3s;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .institute-button:hover {
    background-color: #374151;
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
  }

  .institute-button.active {
    background-color: #2563eb;
    border-color: #3b82f6;
    box-shadow: 0 8px 12px rgba(37, 99, 235, 0.3);
  }

  .institute-button:focus {
    outline: none;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
  }

  .clear-button {
    font-size: 1.5rem;
    padding: 0 0.5rem;
  }
</style> 