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

	function showNotification(message: string, type: 'success' | 'error' | 'warning') {
		const notification = document.createElement('div');
		notification.className = `fixed bottom-5 right-5 left-5 sm:right-10 sm:left-auto p-4 rounded-2xl z-50 notification ${
			type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
		} text-white shadow-lg flex items-center justify-between`;

		const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';

		notification.innerHTML = `
      <div class="flex items-center">
        <span class="text-2xl mr-2">${icon}</span>
        <span>${message}</span>
      </div>
      ${
			type === 'warning'
				? `
      <button onclick="showReferralModal()" class="ml-4 px-3 py-1 bg-white text-yellow-500 rounded-xl hover:bg-yellow-100 transition-colors">
        Увеличить лимит
      </button>
      `
				: ''
		}
    `;

		document.body.appendChild(notification);

		setTimeout(() => {
			notification.classList.add('show');
		}, 10);

		setTimeout(() => {
			notification.classList.remove('show');
			notification.classList.add('hide');
			setTimeout(() => {
				notification.remove();
			}, 500);
		}, 5000);
	}

	onMount(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const subject = urlParams.get('subject');
		if (subject && statisticsComponent) {
			statisticsComponent.viewSubject(subject);
		}
	});
</script>

<svelte:head>
	<title>ystuRASP. Оценки по предметам ЯГТУ</title>
	<meta
		name="description"
		content="Узнайте статистику оценок предметов ЯГТУ, средние баллы и расписание 2024. ysturasp"
	/>
	<meta
		name="keywords"
		content="ystuRASP, статистика оценок ЯГТУ, средний балл предметов ЯГТУ, анализ успеваемости ЯГТУ, успеваемость по предметам ЯГТУ, ystuRASP, баллы по предметам ЯГТУ, оценочная статистика ЯГТУ"
	/>
	<meta name="geo.region" content="RU-YAR" />
	<link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css" />
	<script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>
	<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<StatisticsSection
			bind:this={statisticsComponent}
			on:showNotification={({ detail }) => showNotification(detail.message, detail.type)}
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

	{#if showReferralModal}
		<ReferralModal
			on:close={() => (showReferralModal = false)}
			on:showNotification={({ detail }) => showNotification(detail.message, detail.type)}
		/>
	{/if}

	{#if isLoading}
		<LoadingOverlay />
	{/if}
</PageLayout>

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

	.notification {
		animation: slideIn 0.5s ease-out forwards;
		transform: translateY(100%);
	}

	.notification.show {
		animation: slideIn 0.5s ease-out forwards;
	}

	.notification.hide {
		animation: slideOut 0.5s ease-in forwards;
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
