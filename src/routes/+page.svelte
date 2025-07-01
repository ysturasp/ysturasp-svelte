<script>
  import Header from '$lib/components/Header.svelte';
  import HeroSection from '$lib/components/HeroSection.svelte';
  import SupportSection from '$lib/components/SupportSection.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import CookieNotification from '$lib/components/CookieNotification.svelte';
  import StatsSection from '$lib/components/StatsSection.svelte';
  import FeaturesSection from '$lib/components/FeatureSection.svelte';
</script>

<svelte:head>
  <title>ystuRASP - Главная</title>
  <meta name="description" content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp">
  <link rel="icon" href="images/cat.png" type="image/png">
</svelte:head>

<div class="fixed inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 pointer-events-none"></div>

<Header />

<main class="container mx-auto px-4 mt-8 relative">
  <HeroSection />
  <SupportSection />
  <StatsSection />
  <FeaturesSection />
</main>

<Footer />
<CookieNotification />
