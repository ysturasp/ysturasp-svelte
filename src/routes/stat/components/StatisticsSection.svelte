<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import type { Stats, Instructors, InstituteId, NotificationOptions } from '../types';
	import {
		getSubjectStats,
		getInstructors,
		checkViewLimit,
		registerView,
		getDisciplines
	} from '../utils/api';
	import StatisticsChart from './StatisticsChart.svelte';
	import { recentlyViewedStore } from '../stores/recentlyViewedStore';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import { notifications } from '$lib/stores/notifications';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import { auth } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { loadPrivacySettings, maskEmail, maskName } from '$lib/utils/privacy';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import CopyLinkButton from '$lib/components/ui/CopyLinkButton.svelte';

	export const institutes = [
		{ value: 'btn-digital-systems', label: 'Институт цифровых систем' },
		{ value: 'btn-architecture-design', label: 'Институт архитектуры и дизайна' },
		{ value: 'btn-civil-transport', label: 'Институт инженеров строительства и транспорта' },
		{ value: 'btn-chemistry', label: 'Институт химии и химической технологии' },
		{ value: 'btn-economics-management', label: 'Институт экономики и менеджмента' },
		{ value: 'btn-engineering-machinery', label: 'Институт инженерии и машиностроения' }
	];

	const dispatch = createEventDispatcher<{
		showNotification: NotificationOptions;
		loading: { value: boolean };
		showReferral: void;
		instituteChange: InstituteId;
	}>();

	let selectedInstitute: InstituteId = 'btn-digital-systems';
	let currentDisciplines: string[] = [];
	let selectedDiscipline = '';
	let displayedDiscipline = '';
	let statistics: Stats | null = null;
	let instructors: Instructors | null = null;
	let remainingViews = 0;
	let statisticsSection: HTMLElement;
	let error = false;
	let privacySettings = loadPrivacySettings();
	let isLoadingDisciplines = false;
	let isFetchingStatistics = false;

	$: displayName = privacySettings.hideName
		? maskName($auth.user?.name || null)
		: $auth.user?.name || $auth.user?.email || '';

	$: displayEmail = privacySettings.hideEmail
		? maskEmail($auth.user?.email || '')
		: $auth.user?.email;

	$: showAvatar = !privacySettings.hideAvatar;

	function handleLogin() {
		auth.login();
	}

	function handleProfileClick() {
		goto('/profile');
	}

	function transliterateName(name: string): string {
		const translitMap: { [key: string]: string } = {
			а: 'a',
			б: 'b',
			в: 'v',
			г: 'g',
			д: 'd',
			е: 'e',
			ё: 'e',
			ж: 'zh',
			з: 'z',
			и: 'i',
			й: 'y',
			к: 'k',
			л: 'l',
			м: 'm',
			н: 'n',
			о: 'o',
			п: 'p',
			р: 'r',
			с: 's',
			т: 't',
			у: 'u',
			ф: 'f',
			х: 'h',
			ц: 'ts',
			ч: 'ch',
			ш: 'sh',
			щ: 'sch',
			ъ: '',
			ы: 'y',
			ь: '',
			э: 'e',
			ю: 'yu',
			я: 'ya'
		};

		const cleanName = name
			.replace(/^(проф\.|доц\.|ст\.преп\.|ассист\.|преп\.?)\s*/i, '')
			.trim();

		return (
			cleanName
				.toLowerCase()
				.split('')
				.map((char) => translitMap[char] || char)
				.join('')
				.replace(/[^a-z0-9]/g, '') + '@edu.ystu.ru'
		);
	}

	async function loadDisciplines(institute: InstituteId, preserveSelection = false) {
		isLoadingDisciplines = true;
		try {
			currentDisciplines = await getDisciplines(institute);
			if (!preserveSelection) {
				selectedDiscipline = '';
			}
		} catch (error) {
			console.error('Ошибка при загрузке дисциплин:', error);
			notifications.add('Ошибка при загрузке списка дисциплин', 'error');
			currentDisciplines = [];
		} finally {
			isLoadingDisciplines = false;
		}
	}

	async function handleInstituteChange(institute: InstituteId) {
		selectedInstitute = institute;
		await loadDisciplines(institute, false);
		dispatch('instituteChange', institute);
	}

	async function handleGetStatistics() {
		if (!selectedDiscipline) {
			error = true;
			notifications.add('Пожалуйста, выберите дисциплину', 'error');
			return;
		}

		if (isFetchingStatistics) {
			return;
		}

		if (statistics && displayedDiscipline === selectedDiscipline && !error) {
			return;
		}

		error = false;
		await getStatistics();
	}

	async function getStatistics() {
		if (!$auth.authenticated) {
			notifications.add('Для просмотра статистики необходимо авторизоваться', 'warning');
			dispatch('loading', { value: false });
			return;
		}

		if (!selectedDiscipline) {
			notifications.add('Пожалуйста, выберите дисциплину', 'error');
			return;
		}

		if (isFetchingStatistics) {
			return;
		}

		isFetchingStatistics = true;
		dispatch('loading', { value: true });

		try {
			const cacheKey = `${selectedInstitute}_${selectedDiscipline}_stats`;
			localStorage.removeItem(cacheKey);

			const statsPromise = getSubjectStats(selectedInstitute, selectedDiscipline);
			const instructorsPromise = getInstructors(selectedInstitute, selectedDiscipline);

			const [statsData, instructorsData] = await Promise.all([
				statsPromise.catch((error) => {
					console.error('Error fetching stats:', error);
					throw error;
				}),
				instructorsPromise.catch((error) => {
					console.error('Error fetching instructors:', error);
					throw error;
				})
			]);

			if (!statsData || !instructorsData) {
				throw new Error('Failed to fetch data');
			}

			const viewResult = await registerView(selectedDiscipline, selectedInstitute);
			if (!viewResult.success) {
				dispatch('showNotification', {
					message:
						'Достигнут месячный лимит просмотров. Пригласите друзей, чтобы увеличить лимит!',
					type: 'warning'
				});
				dispatch('showReferral');
				dispatch('loading', { value: false });
				return;
			}

			statistics = statsData;
			instructors = instructorsData;
			displayedDiscipline = selectedDiscipline;
			remainingViews = viewResult.remaining;

			const newItem = {
				discipline: selectedDiscipline,
				institute: selectedInstitute,
				stats: statsData
			};

			recentlyViewedStore.addItem(newItem);
		} catch (error) {
			console.error('Error in getStatistics:', error);
			dispatch('showNotification', {
				message: 'Ошибка при получении данных',
				type: 'error'
			});
			statistics = null;
			instructors = null;
		} finally {
			isFetchingStatistics = false;
			setTimeout(() => {
				dispatch('loading', { value: false });
			}, 0);
		}
	}

	function scrollToStats() {
		if (statisticsSection) {
			const offset = 100;
			const elementPosition =
				statisticsSection.getBoundingClientRect().top + window.pageYOffset;
			window.scrollTo({
				top: elementPosition - offset,
				behavior: 'smooth'
			});
		}
	}

	export function viewSubject(subject: string) {
		selectedDiscipline = subject;
		getStatistics().then(() => {
			scrollToStats();
		});
	}

	onMount(() => {
		auth.checkAuth();

		const urlParams = $page.url.searchParams;
		const instituteParam = urlParams.get('institute') as InstituteId;
		const disciplineParam = urlParams.get('discipline');

		if (instituteParam && institutes.some((i) => i.value === instituteParam)) {
			selectedInstitute = instituteParam;
		}

		if (disciplineParam) {
			selectedDiscipline = disciplineParam;
		}

		const unsubscribe = auth.subscribe((state) => {
			if (!state.loading && state.authenticated) {
				loadDisciplines(selectedInstitute, true).then(() => {
					if (selectedDiscipline && currentDisciplines.includes(selectedDiscipline)) {
						getStatistics();
					} else if (disciplineParam && currentDisciplines.includes(disciplineParam)) {
						getStatistics();
					}
				});
				unsubscribe();
			} else if (!state.loading && !state.authenticated) {
				loadDisciplines(selectedInstitute, true);
				unsubscribe();
			}
		});

		let cleanup = () => {
			unsubscribe();
		};

		if (browser) {
			const updatePrivacy = () => {
				privacySettings = loadPrivacySettings();
			};
			window.addEventListener('storage', updatePrivacy);
			const interval = setInterval(updatePrivacy, 500);

			cleanup = () => {
				window.removeEventListener('storage', updatePrivacy);
				clearInterval(interval);
			};
		}

		return cleanup;
	});

	$: if (!$auth.loading && $auth.authenticated) {
		checkViewLimit(true)
			.then((response) => {
				if (response.success) {
					remainingViews = response.remaining;
				} else {
					remainingViews = 0;
				}
			})
			.catch((error) => {
				console.error('Error updating remaining views:', error);
				remainingViews = 0;
			});
	}
</script>

<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<div class="mb-4 border-b border-slate-700 pb-4">
		<div class="flex items-center justify-center md:justify-start">
			<h2 class="text-4xl font-semibold text-white">👨‍💻</h2>
			<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">Статистика оценок</h2>
		</div>
		<p class="mt-2 text-center text-slate-400 md:text-left">
			Узнайте статистику оценок предметов ЯГТУ, средние баллы и расписание
		</p>
	</div>

	<div class="rounded-xl bg-slate-700/30 p-4 md:p-5">
		{#if $auth.authenticated}
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div
					class="flex flex-col items-center gap-3 rounded-lg bg-slate-700/50 p-3 md:flex-row md:gap-6 md:bg-transparent md:p-0 md:ring-0"
				>
					<div class="text-center md:text-right">
						<span class="block text-xs tracking-wider text-slate-400 uppercase"
							>Доступно</span
						>
						<span class="text-xl font-bold text-white"
							>{remainingViews}
							<span class="text-sm font-normal text-slate-400">запросов</span></span
						>
					</div>
					<div class="hidden h-8 w-px bg-slate-600 md:block"></div>
					<button
						on:click={() => dispatch('showReferral')}
						class="w-full rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-blue-500 md:w-auto"
					>
						Реферальная программа
					</button>
				</div>

				<div class="flex flex-col items-center gap-3 md:flex-row md:justify-start">
					{#if $auth.loading}
						<div class="flex items-center gap-2">
							<div
								class="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
							></div>
						</div>
					{:else if $auth.authenticated && $auth.user}
						<button
							on:click={handleProfileClick}
							class="flex items-center gap-3 rounded-lg bg-slate-700/50 px-3 py-2 text-white transition-colors hover:bg-slate-600"
						>
							{#if showAvatar && $auth.user.picture}
								<img
									src={$auth.user.picture}
									alt={displayName}
									class="h-8 w-8 rounded-full"
								/>
							{:else}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-600 text-slate-400"
								>
									<svg
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
										/>
									</svg>
								</div>
							{/if}
							<div class="flex flex-col items-start">
								<span class="text-sm font-medium">{displayName}</span>
								<span class="text-xs text-slate-400">Личный кабинет</span>
							</div>
							<svg
								class="h-4 w-4 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div
					class="flex flex-col items-center gap-3 rounded-lg bg-slate-700/50 p-3 md:flex-row md:gap-6 md:bg-transparent md:p-0 md:ring-0"
				>
					<div class="text-center md:text-right">
						<span class="block text-xs tracking-wider text-slate-400 uppercase"
							>Доступно</span
						>
						<span class="text-xl font-bold text-white"
							>0
							<span class="text-sm font-normal text-slate-400">запросов</span></span
						>
					</div>
					<div class="hidden h-8 w-px bg-slate-600 md:block"></div>
				</div>

				<div class="flex flex-col items-center gap-3 md:flex-row md:justify-start">
					<button
						on:click={handleLogin}
						class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								fill="#4285F4"
							/>
							<path
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								fill="#34A853"
							/>
							<path
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								fill="#FBBC05"
							/>
							<path
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								fill="#EA4335"
							/>
						</svg>
						Войти через Google
					</button>
				</div>
			</div>
		{/if}
	</div>

	<div class="form-group">
		<div class="flex items-center justify-center">
			<div
				class="warning-block relative mt-4 mb-4 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-indigo-800 p-4 leading-none text-indigo-100"
			>
				<div
					class="emoji-bg pointer-events-none absolute inset-0 select-none"
					aria-hidden="true"
				>
					<span class="emoji" style="top:10%;left:5%;font-size:2.5rem;opacity:0.18;"
						>⚠️</span
					>
					<span class="emoji" style="top:20%;left:60%;font-size:3.2rem;opacity:0.13;"
						>⚠️</span
					>
					<span class="emoji" style="top:60%;left:20%;font-size:2.8rem;opacity:0.15;"
						>⚠️</span
					>
					<span class="emoji" style="top:70%;left:70%;font-size:2.2rem;opacity:0.12;"
						>⚠️</span
					>
					<span class="emoji" style="top:40%;left:40%;font-size:4rem;opacity:0.09;"
						>⚠️</span
					>
					<span class="emoji" style="top:80%;left:10%;font-size:2.1rem;opacity:0.14;"
						>⚠️</span
					>
					<span class="emoji" style="top:15%;left:80%;font-size:2.7rem;opacity:0.11;"
						>⚠️</span
					>
					<span class="emoji" style="top:50%;left:80%;font-size:2.3rem;opacity:0.13;"
						>⚠️</span
					>
					<span class="emoji" style="top:85%;left:55%;font-size:2.6rem;opacity:0.10;"
						>⚠️</span
					>
				</div>
				<div class="relative z-10 flex items-center justify-center">
					<p class="relative z-10 text-center font-medium text-slate-300">
						Не полагайтесь стопроцентно на эти данные.<br />
						Большая часть в получении желаемой оценки всё же зависит только от ВАС
					</p>
				</div>
			</div>
		</div>

		<span class="mb-2 block text-sm font-medium text-slate-400">Выберите институт:</span>
		<div class="institute-buttons mb-3">
			<CustomSelect
				items={institutes.map((institute) => ({
					id: institute.value,
					label: institute.label
				}))}
				bind:selectedId={selectedInstitute}
				on:select={(e) => handleInstituteChange(e.detail.id)}
				placeholder="Выберите институт..."
				width="100%"
				searchPlaceholder="Поиск института..."
				searchable={true}
				highlight={false}
				error={false}
				isLoading={false}
			/>
		</div>

		<label for="discipline-input" class="mb-2 block text-sm font-medium text-slate-400">
			Выберите дисциплину:
		</label>

		{#if isLoadingDisciplines}
			<div class="mb-4 flex items-center justify-center rounded-lg bg-slate-700/50 p-4">
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"
				></div>
				<span class="ml-2 text-sm text-slate-400">Загрузка дисциплин...</span>
			</div>
		{:else if currentDisciplines.length === 0}
			<div class="mb-4 rounded-lg bg-yellow-900/50 p-4">
				<p class="text-sm text-yellow-400">
					Дисциплины не найдены для выбранного института
				</p>
			</div>
		{/if}

		<div class="flex flex-col gap-4">
			<CustomSelect
				items={currentDisciplines.map((d) => ({ id: d, label: d }))}
				bind:selectedId={selectedDiscipline}
				placeholder={isLoadingDisciplines ? 'Загрузка...' : 'Выберите дисциплину...'}
				searchPlaceholder="Поиск дисциплины..."
				width="100%"
				isLoading={isLoadingDisciplines}
				searchable={true}
			/>
			<div class="flex gap-2">
				<button
					class="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:shadow-blue-900/40 active:scale-[0.98] disabled:opacity-50"
					on:click={handleGetStatistics}
					disabled={!selectedDiscipline ||
						isLoadingDisciplines ||
						isFetchingStatistics ||
						(statistics && displayedDiscipline === selectedDiscipline && !error)}
				>
					Показать статистику
				</button>
				<CopyLinkButton
					className="w-12 h-auto !rounded-xl bg-slate-700/50 hover:bg-slate-700 text-blue-400"
					params={{ institute: selectedInstitute, discipline: selectedDiscipline }}
					disabled={!selectedDiscipline}
					iconOnly={true}
				/>
			</div>
		</div>
	</div>

	{#if statistics}
		<div class="result mt-4" bind:this={statisticsSection}>
			<div class="flex flex-col gap-2 text-slate-200">
				<div class="flex flex-col md:flex-row md:items-baseline md:justify-between">
					<div>
						<h1 class="mb-2 text-3xl font-bold tracking-tight text-white">
							{displayedDiscipline}
						</h1>
						{#if statistics.totalCount < 25}
							<div
								class="inline-flex items-center gap-1.5 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-500/80 uppercase"
							>
								⚠️ Мало данных
							</div>
						{/if}
					</div>

					<div class="flex items-baseline gap-8">
						<div>
							<div
								class="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
							>
								Ср. балл
							</div>
							<div
								class="text-4xl font-bold {statistics.average >= 4
									? 'text-emerald-400'
									: 'text-rose-400'} leading-none"
							>
								{statistics.average.toFixed(2)}
							</div>
						</div>
						<div>
							<div
								class="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
							>
								Всего
							</div>
							<div class="text-4xl leading-none font-bold text-white">
								{statistics.totalCount}
							</div>
						</div>
						{#if statistics.inDiplomaCount > 0}
							<div>
								<div
									class="mb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
								>
									В дипломе
								</div>
								<div class="text-4xl leading-none font-bold text-slate-400">
									{statistics.inDiplomaCount}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="flex flex-col">
					<div class="mb-1 flex items-end justify-between text-xs">
						<span class="font-bold tracking-wider text-slate-500 uppercase"
							>Распределение оценок</span
						>
					</div>

					<div
						class="flex h-10 w-full overflow-hidden rounded-lg bg-slate-800/50 ring-1 ring-white/10"
					>
						{#if statistics.totalCount > 0}
							{#if statistics.count2 > 0}
								<div
									class="group relative h-full border-r border-slate-900/50 bg-rose-500/80 transition-colors hover:bg-rose-500"
									style="width: {(
										(statistics.count2 / statistics.totalCount) *
										100
									).toFixed(2)}%"
								>
									<div
										class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100"
									>
										2
									</div>
								</div>
							{/if}
							{#if statistics.count3 > 0}
								<div
									class="group relative h-full border-r border-slate-900/50 bg-amber-500/80 transition-colors hover:bg-amber-500"
									style="width: {(
										(statistics.count3 / statistics.totalCount) *
										100
									).toFixed(2)}%"
								>
									<div
										class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100"
									>
										3
									</div>
								</div>
							{/if}
							{#if statistics.count4 > 0}
								<div
									class="group relative h-full border-r border-slate-900/50 bg-blue-500/80 transition-colors hover:bg-blue-500"
									style="width: {(
										(statistics.count4 / statistics.totalCount) *
										100
									).toFixed(2)}%"
								>
									<div
										class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100"
									>
										4
									</div>
								</div>
							{/if}
							{#if statistics.count5 > 0}
								<div
									class="group relative h-full bg-emerald-500/80 transition-colors hover:bg-emerald-500"
									style="width: {(
										(statistics.count5 / statistics.totalCount) *
										100
									).toFixed(2)}%"
								>
									<div
										class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100"
									>
										5
									</div>
								</div>
							{/if}
						{:else}
							<div class="h-full w-full bg-slate-800/50"></div>
						{/if}
					</div>

					<div
						class="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-400"
					>
						{#if statistics.count2 > 0}<span class="flex items-center gap-1.5"
								><div class="h-2 w-2 rounded-full bg-rose-500"></div>
								Неудовлетворительно:<b class="text-white">{statistics.count2}</b
								></span
							>{/if}
						{#if statistics.count3 > 0}<span class="flex items-center gap-1.5"
								><div class="h-2 w-2 rounded-full bg-amber-500"></div>
								Удовлетворительно:<b class="text-white">{statistics.count3}</b
								></span
							>{/if}
						{#if statistics.count4 > 0}<span class="flex items-center gap-1.5"
								><div class="h-2 w-2 rounded-full bg-blue-500"></div>
								Хорошо:<b class="text-white">{statistics.count4}</b></span
							>{/if}
						{#if statistics.count5 > 0}<span class="flex items-center gap-1.5"
								><div class="h-2 w-2 rounded-full bg-emerald-500"></div>
								Отлично:<b class="text-white">{statistics.count5}</b></span
							>{/if}
					</div>
				</div>

				<StatisticsChart stats={statistics} />

				<div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-8">
					{#if statistics.byControlType.length > 0}
						<div class="flex flex-col gap-3">
							<h4
								class="border-b border-white/10 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
							>
								По типам контроля
							</h4>
							<div class="flex flex-col gap-2">
								{#each statistics.byControlType as stat}
									<div class="group flex items-baseline justify-between text-sm">
										<span
											class="text-slate-300 transition-colors group-hover:text-white"
											>{stat.controlType}</span
										>
										<div class="flex items-baseline gap-3">
											<span class="font-mono text-xs text-slate-600"
												>x{stat.count}</span
											>
											<span
												class="w-8 text-right font-mono font-bold text-white"
												>{stat.average.toFixed(2)}</span
											>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if statistics.byCourse.length > 0}
						<div class="flex flex-col gap-3">
							<h4
								class="border-b border-white/10 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
							>
								По курсам
							</h4>
							<div class="flex flex-col gap-2">
								{#each statistics.byCourse as stat}
									<div class="group flex items-baseline justify-between text-sm">
										<span
											class="text-slate-300 transition-colors group-hover:text-white"
											>{stat.course} курс</span
										>
										<div class="flex items-baseline gap-3">
											<span class="font-mono text-xs text-slate-600"
												>x{stat.count}</span
											>
											<span
												class="w-8 text-right font-mono font-bold text-white"
												>{stat.average.toFixed(2)}</span
											>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#if statistics.bySemester.length > 0}
						<div class="flex flex-col gap-3">
							<h4
								class="border-b border-white/10 pb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase"
							>
								По семестрам
							</h4>
							<div class="flex flex-col gap-2">
								{#each statistics.bySemester as stat}
									<div class="group flex items-baseline justify-between text-sm">
										<span
											class="text-slate-300 transition-colors group-hover:text-white"
											>{stat.semester} семестр</span
										>
										<div class="flex items-baseline gap-3">
											<span class="font-mono text-xs text-slate-600"
												>x{stat.count}</span
											>
											<span
												class="w-8 text-right font-mono font-bold text-white"
												>{stat.average.toFixed(2)}</span
											>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				{#if statistics.topGroups.length > 0}
					<div class="flex flex-col gap-4">
						<h4 class="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
							Топ групп по успеваемости
						</h4>
						<div
							class="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
						>
							{#each statistics.topGroups as group, i}
								<div class="group flex items-baseline justify-between text-sm">
									<div class="flex min-w-0 items-baseline gap-2 overflow-hidden">
										<span
											class="w-4 font-mono text-[10px] text-slate-600 transition-colors group-hover:text-slate-400"
											>#{i + 1}</span
										>
										<span
											class="truncate font-medium text-slate-300 transition-colors group-hover:text-white"
											>{group.groupName}</span
										>
									</div>
									<span
										class="font-mono text-xs font-bold {i < 3
											? 'text-emerald-400'
											: 'text-slate-500'} ml-2"
										>{group.average.toFixed(2)}</span
									>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>

<NotificationsContainer />

<style>
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
