<script lang="ts">
  import { onMount } from 'svelte';
  import { getDirections, getSchedule } from './api';
  import type { Direction, ScheduleData, Lesson, Course, ScheduleItem, Day } from '$lib/types/schedule';
  import LoadingOverlay from './components/LoadingOverlay.svelte';
  import PageLayout from '$lib/components/layout/PageLayout.svelte';
  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';
  import ScheduleTitle from './components/ScheduleTitle.svelte';
  import { notifications } from '$lib/stores/notifications';
  import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';

  let isLoading = false;
  let directions: Direction[] = [];
  let selectedDirection = '';
  let selectedGroup = '';
  let scheduleData: ScheduleData | null = null;
  let viewMode = 'all';
  let groupNumbersMap: Record<string, string> = {};

  const storage = {
    get: (key: string, defaultValue: string = '') => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key) || defaultValue;
      }
      return defaultValue;
    },
    set: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    }
  };

  onMount(async () => {
    try {
      directions = await getDirections();
      viewMode = storage.get('scheduleViewMode', 'all');

      const lastDirection = storage.get('lastYspuInstitut');
      const lastGroup = storage.get('lastYspuGroup');

      if (lastDirection) {
        selectedDirection = lastDirection;
        if (lastGroup) {
          selectedGroup = lastGroup;
          await loadSchedule();
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  });

  async function loadSchedule() {
    if (!selectedDirection || !selectedGroup) return;

    try {
      isLoading = true;
      scheduleData = await getSchedule(selectedDirection);

      const courses = Object.entries(directions.find(d => d.id === selectedDirection)?.courses || {});
      groupNumbersMap = {};
      scheduleData.items.forEach(item => {
        const courseIndex = courses.findIndex(([_, course]) => 
          (course as Course).name.includes(item.courseInfo.number)
        );
        if (courseIndex !== -1) {
          groupNumbersMap[courses[courseIndex][0]] = item.courseInfo.number;
        }
      });

      storage.set('lastYspuInstitut', selectedDirection);
      storage.set('lastYspuGroup', selectedGroup);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      isLoading = false;
    }
  }

  function handleDirectionChange() {
    selectedGroup = '';
    scheduleData = null;
    groupNumbersMap = {};
  }

  function handleSubmit() {
    loadSchedule();
  }

  function toggleViewMode(mode: 'all' | 'actual') {
    viewMode = mode;
    storage.set('scheduleViewMode', mode);
  }

  function getGroupNumber(selectedGroup: string): string | null {
    if (!scheduleData) return null;
    const firstItem = scheduleData.items[0];
    return firstItem?.courseInfo.number || null;
  }

  $: actualGroupNumber = groupNumbersMap[selectedGroup];

  function isLessonInDate(lesson: Lesson) {
    if (!lesson.startDate && !lesson.endDate) return true;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (lesson.startDate && lesson.endDate) {
      const startParts = lesson.startDate.split('.');
      const endParts = lesson.endDate.split('.');
      const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
      const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);

      return today >= startDate && today <= endDate;
    } else if (lesson.startDate) {
      const startParts = lesson.startDate.split('.');
      const startDate = new Date(`${startParts[2]}-${startParts[1]}-${startParts[0]}`);
      return today >= startDate;
    } else if (lesson.endDate) {
      const endParts = lesson.endDate.split('.');
      const endDate = new Date(`${endParts[2]}-${endParts[1]}-${endParts[0]}`);
      return today <= endDate;
    }

    return true;
  }

  const days = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье'
  ];

  const lessonTypes = {
    lecture: { class: 'text-blue-400', text: 'Лекция' },
    practice: { class: 'text-amber-500', text: 'Практика' },
    other: { class: 'text-white-500', text: 'Занятие' }
  };

  const lessonTypeColors = {
    lecture: 'border-blue-400',
    practice: 'border-amber-500',
    other: 'border-slate-300'
  };

  function getTimeContainer(lesson: Lesson) {
    if (lesson.additionalSlots && lesson.additionalSlots.length > 0) {
      const lastSlot = lesson.additionalSlots[lesson.additionalSlots.length - 1];
      const startTimeText = lesson.timeInfo?.customStartTime || lesson.startAt;
      const endTimeText = lesson.timeInfo?.customEndTime || lastSlot.endAt;
      
      return {
        isMultiLesson: true,
        startTime: {
          time: startTimeText,
          isCustom: !!lesson.timeInfo?.customStartTime,
          originalTime: lesson.startAt
        },
        endTime: {
          time: endTimeText,
          isCustom: !!lesson.timeInfo?.customEndTime,
          originalTime: lastSlot.endAt
        },
        duration: lesson.additionalSlots.length + 1
      };
    } else {
      const startTimeText = lesson.timeInfo?.customStartTime || lesson.startAt;
      const endTimeText = lesson.timeInfo?.customEndTime || lesson.endAt;
      
      return {
        isMultiLesson: false,
        startTime: {
          time: startTimeText,
          isCustom: !!lesson.timeInfo?.customStartTime,
          originalTime: lesson.startAt
        },
        endTime: {
          time: endTimeText,
          isCustom: !!lesson.timeInfo?.customEndTime,
          originalTime: lesson.endAt
        },
        duration: 1
      };
    }
  }

  function processLessons(lessons: Lesson[]): Lesson[] {
    const processedLessons: Lesson[] = [];
    const skipLessons = new Set<number>();

    for (let i = 0; i < lessons.length; i++) {
      if (skipLessons.has(i)) continue;

      const currentLesson = lessons[i];
      const consecutiveLessons: Lesson[] = [currentLesson];

      for (let j = i + 1; j < lessons.length; j++) {
        const nextLesson = lessons[j];
        if (
          nextLesson.lessonName === currentLesson.lessonName &&
          nextLesson.teacherName === currentLesson.teacherName &&
          nextLesson.auditoryName === currentLesson.auditoryName &&
          nextLesson.type === currentLesson.type
        ) {
          consecutiveLessons.push(nextLesson);
          skipLessons.add(j);
        } else {
          break;
        }
      }

      if (consecutiveLessons.length > 1) {
        const lastLesson = consecutiveLessons[consecutiveLessons.length - 1];
        processedLessons.push({
          ...currentLesson,
          endAt: lastLesson.endAt,
          additionalSlots: consecutiveLessons.slice(1).map(l => ({
            number: l.number,
            endAt: l.endAt
          }))
        });
      } else {
        processedLessons.push(currentLesson);
      }
    }

    return processedLessons;
  }

  async function copyScheduleLink() {
    if (!selectedDirection || !selectedGroup) {
      notifications.add('Сначала выберите профиль и группу', 'error');
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('direction', selectedDirection);
    url.searchParams.set('group', selectedGroup);

    try {
      await navigator.clipboard.writeText(url.toString());
      notifications.add('Ссылка скопирована в буфер обмена', 'success');
    } catch (error) {
      notifications.add('Не удалось скопировать ссылку', 'error');
    }
  }
</script>

<svelte:head>
  <title>ystuRASP. Расписание занятий ЯГПУ</title>
  <meta name="description" content="Актуальное расписание занятий ЯГПУ. Найдите свои занятия по группе" />
</svelte:head>

<PageLayout>
  <Header />
  
  <main class="container mx-auto mt-5 md:mt-7 px-3 md:px-0">
    <section class="bg-slate-800 rounded-2xl sm:p-6 p-4 mt-8">
      <div class="bg-amber-500 text-black text-center p-4 rounded-2xl mb-4 relative">
        <span class="absolute -top-2 -right-2 transform rotate-12 flex rounded-full bg-indigo-500 uppercase px-2 py-1 text-xs font-bold text-white shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors">
          Beta
        </span>
        <div class="flex items-center justify-center gap-2">
          <div class="h-3 w-3 mr-1 rounded-full ring-8 animate-pulse" style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"></div>
          <p class="font-semibold mb-1">Расписание актуально</p>
        </div>
      </div>

      <div class="flex items-center mb-4">
        <h2 class="text-4xl font-semibold text-white">📅</h2>
        <h2 class="text-2xl md:text-4xl font-semibold text-white ml-2">
          Расписание занятий ФСУ ЯГПУ
        </h2>
      </div>

      <form class="grid grid-cols-1 gap-4" on:submit|preventDefault={handleSubmit}>
        <div>
          <label for="institute-select" class="block text-white mb-2">Выберите профиль:</label>
          <select
            id="institute-select"
            class="w-full p-2 bg-slate-900 text-white rounded-xl"
            bind:value={selectedDirection}
            on:change={handleDirectionChange}
          >
            <option value="">Выберите профиль</option>
            {#each directions as direction}
              <option value={direction.id}>{direction.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="group-select" class="block text-white mb-2">Выберите группу:</label>
          <select
            id="group-select"
            class="w-full p-2 bg-slate-900 text-white rounded-xl"
            bind:value={selectedGroup}
            disabled={!selectedDirection}
          >
            <option value="">Сначала выберите профиль</option>
            {#if selectedDirection}
              {#each Object.entries(directions.find(d => d.id === selectedDirection)?.courses || {}) as [key, course]}
                <option value={key}>{(course as Course).name}</option>
              {/each}
            {/if}
          </select>
        </div>

        <button
          type="submit"
          class="p-2 bg-blue-700 text-white rounded-xl hover:bg-blue-600 transition-all"
          disabled={!selectedDirection || !selectedGroup}
        >
          Показать расписание
        </button>

        <div class="flex justify-between items-center w-full">
          <button
            type="button"
            on:click={copyScheduleLink}
            class="p-2 border-2 border-blue-700 text-white rounded-lg hover:border-blue-800 transition-all flex items-center justify-center"
          >
            <span class="text-3xl md:text-xl align-middle">🔗</span>
            <span class="ml-2 text-sm align-middle hidden md:inline">Скопировать ссылку на расписание</span>
          </button>
        </div>
      </form>

      {#if scheduleData}
        <div class="mt-4">
          {#if scheduleData.items.length > 0}
            <ScheduleTitle 
              groupNumber={actualGroupNumber} 
              startDate={scheduleData.items[0].courseInfo.startDate} 
            />
          {/if}
          
          <div class="flex justify-center items-center">
            <div class="bg-slate-800 rounded-2xl p-2 flex items-center">
              <button
                class="px-4 py-2 rounded-2xl mr-2 transition-all {viewMode === 'all' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400'}"
                on:click={() => toggleViewMode('all')}
              >
                Общее расписание
              </button>
              <button
                class="px-4 py-2 rounded-2xl transition-all {viewMode === 'actual' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-400'}"
                on:click={() => toggleViewMode('actual')}
              >
                Актуальное по дате
              </button>
            </div>
          </div>

          <!-- <div class="bg-slate-800 p-4 rounded-2xl mb-4">
            <p class="text-white">Отладка:</p>
            <p class="text-white text-sm">Выбранная группа (value): {selectedGroup}</p>
            <p class="text-white text-sm">Маппинг групп: {JSON.stringify(groupNumbersMap)}</p>
            <p class="text-white text-sm">Актуальный номер группы: {actualGroupNumber}</p>
          </div> -->

          {#each days as day, dayIndex}
            {@const dayLessons = scheduleData.items
              .filter((item: ScheduleItem) => item.courseInfo.number === actualGroupNumber)
              .flatMap(item => item.days
                .filter(d => d.info.type === dayIndex)
                .flatMap(d => processLessons(d.lessons))
                .filter(lesson => viewMode === 'all' || isLessonInDate(lesson))
              )}
            {#if dayLessons.length > 0}
              <div class="p-4 bg-slate-900 rounded-2xl mb-4">
                <h3 class="text-2xl font-semibold text-white mb-2">{day}</h3>
                {#each dayLessons as lesson, index}
                  {@const timeInfo = getTimeContainer(lesson)}
                  <div class="bg-slate-800 p-4 rounded-2xl {index !== dayLessons.length - 1 ? 'mb-2' : ''} flex relative {timeInfo.isMultiLesson ? 'multi-lesson' : ''}">
                    {#if timeInfo.isMultiLesson}
                      <div class="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-4/5 bg-blue-400 rounded-full"></div>
                    {/if}
                    
                    <div class="time-container border-r-2 {lessonTypeColors[lesson.type as keyof typeof lessonTypeColors] || 'border-slate-300'}">
                      <div class="time-slot relative group {timeInfo.startTime.isCustom ? 'custom' : ''}">
                        {timeInfo.startTime.time}
                        {#if timeInfo.startTime.isCustom}
                          <div class="tooltip">
                            Изменено с {timeInfo.startTime.originalTime}
                          </div>
                        {/if}
                      </div>
                      <div class="time-divider"></div>
                      <div class="time-slot relative group {timeInfo.endTime.isCustom ? 'custom' : ''}">
                        {timeInfo.endTime.time}
                        {#if timeInfo.endTime.isCustom}
                          <div class="tooltip">
                            Изменено с {timeInfo.endTime.originalTime}
                          </div>
                        {/if}
                      </div>
                    </div>

                    <div class="flex-grow">
                      <p class="font-bold text-white">{lesson.lessonName}</p>
                      <p class="text-sm {lessonTypes[lesson.type as keyof typeof lessonTypes]?.class || 'text-slate-400'}">
                        {lessonTypes[lesson.type as keyof typeof lessonTypes]?.text || 'Занятие'}
                        {#if timeInfo.duration > 1}
                          <span class="text-sm {lessonTypes[lesson.type as keyof typeof lessonTypes]?.class || 'text-slate-400'}"> на {timeInfo.duration} пары</span>
                        {/if}
                      </p>
                      {#if lesson.teacherName}
                        <p class="text-sm text-slate-400">
                          <a href="/yspu/raspprep?teacher={encodeURIComponent(lesson.teacherName)}" 
                             class="hover:text-blue-400 transition-all">
                            {lesson.teacherName}
                          </a>
                        </p>
                      {/if}
                      {#if lesson.auditoryName}
                        <p class="text-sm text-slate-400">
                          <a href="/yspu/raspaudience?audience={encodeURIComponent(lesson.auditoryName)}" 
                             class="hover:text-blue-400 transition-all">
                            Аудитория: {lesson.auditoryName}
                          </a>
                        </p>
                      {/if}
                      {#if lesson.startDate || lesson.endDate}
                        <p class="text-sm text-slate-400">
                          {#if lesson.startDate && lesson.endDate}
                            с {lesson.startDate} по {lesson.endDate}
                          {:else if lesson.startDate}
                            с {lesson.startDate}
                          {:else if lesson.endDate}
                            по {lesson.endDate}
                          {/if}
                        </p>
                      {/if}
                      {#if lesson.isDistant}
                        <p class="text-sm text-red-400">Дистанционно</p>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  </main>

  <Footer />
  <NotificationsContainer />
</PageLayout>

{#if isLoading}
  <LoadingOverlay />
{/if}

<style>
  .time-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: space-between;
    padding-right: 0.5rem;
    margin-left: -0.5rem;
    margin-right: 0.5rem;
    min-width: 4rem;
  }

  .time-slot {
    position: relative;
    padding: 0.25rem;
    border-radius: 0.375rem;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.3s ease;
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(4px);
  }

  .time-slot.custom {
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(30, 41, 59, 0.5) 100%);
    border: 1px solid rgba(37, 99, 235, 0.3);
    animation: customTimePulse 2s infinite;
  }

  @keyframes customTimePulse {
    0% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
  }

  .time-divider {
    position: absolute;
    left: 0;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 1px;
    background: rgba(148, 163, 184, 0.2);
    z-index: -1;
  }

  .tooltip {
    position: absolute;
    top: -2rem;
    left: 50%;
    transform: translateX(-50%) scale(0.95);
    background: rgba(30, 41, 59, 0.95);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    color: #fff;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 10;
    border: 1px solid rgba(37, 99, 235, 0.3);
  }

  .time-slot:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) scale(1);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .group:hover .tooltip {
    animation: fadeIn 0.2s ease forwards;
  }
</style> 