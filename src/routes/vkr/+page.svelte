<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import SkeletonLoader from '$lib/components/ui/SkeletonLoader.svelte';

	const institutes = [
		{ id: 'zfo', label: 'Заочная форма обучения' },
		{ id: 'zfo-uop', label: 'Заочный форма обучения (отделение УОП)' },
		{ id: 'iad', label: 'Институт архитектуры и дизайна' },
		{ id: 'iist', label: 'Институт инженеров строительства и транспорта' },
		{ id: 'ihht', label: 'Институт химии и химической технологии' },
		{ id: 'iem', label: 'Институт экономики и менеджмента' },
		{ id: 'ics', label: 'Институт цифровых систем' },
		{ id: 'iim', label: 'Институт инженерии и машиностроения' },
		{ id: 'college', label: 'Колледж' }
	];

	let selectedInstituteId: string | number | null = 'ics';
	let isGenerating = false;
	let isAppending = false;
	let generatedTopics: string[] = [];
	let showTopics = false;
	let error = '';

	$: selectedInstitute = institutes.find((i) => i.id === selectedInstituteId);

	async function generateTopics(append = false) {
		if (!selectedInstitute) return;

		isGenerating = true;
		isAppending = append;
		error = '';

		if (!append) {
			showTopics = false;
			generatedTopics = [];
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		try {
			const response = await fetch('/api/thesis/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					institute: selectedInstitute.label
				})
			});

			if (!response.ok) {
				throw new Error('Ошибка генерации');
			}

			const data = await response.json();

			await new Promise((resolve) => setTimeout(resolve, 1500));

			if (append) {
				generatedTopics = [...generatedTopics, ...data.topics];
			} else {
				generatedTopics = data.topics;
			}
			showTopics = true;
		} catch (err) {
			error = 'Не удалось сгенерировать темы. Попробуйте еще раз.';
			console.error('Ошибка генерации тем:', err);
		} finally {
			isGenerating = false;
			isAppending = false;
		}
	}

	onMount(() => {
		const starsContainer = document.getElementById('thesisStarsContainer');
		if (starsContainer) {
			const starCount = 50;
			for (let i = 0; i < starCount; i++) {
				const star = document.createElement('div');
				star.className = 'star';
				star.style.left = `${Math.random() * 100}%`;
				star.style.top = `${Math.random() * 100}%`;
				const size = Math.random() * 2 + 1;
				star.style.width = `${size}px`;
				star.style.height = `${size}px`;
				star.style.setProperty('--delay', `${Math.random() * 3}s`);
				star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
				starsContainer.appendChild(star);
			}
		}
	});

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>Генератор тем ВКР | ysturasp</title>
	<meta
		name="description"
		content="Генератор тем для выпускных квалификационных работ студентов ЯГТУ"
	/>
</svelte:head>

<PageLayout>
	<div class="animated-background">
		<div class="stars" id="thesisStarsContainer"></div>
		<div class="gradient-sphere sphere-1"></div>
		<div class="gradient-sphere sphere-2"></div>
	</div>

	<div class="relative z-10">
		<Header />
		<main class="relative container mx-auto px-4 py-6 md:py-12">
			<div class="mx-auto max-w-4xl">
				<div
					class="text-center"
					in:fly={{ y: -20, duration: 600, delay: 100, easing: quintOut }}
				>
					<h1 class="mb-3 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
						🎓 Генератор тем ВКР
					</h1>
					<p class="mb-6 text-base text-gray-300 md:mb-8 md:text-lg">
						Не можешь придумать тему для диплома? Мы поможем!
					</p>
				</div>

				<div
					class="mb-6 rounded-2xl bg-slate-800 p-4 md:mb-8 md:p-6"
					in:fade={{ duration: 400, delay: 300 }}
				>
					<div class="mb-4">
						<label for="institute" class="mb-2 block text-sm font-medium text-gray-300">
							Выбери свой институт
						</label>
						<CustomSelect
							items={institutes}
							bind:selectedId={selectedInstituteId}
							placeholder="Выберите институт"
							width="100%"
						/>
					</div>

					<button
						on:click={() => generateTopics(false)}
						disabled={isGenerating || !selectedInstitute}
						class="w-full rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 md:px-8 md:py-4 md:text-lg"
					>
						<div class="flex items-center justify-center gap-2 md:gap-3">
							{#if isGenerating}
								<div
									class="h-5 w-5 animate-spin rounded-full border-4 border-white border-t-transparent md:h-6 md:w-6"
								></div>
								<span>Генерируем...</span>
							{:else}
								<svg
									class="h-5 w-5 md:h-6 md:w-6"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
									/>
								</svg>
								<span>Сгенерировать</span>
							{/if}
						</div>
					</button>

					{#if error}
						<div
							class="mt-4 rounded-lg bg-red-900/50 p-4 text-center text-red-300"
							transition:fade
						>
							{error}
						</div>
					{/if}
				</div>

				{#if isGenerating && !isAppending}
					<div class="space-y-3 md:space-y-4" in:fade={{ duration: 300 }}>
						<div class="text-center">
							<SkeletonLoader variant="title" width="60%" className="mx-auto mb-4" />
						</div>
						{#each Array(5) as _, i}
							<div class="rounded-xl bg-slate-800 p-4 md:p-6">
								<div class="flex items-start gap-3 md:gap-4">
									<div class="h-8 w-8 flex-shrink-0 md:h-10 md:w-10">
										<SkeletonLoader
											variant="custom"
											customWidth="100%"
											customHeight="100%"
											rounded={true}
											className="rounded-full"
										/>
									</div>
									<div class="flex-1 space-y-2">
										<SkeletonLoader variant="text" width="95%" />
										<SkeletonLoader variant="text" width="80%" />
									</div>
									<div class="h-9 w-9 flex-shrink-0">
										<SkeletonLoader
											variant="custom"
											customWidth="100%"
											customHeight="100%"
										/>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if showTopics && generatedTopics.length > 0}
					<div class="space-y-3 md:space-y-4" in:fade={{ duration: 400, delay: 100 }}>
						<h2 class="text-center text-xl font-semibold text-white md:text-2xl">
							Вот твои идеи для ВКР:
						</h2>
						{#each generatedTopics as topic, i}
							<div
								class="rounded-xl bg-slate-800 p-4 transition-colors hover:bg-slate-700 md:p-6"
								in:fly={{ y: 10, duration: 400, delay: i * 50, easing: quintOut }}
							>
								<div class="flex items-start gap-3 md:gap-4">
									<div
										class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white md:h-10 md:w-10 md:text-lg"
									>
										{i + 1}
									</div>
									<div class="flex-1">
										<p class="text-base leading-relaxed text-white md:text-lg">
											{topic}
										</p>
									</div>
									<button
										on:click={() => copyToClipboard(topic)}
										class="flex-shrink-0 rounded-lg bg-slate-700 p-2 text-gray-400 transition-colors hover:bg-slate-600 hover:text-white"
										aria-label="Копировать тему"
									>
										<svg
											class="h-4 w-4 md:h-5 md:w-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
											/>
										</svg>
									</button>
								</div>
							</div>
						{/each}

						{#if isGenerating && isAppending}
							{#each Array(5) as _, i}
								<div
									class="rounded-xl bg-slate-800 p-4 md:p-6"
									in:fade={{ duration: 300 }}
								>
									<div class="flex items-start gap-3 md:gap-4">
										<div class="h-8 w-8 flex-shrink-0 md:h-10 md:w-10">
											<SkeletonLoader
												variant="custom"
												customWidth="100%"
												customHeight="100%"
												rounded={true}
												className="rounded-full"
											/>
										</div>
										<div class="flex-1 space-y-2">
											<SkeletonLoader variant="text" width="95%" />
											<SkeletonLoader variant="text" width="80%" />
										</div>
										<div class="h-9 w-9 flex-shrink-0">
											<SkeletonLoader
												variant="custom"
												customWidth="100%"
												customHeight="100%"
											/>
										</div>
									</div>
								</div>
							{/each}
						{/if}

						<div class="mt-6 rounded-xl bg-blue-900/30 p-4 text-center md:mt-8 md:p-6">
							<p class="text-xs text-gray-300 md:text-sm">
								💡 <strong>Совет:</strong> Эти темы — отправная точка. Обсуди их с научным
								руководителем и адаптируй под свои интересы и возможности кафедры.
							</p>
						</div>

						<button
							on:click={() => generateTopics(true)}
							disabled={isGenerating}
							class="mx-auto flex items-center gap-2 rounded-lg bg-slate-700 px-5 py-2.5 text-sm text-white transition-colors hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-50 md:px-6 md:py-3 md:text-base"
						>
							<svg
								class="h-4 w-4 md:h-5 md:w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							Сгенерировать ещё
						</button>
					</div>
				{/if}
			</div>
		</main>
		<Footer />
	</div>
</PageLayout>

<style>
	.animated-background {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		overflow: hidden;
		background: linear-gradient(to bottom, #0f172a, #1e293b);
	}

	.stars {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	:global(.star) {
		position: absolute;
		background: white;
		border-radius: 50%;
		opacity: 0;
		animation: twinkle var(--duration) ease-in-out infinite;
		animation-delay: var(--delay);
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0;
			transform: scale(0.5);
		}
		50% {
			opacity: 0.8;
			transform: scale(1);
		}
	}

	.gradient-sphere {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		opacity: 0.2;
		animation: float 25s ease-in-out infinite;
	}

	.sphere-1 {
		top: 20%;
		left: -10%;
		width: 500px;
		height: 500px;
		background: radial-gradient(
			circle at center,
			rgba(59, 130, 246, 0.6),
			rgba(59, 130, 246, 0)
		);
		animation-delay: -5s;
	}

	.sphere-2 {
		bottom: 20%;
		right: -10%;
		width: 600px;
		height: 600px;
		background: radial-gradient(
			circle at center,
			rgba(147, 51, 234, 0.6),
			rgba(147, 51, 234, 0)
		);
		animation-delay: -10s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		33% {
			transform: translate(30px, -30px) rotate(120deg);
		}
		66% {
			transform: translate(-20px, 20px) rotate(240deg);
		}
	}

	.container {
		max-width: 1200px;
	}

	@media (max-width: 640px) {
		.gradient-sphere {
			filter: blur(60px);
		}
	}
</style>
