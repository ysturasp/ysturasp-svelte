<script>
	import { page } from '$app/stores';
	import Header from '$lib/components/layout/Header.svelte';
	import ErrorContent from '$lib/components/common/ErrorContent.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
</script>

<svelte:head>
	<title>Упс.. Ошибочка - ystuRASP</title>
	<meta
		name="description"
		content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp"
	/>
	<link rel="icon" href="images/cat.png" type="image/png" />
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<ErrorContent
			status={$page.status}
			message={$page.status === 404
				? 'К сожалению, запрашиваемая вами страница не существует. Похоже, что она еще не создана или у нас небольшие работы'
				: 'Произошла непредвиденная ошибка. Мы уже работаем над её устранением.'}
		/>
	</main>
</PageLayout>
