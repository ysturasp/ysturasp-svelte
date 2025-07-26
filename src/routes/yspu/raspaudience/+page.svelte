<script lang="ts">
	import { onMount } from 'svelte';
	import { getAudiences, getSchedule } from './api';
	import type { AudienceScheduleData } from '$lib/types/schedule';
	import type { Audience } from './api';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import AudienceScheduleForm from './components/AudienceScheduleForm.svelte';
	import AudienceScheduleDay from './components/AudienceScheduleDay.svelte';
	import ScheduleTitle from '$lib/components/schedule/ScheduleTitle.svelte';
	import { notifications } from '$lib/stores/notifications';
	import GithubParserInfo from '../rasp/components/GithubParserInfo.svelte';

	let isLoading = false;
	let isScheduleLoading = false;
	let audiences: Audience[] = [];
	let selectedAudience = '';
	let scheduleData: AudienceScheduleData | null = null;

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
			isLoading = true;
			audiences = await getAudiences();

			const urlParams = new URLSearchParams(window.location.search);
			const audienceFromURL = urlParams.get('audience');
			if (audienceFromURL) {
				selectedAudience = audienceFromURL;
				await loadSchedule();
			} else {
				const lastAudience = localStorage.getItem('lastAudience');
				if (lastAudience) {
					selectedAudience = lastAudience;
					await loadSchedule();
				}
			}
		} catch (error) {
			console.error('Error loading audiences:', error);
			notifications.add('Ошибка при загрузке списка аудиторий', 'error');
		} finally {
			isLoading = false;
		}
	});

	async function loadSchedule() {
		try {
			isScheduleLoading = true;
			scheduleData = await getSchedule(selectedAudience);
			localStorage.setItem('lastAudience', selectedAudience);
		} catch (error) {
			if (error instanceof Response && error.status === 429) {
				notifications.add('Превышено количество запросов. Попробуйте позже.', 'error');
				return;
			}
			console.error('Error loading schedule:', error);
			notifications.add('Ошибка при загрузке расписания', 'error');
		} finally {
			isScheduleLoading = false;
		}
	}

	function getDisplayAudience(id: string): string {
		const audience = audiences.find((a) => a.id === id);
		return audience ? audience.number : id;
	}
</script>

<svelte:head>
	<title>Расписание аудиторий ЯГПУ | ystuRASP</title>
	<meta
		name="description"
		content="Актуальное расписание занятий в аудиториях ЯГПУ. Удобный поиск расписания по аудиториям, просмотр занятий"
	/>
	<meta
		name="keywords"
		content="расписание аудиторий ЯГПУ, ЯГПУ аудитории расписание, поиск аудиторий ЯГПУ, расписание занятий в аудиториях"
	/>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="mb-4 rounded-2xl bg-amber-500 p-4 text-center text-black">
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-3xl font-semibold text-white">🏛️</h2>
				<h2 class="text-md ml-2 font-semibold text-white md:text-4xl">
					Расписание аудиторий
				</h2>
				<span
					class="mb-6 ml-2 flex rounded-full bg-indigo-500 px-2 py-1 text-xs font-bold uppercase"
					>Beta</span
				>
			</div>

			<AudienceScheduleForm
				{audiences}
				bind:selectedAudience
				onSubmit={loadSchedule}
				{isLoading}
			/>

			{#if scheduleData}
				<div class="mt-2">
					{#if scheduleData.items.length > 0}
						<ScheduleTitle
							type="audience"
							title={getDisplayAudience(selectedAudience)}
						/>

						{#each days as day, dayIndex}
							{@const dayLessons = scheduleData.items[0].days
								.filter((d) => d.info.type === dayIndex)
								.flatMap((d) => d.lessons)}
							{#if dayLessons.length > 0}
								<AudienceScheduleDay dayName={day} lessons={dayLessons} />
							{/if}
						{/each}
					{:else}
						<div class="p-4 text-center text-xl text-white">
							В аудитории нет занятий
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<GithubParserInfo />
	</main>

	<Footer />
	<NotificationsContainer />
</PageLayout>

{#if isScheduleLoading}
	<LoadingOverlay />
{/if}
