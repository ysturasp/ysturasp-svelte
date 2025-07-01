<script>
  import Header from '$lib/components/Header.svelte';
  import PageLayout from '$lib/components/PageLayout.svelte';
</script>

<svelte:head>
  <title>ystuRASP - Главная</title>
  <meta name="description" content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp">
  <link rel="icon" href="images/cat.png" type="image/png">
</svelte:head>

<PageLayout>
  <Header />
  <main class="container mx-auto mt-5 md:mt-7 px-3 md:px-0">
    <h1>Главная</h1>
  </main>
</PageLayout>
