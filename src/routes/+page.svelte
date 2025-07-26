<script>
	import Header from '$lib/components/layout/Header.svelte';
	import HeroSection from '$lib/components/sections/HeroSection.svelte';
	import SupportSection from '$lib/components/sections/SupportSection.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import CookieNotification from '$lib/components/notifications/CookieNotification.svelte';
	import StatsSection from '$lib/components/sections/StatsSection.svelte';
	import FeaturesSection from '$lib/components/sections/FeatureSection.svelte';
</script>

<svelte:head>
	<title>ystuRASP - Главная</title>
	<meta
		name="description"
		content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp"
	/>
	<link rel="icon" href="images/cat.png" type="image/png" />
</svelte:head>

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
