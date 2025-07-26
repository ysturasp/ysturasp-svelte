<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		disciplinesDigitalSystems,
		disciplinesAiD,
		disciplinesCivilTransport
	} from '../data/disciplines';
	import type { Stats, Instructors, InstituteId, NotificationOptions } from '../types';
	import { getSubjectStats, getInstructors, checkViewLimit } from '../utils/api';
	import StatisticsChart from './StatisticsChart.svelte';
	import { recentlyViewedStore } from '../stores/recentlyViewedStore';
	import ScheduleCombobox from '$lib/components/schedule/ScheduleCombobox.svelte';

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

	$: items = currentDisciplines.map((discipline) => ({
		id: discipline,
		displayValue: discipline
	}));

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
		dispatch('instituteChange', institute);
	}

	async function handleGetStatistics() {
		if (!selectedDiscipline) {
			error = true;
			dispatch('showNotification', {
				message: 'Пожалуйста, выберите дисциплину',
				type: 'error'
			});
			return;
		}
		error = false;
		await getStatistics();
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
			На данный момент поддерживается статистика предметов только ИЦС, ИАиД и ИИСиТ. В
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

		<label class="mb-2 block text-sm font-medium text-slate-400">Выберите институт:</label>
		<div class="institute-buttons mb-3">
			<button
				class="institute-button {selectedInstitute === 'btn-digital-systems'
					? 'active'
					: ''}"
				on:click={() => handleInstituteChange('btn-digital-systems')}
			>
				Институт Цифровых Систем
			</button>
			<button
				class="institute-button {selectedInstitute === 'btn-architecture-design'
					? 'active'
					: ''}"
				on:click={() => handleInstituteChange('btn-architecture-design')}
			>
				Институт Архитектуры и Дизайна
			</button>
			<button
				class="institute-button {selectedInstitute === 'btn-civil-transport'
					? 'active'
					: ''}"
				on:click={() => handleInstituteChange('btn-civil-transport')}
			>
				Институт Инженеров Строительства и Транспорта
			</button>
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
			copyLinkMessage="Ссылка на статистику дисциплины скопирована"
			{error}
		/>
	</div>

	{#if statistics}
		<div class="result mt-4" bind:this={statisticsSection}>
			<div style="text-align: center;">
				<h3 class="mb-4 text-2xl font-bold md:text-3xl">
					Статистика по предмету "{displayedDiscipline}"
				</h3>
			</div>

			{#if statistics.count5 + statistics.count4 + statistics.count3 + statistics.count2 < 25}
				<div class="mb-4 rounded-2xl bg-red-500 p-2 font-bold text-white">
					⚠️⚠️⚠️ Данных недостаточно, статистика может быть неточна ⚠️⚠️⚠️
				</div>
			{/if}

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div class="rounded-2xl p-4 text-center" style="border: 2px solid #1245e67d;">
					<h2 class="mb-2 text-2xl font-bold">
						Средний балл {statistics.average >= 4 ? '😍' : '😭'}
					</h2>
					<p class="text-2xl text-slate-300">{statistics.average.toFixed(2)}</p>
				</div>
				<div class="rounded-2xl p-4 text-center" style="border: 2px solid #1245e67d;">
					<h2 class="mb-2 text-2xl font-bold">Всего оценок проанализировано</h2>
					<p class="text-2xl text-slate-300">
						{statistics.count5 +
							statistics.count4 +
							statistics.count3 +
							statistics.count2}
					</p>
				</div>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
				<div
					class="grade-element cursor-pointer rounded-2xl p-4 text-center"
					style="border: 2px solid #1245e67d;"
				>
					<h3 class="mb-2 text-xl font-bold">Пятерок</h3>
					<p class="text-2xl text-slate-300">{statistics.count5}</p>
				</div>
				<div
					class="grade-element cursor-pointer rounded-2xl p-4 text-center"
					style="border: 2px solid #1245e67d;"
				>
					<h3 class="mb-2 text-xl font-bold">Четверок</h3>
					<p class="text-2xl text-slate-300">{statistics.count4}</p>
				</div>
				<div
					class="grade-element cursor-pointer rounded-2xl p-4 text-center"
					style="border: 2px solid #1245e67d;"
				>
					<h3 class="mb-2 text-xl font-bold">Троек</h3>
					<p class="text-2xl text-slate-300">{statistics.count3}</p>
				</div>
				<div
					class="grade-element cursor-pointer rounded-2xl p-4 text-center"
					style="border: 2px solid #1245e67d;"
				>
					<h3 class="mb-2 text-xl font-bold">Двоек</h3>
					<p class="text-2xl text-slate-300">{statistics.count2}</p>
				</div>
			</div>

			<div class="mt-8">
				<StatisticsChart stats={statistics} />
			</div>
		</div>
	{/if}

	{#if instructors}
		<div class="result mt-4">
			<h3 class="mb-2 text-xl font-bold">
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
		border-radius: 15px;
		font-weight: 500;
		text-align: center;
		border: 1px solid transparent;
		cursor: pointer;
		transition:
			background-color 0.3s,
			box-shadow 0.3s;
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
