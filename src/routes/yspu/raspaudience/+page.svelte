<script lang="ts">
	import { onMount } from 'svelte';
	import { getAudiences, getSchedule } from './api';
	import { replaceState } from '$app/navigation';
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
	import NavigationLinks from '$lib/components/ui/NavigationLinks.svelte';
	import ScheduleSwitcher from '$lib/components/schedule/ScheduleSwitcher.svelte';
	import { settings } from '$lib/stores/settings';
	import type { Settings } from '$lib/stores/settings';

	let currentSettings: Settings;
	settings.subscribe((value) => {
		currentSettings = value;
	});

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
				const audience = audiences.find((a) => a.id === audienceFromURL);
				if (audience) {
					selectedAudience = audienceFromURL;
					await loadSchedule();
				} else {
					notifications.add('Аудитория не найдена', 'error');
				}
			} else {
				const lastAudience = localStorage.getItem('lastYspuAudience');
				if (lastAudience) {
					const audience = audiences.find((a) => a.id === lastAudience);
					if (audience) {
						selectedAudience = lastAudience;
						await loadSchedule();
					}
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

			const params = new URLSearchParams(window.location.search);
			if (selectedAudience) {
				params.set('audience', selectedAudience);
			} else {
				params.delete('audience');
			}
			replaceState(`${window.location.pathname}?${params}`, {});

			scheduleData = await getSchedule(selectedAudience);
			localStorage.setItem('lastYspuAudience', selectedAudience);
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

	$: audienceInfo = selectedAudience ? audiences.find((a) => a.id === selectedAudience) : null;
	$: audienceName = audienceInfo?.number || selectedAudience;
</script>

<svelte:head>
	<title>
		{selectedAudience
			? `Расписание аудитории ${audienceName} ФСУ ЯГПУ`
			: 'Расписание аудиторий ФСУ ЯГПУ | Поиск по аудиториям'}
	</title>
	<meta
		name="description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${audienceName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий в аудиториях факультета социального управления ЯГПУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий'}
	/>
	<meta
		name="keywords"
		content={`расписание аудиторий ЯГПУ, ${
			selectedAudience ? `расписание ${audienceName}, аудитория ${audienceName}, ` : ''
		}ягпу им ушинского, ФСУ ЯГПУ, факультет социального управления, расписание занятий ЯГПУ, ягпу расписание аудиторий, занятость аудиторий ФСУ, свободные аудитории ФСУ`}
	/>

	<meta
		property="og:title"
		content={selectedAudience
			? `Расписание аудитории ${audienceName} ФСУ ЯГПУ`
			: 'Расписание аудиторий ФСУ ЯГПУ | Поиск по аудиториям'}
	/>
	<meta
		property="og:description"
		content={selectedAudience
			? `Актуальное расписание занятий в аудитории ${audienceName} факультета социального управления ЯГПУ. Полное расписание лекций, практик и семинаров`
			: 'Актуальное расписание занятий в аудиториях факультета социального управления ЯГПУ. Удобный поиск и просмотр расписания по конкретным аудиториям, информация о занятости аудиторий'}
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
	{#if selectedAudience}
		<meta name="robots" content="index, follow" />
		<link
			rel="canonical"
			href={`https://ysturasp.netlify.app/yspu/raspaudience?audience=${encodeURIComponent(selectedAudience)}`}
		/>
	{/if}
</svelte:head>

<PageLayout>
	<Header>
		<NavigationLinks
			slot="links-desktop"
			variant="desktop"
			currentPage="yspu"
			pageType="audience"
		/>
		<NavigationLinks
			slot="links-mobile"
			variant="mobile"
			currentPage="yspu"
			pageType="audience"
		/>
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<div class="mb-2 rounded-2xl bg-amber-500 p-4 text-center text-black">
				<div class="flex items-center justify-center gap-2">
					<div
						class="mr-1 h-3 w-3 animate-pulse rounded-full ring-8"
						style="background-color: rgb(82, 255, 2); --tw-ring-color: #51ff003c;"
					></div>
					<p class="mb-1 font-semibold">Расписание актуально</p>
				</div>
			</div>

			<div class="mb-4 flex items-center">
				<h2 class="text-4xl font-semibold text-white">🏛️</h2>
				<h2 class="ml-2 text-2xl font-semibold text-white md:text-4xl">
					Расписание аудиторий
				</h2>
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

		{#if currentSettings.showAPILink}
			<GithubParserInfo />
		{/if}
	</main>

	<Footer class_name="pb-28 md:pb-18" />
	<NotificationsContainer />
</PageLayout>

<ScheduleSwitcher
	selectedSemester={null}
	onSemesterChange={() => {}}
	currentPage="audiences"
	university="yspu"
/>

{#if isScheduleLoading}
	<LoadingOverlay />
{/if}
