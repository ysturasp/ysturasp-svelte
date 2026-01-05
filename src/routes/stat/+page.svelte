<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import StatisticsSection from './components/StatisticsSection.svelte';
	import TopAntiTopSection from './components/TopAntiTopSection.svelte';
	import RecentlyViewedSection from './components/RecentlyViewedSection.svelte';
	import { onMount } from 'svelte';
	import type { InstituteId } from './types';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
	import { notifications } from '$lib/stores/notifications';
	import { registerReferral } from './utils/api';
	import { get } from 'svelte/store';
	import { auth } from '$lib/stores/auth';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';

	let selectedInstitute: InstituteId = 'btn-digital-systems';
	let topAntiTopComponent: TopAntiTopSection;
	let statisticsComponent: StatisticsSection;
	let referralApplied = false;

	function handleInstituteChange(institute: InstituteId) {
		selectedInstitute = institute;
		if (topAntiTopComponent) {
			topAntiTopComponent.updateData(institute);
		}
	}

	function handleViewAgain(subject: string, institute?: InstituteId) {
		if (statisticsComponent) {
			statisticsComponent.viewSubject(subject, institute);
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
				urlParams.delete('ref');
				const newUrl = urlParams.toString()
					? `${window.location.pathname}?${urlParams.toString()}`
					: window.location.pathname;
				window.history.replaceState({}, '', newUrl);
			} else {
				localStorage.setItem('pending_referral_code', ref);
			}
		}

		if (subject && statisticsComponent) {
			statisticsComponent.viewSubject(subject);
		}
	});

	let previousAuthState = $auth.authenticated;
	$: {
		if (
			browser &&
			$auth.authenticated &&
			$auth.user?.id &&
			!previousAuthState &&
			!referralApplied
		) {
			const pendingReferralCode = localStorage.getItem('pending_referral_code');
			if (pendingReferralCode) {
				referralApplied = true;
				(async () => {
					try {
						const result = await registerReferral(pendingReferralCode);
						if (result.success) {
							notifications.add('Реферальная ссылка активирована!', 'success');
						} else if (result.error) {
							notifications.add(result.error, 'warning');
						}
						localStorage.removeItem('pending_referral_code');

						const urlParams = new URLSearchParams(window.location.search);
						if (urlParams.get('ref')) {
							urlParams.delete('ref');
							const newUrl = urlParams.toString()
								? `${window.location.pathname}?${urlParams.toString()}`
								: window.location.pathname;
							window.history.replaceState({}, '', newUrl);
						}
					} catch (error) {
						console.error('Ошибка при применении реферального кода:', error);
						referralApplied = false;
					}
				})();
			}
		}
		previousAuthState = $auth.authenticated;
	}
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
			on:showReferral={() => goto('/profile?tab=referrals')}
			on:instituteChange={({ detail }) => handleInstituteChange(detail)}
		/>

		<TopAntiTopSection
			bind:this={topAntiTopComponent}
			on:viewAgain={({ detail }) => handleViewAgain(detail.subject)}
		/>

		<RecentlyViewedSection
			on:viewAgain={({ detail }) => handleViewAgain(detail.subject, detail.institute)}
		/>
	</main>

	<Footer />
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
