<script>
	import Header from '$lib/components/layout/Header.svelte';
	import HeroSection from '$lib/components/sections/HeroSection.svelte';
	import SupportSection from '$lib/components/sections/SupportSection.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import CookieNotification from '$lib/components/notifications/CookieNotification.svelte';
	import StatsSection from '$lib/components/sections/StatsSection.svelte';
	import FeaturesSection from '$lib/components/sections/FeatureSection.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
</script>

<svelte:head>
	<title>ystuRASP | Спорим, теперь это твой новый универсальный помощник для учебы в ЯГТУ?</title>
	<meta
		name="description"
		content="ystuRASP - универсальный помощник для учебы в ЯГТУ. Расписание занятий, статистика оценок, информация о кампусе и другие полезные сервисы для студентов"
	/>
	<meta
		name="keywords"
		content="ystuRASP, ЯГТУ расписание, ЯГТУ сервисы, ЯГТУ для студентов, статистика ЯГТУ, кампус ЯГТУ, оценки ЯГТУ"
	/>
	<meta
		property="og:title"
		content="ystuRASP | Расписание ЯГТУ, статистика и сервисы для студентов"
	/>
	<meta
		property="og:description"
		content="ystuRASP - универсальный помощник для учебы в ЯГТУ. Расписание занятий, статистика оценок, информация о кампусе и другие полезные сервисы для студентов."
	/>
</svelte:head>

<PageLayout>
	<div
		class="pointer-events-none fixed inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"
	></div>

	<Header />

	<main class="relative container mx-auto mt-8 px-4">
		<HeroSection />
		<SupportSection />
		<StatsSection />
		<FeaturesSection />
	</main>

	<Footer />
	<CookieNotification />
</PageLayout>
