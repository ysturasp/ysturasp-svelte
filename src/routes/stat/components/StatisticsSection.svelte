<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { disciplinesDigitalSystems, disciplinesAiD, disciplinesCivilTransport } from '../data/disciplines';
  import type { Stats, Instructors, InstituteId, NotificationOptions } from '../types';
  import { getSubjectStats, getInstructors, checkViewLimit } from '../utils/api';
  
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
  let displayedDiscipline = '';
  let searchQuery = '';
  let showOptions = false;
  let statistics: Stats | null = null;
  let instructors: Instructors | null = null;
  let remainingViews = '...';
  let overlay: HTMLDivElement;

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
    searchQuery = discipline;
    showOptions = false;
    overlay.classList.add('hidden');
  }

  function clearSelection() {
    selectedDiscipline = '';
    searchQuery = '';
  }

  function handleFocus() {
    showOptions = true;
    overlay.classList.remove('hidden');
    setTimeout(() => {
      const inputField = document.getElementById('combobox-input');
      if (inputField) {
        window.scrollTo({
          top: inputField.getBoundingClientRect().top + window.pageYOffset - 115,
          behavior: 'smooth'
        });
      }
    }, 300);
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
      const limitCheck = await checkViewLimit(false);
      if (!limitCheck.success) {
        dispatch('showNotification', {
          message: 'Достигнут дневной лимит просмотров. Пригласите друзей, чтобы увеличить лимит!',
          type: 'warning'
        });
        dispatch('showReferral');
        return;
      }

      const statsPromise = getSubjectStats(selectedInstitute, selectedDiscipline);
      const instructorsPromise = getInstructors(selectedInstitute, selectedDiscipline);

      const [statsData, instructorsData] = await Promise.all([
        statsPromise.catch(error => {
          console.error('Error fetching stats:', error);
          throw error;
        }),
        instructorsPromise.catch(error => {
          console.error('Error fetching instructors:', error);
          throw error;
        })
      ]);

      if (!statsData || !instructorsData) {
        throw new Error('Failed to fetch data');
      }

      statistics = statsData;
      instructors = instructorsData;
      displayedDiscipline = selectedDiscipline;

      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const newItem = { discipline: selectedDiscipline, stats: statsData };
      
      const updatedRecentlyViewed = [
        newItem,
        ...recentlyViewed.filter((item: { discipline: string }) => item.discipline !== selectedDiscipline)
      ].slice(0, 5);
      
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));

      const viewsCheck = await checkViewLimit(true);
      if (viewsCheck.success) {
        remainingViews = viewsCheck.remaining.toString();
      }

    } catch (error) {
      console.error('Error in getStatistics:', error);
      dispatch('showNotification', {
        message: 'Ошибка при получении данных',
        type: 'error'
      });
      statistics = null;
      instructors = null;
    } finally {
      setTimeout(() => {
        dispatch('loading', { value: false });
      }, 0);
    }
  }

  export function viewSubject(subject: string) {
    selectedDiscipline = subject;
    searchQuery = subject;
    getStatistics();
  }

  onMount(() => {
    overlay = document.createElement('div');
    overlay.classList.add('ambient-overlay', 'hidden');
    document.body.appendChild(overlay);

    document.addEventListener('click', handleClickOutside);

    checkViewLimit(true).then(response => {
      if (response.success) {
        remainingViews = response.remaining.toString();
      } else {
        remainingViews = '0';
      }
    }).catch(error => {
      console.error('Error updating remaining views:', error);
      remainingViews = '0';
    });

    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };
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
      <div class="mt-4 p-4 bg-indigo-800 items-center text-indigo-100 leading-none rounded-3xl flex flex-col justify-center relative overflow-hidden mb-4 warning-block">
        <div class="emoji-bg absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <span class="emoji" style="top:10%;left:5%;font-size:2.5rem;opacity:0.18;">⚠️</span>
          <span class="emoji" style="top:20%;left:60%;font-size:3.2rem;opacity:0.13;">⚠️</span>
          <span class="emoji" style="top:60%;left:20%;font-size:2.8rem;opacity:0.15;">⚠️</span>
          <span class="emoji" style="top:70%;left:70%;font-size:2.2rem;opacity:0.12;">⚠️</span>
          <span class="emoji" style="top:40%;left:40%;font-size:4rem;opacity:0.09;">⚠️</span>
          <span class="emoji" style="top:80%;left:10%;font-size:2.1rem;opacity:0.14;">⚠️</span>
          <span class="emoji" style="top:15%;left:80%;font-size:2.7rem;opacity:0.11;">⚠️</span>
          <span class="emoji" style="top:50%;left:80%;font-size:2.3rem;opacity:0.13;">⚠️</span>
          <span class="emoji" style="top:85%;left:55%;font-size:2.6rem;opacity:0.10;">⚠️</span>
        </div>
        <div class="flex items-center justify-center z-10 relative">
          <p class="text-slate-300 text-center font-medium z-10 relative">
            Не полагайтесь стопроцентно на эти данные.<br>
            Большая часть в получении желаемой оценки всё же зависит только от ВАС
          </p>
        </div>
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
        id="combobox-input"
        type="text"
        class="block w-full p-2.5 bg-slate-900 border border-gray-600 rounded-lg text-gray-300 focus:ring-blue-500 focus:border-blue-500"
        class:ambient-focuss={showOptions}
        placeholder="Выберите дисциплину..."
        bind:value={searchQuery}
        on:focus={handleFocus}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
      />

      {#if selectedDiscipline}
        <button
          class="clear-button"
          on:click|stopPropagation={clearSelection}
        >
          ×
        </button>
      {/if}

      {#if showOptions}
        <ul
          id="combobox-options"
          class="absolute w-full p-2 bg-slate-900 border border-gray-600 rounded-lg mt-1 overflow-hidden combobox-options"
          class:active={showOptions}
          class:ambient-focus={showOptions}
        >
          {#each filteredDisciplines as discipline}
            <li
              class="p-2 cursor-pointer hover:bg-gray-700 rounded"
              on:mousedown={() => selectDiscipline(discipline)}
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
          Статистика по предмету "{displayedDiscipline}"
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

  .ambient-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(30, 30, 30, 0.7);
    z-index: 9998;
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    pointer-events: none;
    transition: backdrop-filter 0.6s ease-in-out, background 0.6s ease-in-out;
  }

  .ambient-focuss {
    position: relative;
    border-radius: 10px;
    background: rgba(1, 21, 51, 0.931);
    box-shadow: 0 0 200px rgb(0, 57, 117);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 9999;
  }

  .ambient-focus {
    border-radius: 10px;
    background: rgba(1, 21, 51, 0.931);
    box-shadow: 0 0 200px rgb(0, 57, 117);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    z-index: 9999;
    transition: box-shadow 0.6s ease-in-out, backdrop-filter 0.6s ease-in-out;
  }

  input {
    transition: all 0.4s ease-in-out;
  }

  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.8);
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
    border-radius: 10px;
    transition: background-color 0.3s ease-in-out;
  }

  .combobox-options li:hover {
    border-radius: 10px;
    background-color: #0072e461;
  }

  .emoji-bg {
    z-index: 1;
  }
  .emoji-bg .emoji {
    position: absolute;
    user-select: none;
    filter: blur(0.2px);
    transition: opacity 0.3s;
  }
  @media (max-width: 600px) {
    .emoji-bg .emoji {
      font-size: 1.2rem !important;
      opacity: 0.13 !important;
    }
    .warning-block {
      min-height: 80px;
    }
  }
</style> 