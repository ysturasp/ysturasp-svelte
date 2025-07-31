<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import LoadingOverlay from '$lib/components/loading/LoadingOverlay.svelte';
	import ErrorContent from '$lib/components/common/ErrorContent.svelte';
	import ChangelogItem from '$lib/components/changelog/ChangelogItem.svelte';
	import OnlineCounter from '$lib/components/ui/OnlineCounter.svelte';
	import { loadChangelog, translateTexts } from '$lib/utils/changelog';
	import type { ChangelogItem as ChangelogItemType } from '$lib/types';

	let loading = true;
	let error = '';
	let items: ChangelogItemType[] = [];
	let translating = false;
	let translated = false;

	onMount(async () => {
		if (!browser) return;

		try {
			items = await loadChangelog();
		} catch (e) {
			error = 'Ошибка при загрузке истории изменений. Пожалуйста, попробуйте позже.';
			console.error(e);
		} finally {
			loading = false;
		}
	});

	async function handleTranslate() {
		if (!browser || translating || !items.length) return;

		if (translated) {
			items = items.map((item) => ({
				...item,
				description: item.originalDescription || item.description
			}));
			translated = false;
			return;
		}

		translating = true;

		try {
			const descriptions = items.map((item) => item.description);
			const translatedDescriptions = await translateTexts(descriptions);

			items = items.map((item, index) => ({
				...item,
				originalDescription: item.originalDescription || item.description,
				description: translatedDescriptions[index] || item.description
			}));

			translated = true;
		} catch (e) {
			console.error('Ошибка перевода:', e);
		} finally {
			translating = false;
		}
	}
</script>

<svelte:head>
	<title>История изменений - ystuRASP</title>
	<meta
		name="description"
		content="История изменений ystuRASP - отслеживайте все обновления и улучшения нашего сервиса"
	/>
	<link rel="icon" href="/images/cat.png" type="image/png" />
</svelte:head>

<div class="min-h-screen bg-slate-900 text-gray-300 antialiased">
	{#if loading}
		<LoadingOverlay />
	{/if}

	<div
		class="pointer-events-none fixed inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"
	></div>

	<Header>
		<OnlineCounter slot="online-counter-desktop" variant="desktop" />
		<OnlineCounter slot="online-counter-mobile" variant="mobile" />
	</Header>

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		{#if error}
			<ErrorContent status={500} message={error} />
		{:else}
			<section class="py-6 md:py-8">
				<div class="mx-auto max-w-4xl">
					<div class="mb-6 flex items-center justify-between">
						<h1 class="text-3xl font-bold text-white md:text-4xl">История изменений</h1>

						<button
							on:click={handleTranslate}
							disabled={translating || !items.length}
							class="flex items-center gap-2 rounded-lg bg-blue-700 p-2 text-white transition-all hover:bg-blue-600 disabled:opacity-50"
						>
							{#if translating}
								<span>Перевод...</span>
								<svg
									class="h-5 w-5 animate-spin"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										class="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										stroke-width="4"
									></circle>
									<path
										class="opacity-75"
										fill="currentColor"
										d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							{:else}
								<span>{translated ? 'Оригинал' : 'Перевести'}</span>
								<svg
									class="h-5 w-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
									></path>
								</svg>
							{/if}
						</button>
					</div>

					<div class="space-y-6">
						{#each items as item}
							<ChangelogItem {item} {translated} />
						{/each}
					</div>
				</div>
			</section>
		{/if}
	</main>

	<Footer />
</div>

<style>
	:global(body) {
		font-family: 'Inter', sans-serif;
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
</style>
