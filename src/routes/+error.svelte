<script>
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import Header from '$lib/components/layout/Header.svelte';
	import ErrorContent from '$lib/components/common/ErrorContent.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { onMount } from 'svelte';

	let isOffline = false;

	onMount(() => {
		if (browser) {
			isOffline = !navigator.onLine;

			const handleOnline = () => {
				isOffline = false;
			};

			const handleOffline = () => {
				isOffline = true;
			};

			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);

			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});
</script>

<svelte:head>
	<title
		>{isOffline ? 'Нет подключения к интернету - ysturasp' : 'Упс.. Ошибочка - ysturasp'}</title
	>
	<meta
		name="description"
		content={isOffline
			? 'Нет подключения к интернету. Проверьте соединение и попробуйте снова. Некоторые функции могут работать в офлайн режиме.'
			: 'Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp'}
	/>
	<link rel="icon" href="images/cat_new_year.png" type="image/png" />
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		{#if isOffline}
			<div class="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
				<div class="mb-8">
					<div class="mb-4 text-6xl">📡</div>
					<h1 class="mb-4 text-3xl font-bold text-white">Нет подключения к интернету</h1>
					<p class="mb-8 max-w-lg text-lg leading-relaxed text-gray-300">
						Эта страница не была загружена при наличии интернета и не может быть
						отображена в офлайн режиме
					</p>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row">
					<button
						on:click={() => window.location.reload()}
						class="flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-3 font-medium text-white transition-all hover:bg-blue-600"
					>
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
								clip-rule="evenodd"
							/>
						</svg>
						Попробовать снова
					</button>
					<button
						on:click={() => window.history.back()}
						class="flex items-center gap-2 rounded-lg bg-slate-700 px-6 py-3 font-medium text-white transition-all hover:bg-slate-600"
					>
						<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
								clip-rule="evenodd"
							/>
						</svg>
						Назад
					</button>
				</div>
			</div>
		{:else}
			<ErrorContent
				status={page.status}
				message={page.status === 404
					? 'К сожалению, запрашиваемая вами страница не существует. Похоже, что она еще не создана или у нас небольшие работы'
					: 'Произошла непредвиденная ошибка. Мы уже работаем над её устранением.'}
			/>
		{/if}
	</main>
</PageLayout>
