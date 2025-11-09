<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		disciplinesDigitalSystems,
		disciplinesAiD,
		disciplinesCivilTransport,
		disciplinesChemistry,
		disciplinesEconomicsManagement,
		disciplinesEngineeringMachinery
	} from '../data/disciplines';
	import type { Stats, Instructors, InstituteId, NotificationOptions } from '../types';
	import { getSubjectStats, getInstructors, checkViewLimit } from '../utils/api';
	import StatisticsChart from './StatisticsChart.svelte';
	import { recentlyViewedStore } from '../stores/recentlyViewedStore';
	import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import { notifications } from '$lib/stores/notifications';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

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
	let currentDisciplines: string[] = disciplinesDigitalSystems;
	let selectedDiscipline = '';
	let displayedDiscipline = '';
	let statistics: Stats | null = null;
	let instructors: Instructors | null = null;
	let remainingViews = '...';
	let statisticsSection: HTMLElement;
	let error = false;

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

	$: items = currentDisciplines.map((discipline) => ({
		id: discipline,
		displayValue: discipline
	}));

	$: if (selectedDiscipline) {
		getStatistics();
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
			case 'btn-chemistry':
				currentDisciplines = disciplinesChemistry;
				break;
			case 'btn-economics-management':
				currentDisciplines = disciplinesEconomicsManagement;
				break;
			case 'btn-engineering-machinery':
				currentDisciplines = disciplinesEngineeringMachinery;
				break;
		}
		dispatch('instituteChange', institute);
	}

	async function handleGetStatistics() {
		if (!selectedDiscipline) {
			error = true;
			notifications.add('Пожалуйста, выберите дисциплину', 'error');
			return;
		}
		error = false;
		await getStatistics();
	}

	async function getStatistics() {
		if (!selectedDiscipline) {
			notifications.add('Пожалуйста, выберите дисциплину', 'error');
			return;
		}

		dispatch('loading', { value: true });

		try {
			const cacheKey = `${selectedInstitute}_${selectedDiscipline}_stats`;
			const cachedData = localStorage.getItem(cacheKey);

			if (cachedData) {
				const { stats, instructorsData, timestamp } = JSON.parse(cachedData);
				if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
					statistics = stats;
					instructors = instructorsData;
					displayedDiscipline = selectedDiscipline;
					dispatch('loading', { value: false });
					return;
				}
			}

			const limitCheck = await checkViewLimit(false);
			if (!limitCheck.success) {
				dispatch('showNotification', {
					message:
						'Достигнут дневной лимит просмотров. Пригласите друзей, чтобы увеличить лимит!',
					type: 'warning'
				});
				dispatch('showReferral');
				return;
			}

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

			localStorage.setItem(
				cacheKey,
				JSON.stringify({
					stats: statsData,
					instructorsData: instructorsData,
					timestamp: Date.now()
				})
			);

			statistics = statsData;
			instructors = instructorsData;
			displayedDiscipline = selectedDiscipline;

			const newItem = {
				discipline: selectedDiscipline,
				institute: selectedInstitute,
				stats: statsData
			};

			recentlyViewedStore.addItem(newItem);

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
		checkViewLimit(true)
			.then((response) => {
				if (response.success) {
					remainingViews = response.remaining.toString();
				} else {
					remainingViews = '0';
				}
			})
			.catch((error) => {
				console.error('Error updating remaining views:', error);
				remainingViews = '0';
			});
	});
</script>

<section class="mt-8 rounded-2xl bg-slate-800 p-4 md:p-6">
	<div class="-mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
		<div class="mb-0 flex items-center">
			<h2 class="text-2xl font-semibold text-white md:text-4xl">👨‍💻 Статистика оценок</h2>
			<span
				class="mb-6 ml-2 flex rounded-full bg-indigo-500 px-2 py-1 text-xs font-bold uppercase"
				>Beta</span
			>
		</div>
		<div class="flex items-center justify-center">
			<span class="mr-2 text-slate-300">Доступно запросов:</span>
			<span class="text-xl font-bold text-white">{remainingViews}</span>
			<button
				class="ml-2 rounded-2xl bg-blue-600 p-2 text-white transition-all hover:bg-blue-700"
				on:click={() => dispatch('showReferral')}
				aria-label="Открыть модальное окно с реферальной программой"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					viewBox="0 0 20 20"
					fill="currentColor"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
						clip-rule="evenodd"
					/>
				</svg>
			</button>
		</div>
	</div>

	<div class="form-group">
		<p class="mt-2 text-slate-300">
			На данный момент поддерживается статистика предметов ИЦС, ИАиД, ИИСиТ, ИХХТ и ИЭиМ. В
			будующем планируется добавление статистики и для других Институтов
		</p>

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

		<ScheduleCombobox
			{items}
			bind:selectedId={selectedDiscipline}
			onSubmit={handleGetStatistics}
			placeholder="Выберите дисциплину..."
			paramName="discipline"
			copyLinkMessage="Ссылка на статистику скопирована"
			submitButtonText="Показать статистику"
			copyButtonText="Скопировать ссылку на статистику"
			{error}
		/>
	</div>

	{#if statistics}
		<div class="result mt-4" bind:this={statisticsSection}>
			<div class="flex flex-col gap-3">
				<div class="flex flex-col items-start gap-2">
					<h3 class="text-xl font-semibold text-white sm:text-2xl">
						📊 Статистика по предмету
					</h3>
					<div class="w-full rounded-lg bg-slate-900 px-3 py-2">
						<h1 class="text-xl font-medium text-slate-300">{displayedDiscipline}</h1>
					</div>
				</div>

				{#if statistics.count5 + statistics.count4 + statistics.count3 + statistics.count2 < 25}
					<div class="flex items-center gap-2 rounded-lg bg-red-900/50 px-3 py-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-4 w-4 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<p class="text-xs font-medium text-red-400">
							Данных недостаточно, статистика может быть неточна
						</p>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-2">
					<div class="relative overflow-hidden rounded-lg bg-slate-900 p-3">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs font-medium text-slate-400">Средний балл</p>
								<div class="mt-1 flex items-baseline gap-1">
									<h3 class="text-xl font-bold text-white">
										{statistics.average.toFixed(2)}
									</h3>
									<span class="text-lg"
										>{statistics.average >= 4 ? '😍' : '😭'}</span
									>
								</div>
							</div>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-blue-500"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
									/>
								</svg>
							</div>
						</div>
					</div>

					<div class="relative overflow-hidden rounded-lg bg-slate-900 p-3">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-xs font-medium text-slate-400">Всего оценок</p>
								<div class="mt-1 flex items-baseline">
									<h3 class="text-xl font-bold text-white">
										{statistics.count5 +
											statistics.count4 +
											statistics.count3 +
											statistics.count2}
									</h3>
								</div>
							</div>
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4 text-purple-500"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"
									/>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<div class="relative overflow-hidden rounded-lg bg-slate-900 p-3">
						<div class="flex justify-between gap-1 sm:gap-2">
							<div
								class="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2"
							>
								<div
									class="hidden h-8 w-8 items-center justify-center rounded-full bg-red-500/20 sm:flex"
								>
									<span class="text-sm text-red-500">2</span>
								</div>
								<div class="text-center sm:text-left">
									<p class="text-[10px] font-medium text-red-400 sm:text-xs">
										Двоек
									</p>
									<p class="text-base font-bold text-white sm:text-lg">
										{statistics.count2}
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2"
							>
								<div
									class="hidden h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 sm:flex"
								>
									<span class="text-sm text-orange-500">3</span>
								</div>
								<div class="text-center sm:text-left">
									<p class="text-[10px] font-medium text-orange-400 sm:text-xs">
										Троек
									</p>
									<p class="text-base font-bold text-white sm:text-lg">
										{statistics.count3}
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2"
							>
								<div
									class="hidden h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 sm:flex"
								>
									<span class="text-sm text-blue-500">4</span>
								</div>
								<div class="text-center sm:text-left">
									<p class="text-[10px] font-medium text-blue-400 sm:text-xs">
										Четверок
									</p>
									<p class="text-base font-bold text-white sm:text-lg">
										{statistics.count4}
									</p>
								</div>
							</div>

							<div
								class="flex flex-col items-center sm:flex-row sm:items-center sm:gap-2"
							>
								<div
									class="hidden h-8 w-8 items-center justify-center rounded-full bg-green-500/20 sm:flex"
								>
									<span class="text-sm text-green-500">5</span>
								</div>
								<div class="text-center sm:text-left">
									<p class="text-[10px] font-medium text-green-400 sm:text-xs">
										Пятерок
									</p>
									<p class="text-base font-bold text-white sm:text-lg">
										{statistics.count5}
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>

				<StatisticsChart stats={statistics} />
			</div>
		</div>
	{/if}

	{#if instructors}
		<div class="mt-4">
			<div class="flex flex-col gap-2">
				<h3 class="text-lg font-semibold text-white">👨‍🏫 Преподаватели</h3>
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					{#each instructors.teachers[0].split(',') as teacher}
						<div
							class="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2"
						>
							<span class="text-sm font-medium text-slate-300">{teacher.trim()}</span>
							<a
								href="https://teams.microsoft.com/l/chat/0/0?users={transliterateName(
									teacher.trim()
								)}"
								target="_blank"
								class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
							>
								<img
									src="https://1.bp.blogspot.com/-tZ96Uvd516Y/Xc1nRonJtoI/AAAAAAAAJOo/M5DQUKUBjKADfMIzD-0oUrfzn4fZsK1SwCLcBGAsYHQ/s1600/Teams.png"
									alt="Связаться с преподавателем"
									class="h-4 w-4"
								/>
							</a>
						</div>
					{/each}
				</div>
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
