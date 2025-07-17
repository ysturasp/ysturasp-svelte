<script lang="ts">
    import { onMount } from 'svelte';
    import { getDirections, getSchedule } from './api';
    import type { Direction, ScheduleData, Lesson, Course, ScheduleItem } from '$lib/types/schedule';
    import LoadingOverlay from './components/LoadingOverlay.svelte';
    import PageLayout from '$lib/components/layout/PageLayout.svelte';
    import Header from '$lib/components/layout/Header.svelte';
    import Footer from '$lib/components/layout/Footer.svelte';
    import ScheduleTitle from './components/ScheduleTitle.svelte';
    import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
    import SelectScheduleForm from '$lib/components/schedule/SelectScheduleForm.svelte';
    import ViewModeToggle from '$lib/components/schedule/ViewModeToggle.svelte';
    import ScheduleDay from '$lib/components/schedule/ScheduleDay.svelte';

    let isLoading = false;
    let directions: Direction[] = [];
    let selectedDirection = '';
    let selectedGroup = '';
    let scheduleData: ScheduleData | null = null;
    let viewMode: 'all' | 'actual' = 'all';
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

    const days = [
        'Понедельник',
        'Вторник',
        'Среда',
        'Четверг',
        'Пятница',
        'Суббота',
        'Воскресенье'
    ];

    onMount(async () => {
        try {
            directions = await getDirections();
            viewMode = storage.get('scheduleViewMode', 'all') as 'all' | 'actual';

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

    function toggleViewMode(mode: 'all' | 'actual') {
        viewMode = mode;
        storage.set('scheduleViewMode', mode);
    }

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

    $: actualGroupNumber = groupNumbersMap[selectedGroup];
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

            <SelectScheduleForm
                {directions}
                bind:selectedDirection
                bind:selectedGroup
                onSubmit={loadSchedule}
                onDirectionChange={handleDirectionChange}
            />

            {#if scheduleData}
                <div class="mt-4">
                    {#if scheduleData.items.length > 0}
                        <ScheduleTitle 
                            groupNumber={actualGroupNumber} 
                            startDate={scheduleData.items[0].courseInfo.startDate} 
                        />
                    {/if}
                    
                    <ViewModeToggle
                        {viewMode}
                        onToggle={toggleViewMode}
                    />

                    {#each days as day, dayIndex}
                        {@const dayLessons = scheduleData.items
                            .filter((item: ScheduleItem) => item.courseInfo.number === actualGroupNumber)
                            .flatMap(item => item.days
                                .filter(d => d.info.type === dayIndex)
                                .flatMap(d => processLessons(d.lessons))
                                .filter(lesson => viewMode === 'all' || isLessonInDate(lesson))
                            )}
                        {#if dayLessons.length > 0}
                            <ScheduleDay
                                dayName={day}
                                lessons={dayLessons}
                            />
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