<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import StatisticsSection from './components/StatisticsSection.svelte';
	import TopAntiTopSection from './components/TopAntiTopSection.svelte';
	import RecentlyViewedSection from './components/RecentlyViewedSection.svelte';
	import ReferralModal from './components/ReferralModal.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import { onMount } from 'svelte';
	import type { InstituteId } from './types';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { registerReferral } from './utils/api';
	import { get } from 'svelte/store';
	import { auth } from '$lib/stores/auth';

	let showReferralModal = false;
	let isLoading = false;
	let selectedInstitute: InstituteId = 'btn-digital-systems';
	let topAntiTopComponent: TopAntiTopSection;
	let statisticsComponent: StatisticsSection;

	function handleInstituteChange(institute: InstituteId) {
		selectedInstitute = institute;
		if (topAntiTopComponent) {
			topAntiTopComponent.updateData(institute);
		}
	}

	function handleViewAgain(subject: string) {
		if (statisticsComponent) {
			statisticsComponent.viewSubject(subject);
		}
	}

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search);
		const subject = urlParams.get('subject');
		const ref = urlParams.get('ref');

		if (ref) {
			const authState = get(auth);
			if (authState?.user?.id) {
				const result = await registerReferral(ref);
				if (result.success) {
					notifications.add('Реферальная ссылка активирована!', 'success');
				} else if (result.error) {
					notifications.add(result.error, 'warning');
				}
			}

			urlParams.delete('ref');
			const newUrl = urlParams.toString()
				? `${window.location.pathname}?${urlParams.toString()}`
				: window.location.pathname;
			window.history.replaceState({}, '', newUrl);
		}

		if (subject && statisticsComponent) {
			statisticsComponent.viewSubject(subject);
		}
	});
</script>

<svelte:head>
	<title>ysturasp. Оценки по предметам ЯГТУ</title>
	<meta
		name="description"
		content="Узнайте статистику оценок предметов ЯГТУ, средние баллы и расписание 2024. ysturasp"
	/>
	<meta
		name="keywords"
		content="ysturasp, статистика оценок ЯГТУ, средний балл предметов ЯГТУ, анализ успеваемости ЯГТУ, успеваемость по предметам ЯГТУ, ysturasp, баллы по предметам ЯГТУ, оценочная статистика ЯГТУ"
	/>
	<meta property="og:title" content="ysturasp. Оценки по предметам ЯГТУ" />
	<meta
		property="og:description"
		content="Узнайте статистику оценок предметов ЯГТУ, средние баллы и расписание 2024. ysturasp"
	/>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<StatisticsSection
			bind:this={statisticsComponent}
			on:showNotification={({ detail }) => notifications.add(detail.message, detail.type)}
			on:loading={({ detail }) => (isLoading = detail.value)}
			on:showReferral={() => (showReferralModal = true)}
			on:instituteChange={({ detail }) => handleInstituteChange(detail)}
		/>

		<TopAntiTopSection
			bind:this={topAntiTopComponent}
			on:viewAgain={({ detail }) => handleViewAgain(detail.subject)}
		/>

		<RecentlyViewedSection on:viewAgain={({ detail }) => handleViewAgain(detail.subject)} />
	</main>

	<Footer />

	<ReferralModal
		isOpen={showReferralModal}
		on:close={() => (showReferralModal = false)}
		on:showNotification={({ detail }) => notifications.add(detail.message, detail.type)}
	/>

	{#if isLoading}
		<LoadingOverlay />
	{/if}
</PageLayout>

<NotificationsContainer />

<style>
	:global(body) {
		font-family: 'Inter', sans-serif;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	:global(main) {
		flex: 1;
	}

	:global(::selection) {
		background-color: #ffc935;
		color: #000000;
		border-radius: 5px;
		padding: 1.2em;
	}

	:global(img::selection) {
		background-color: transparent;
		color: inherit;
	}

	@keyframes slideIn {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@keyframes slideOut {
		from {
			transform: translateY(0);
			opacity: 1;
		}
		to {
			transform: translateY(100%);
			opacity: 0;
		}
	}
</style>
