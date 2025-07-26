<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { onMount } from 'svelte';

	interface Post {
		title?: string;
		link?: string;
		date?: string;
		content?: string;
		image?: string;
		reactions?: Record<string, number>;
	}

	let loading = true;
	let posts: Post[] = [];
	let showModal = false;
	let selectedImage = '';
	let modalTransitioning = false;

	async function fetchBoostyPosts() {
		try {
			const response = await fetch(
				'https://script.google.com/macros/s/AKfycbyDHKXrUCxAiTxXdVcfXUkeBnPPstQdK3K-cDmserZQL4svFoi-oPjWkEDfqcx3bqHd/exec'
			);
			posts = await response.json();
		} catch (error) {
			console.error('Error fetching Boosty posts:', error);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		fetchBoostyPosts();
	});

	function handleImageClick(imageUrl: string) {
		selectedImage = imageUrl;
		showModal = true;
	}

	function closeModal() {
		if (modalTransitioning) return;
		modalTransitioning = true;
		setTimeout(() => {
			showModal = false;
			modalTransitioning = false;
		}, 300);
	}

	function handleModalClick(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (target.id === 'image-modal') {
			closeModal();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}
</script>

<svelte:head>
	<title>О нас - ystuRASP</title>
	<meta
		name="description"
		content="Узнайте статистику оценок студентов ЯГТУ, средние баллы и распределение оценок по различным дисциплинам. ysturasp"
	/>
	<link rel="icon" href="images/cat.png" type="image/png" />
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section id="boosty-news" class="mt-8 rounded-2xl bg-slate-800 p-6">
			<h2
				class="mb-4 text-center text-2xl font-semibold text-white sm:text-left md:text-left md:text-4xl lg:text-left"
			>
				😜 Наша история (дубляж постов с Boosty)
			</h2>
			<div class="mb-8 text-center md:mt-0 md:mb-6">
				<a
					href="https://boosty.to/ysturasp.me/donate"
					target="_blank"
					class="rounded-full bg-blue-700 px-6 py-3 font-bold text-white transition duration-300 hover:bg-blue-600"
				>
					Поддержать проект
				</a>
			</div>

			{#if loading}
				<div class="wrapper">
					<div class="circle"></div>
					<div class="circle"></div>
					<div class="circle"></div>
					<div class="shadow"></div>
					<div class="shadow"></div>
					<div class="shadow"></div>
					<span>Loading</span>
				</div>
			{:else if posts.length === 0}
				<p class="text-slate-400">Посты пока недоступны.</p>
			{:else}
				{#each posts as post}
					<div
						class="mb-8 rounded-2xl bg-slate-900 p-6 shadow-lg transition-shadow duration-300 hover:shadow-2xl"
					>
						{#if post.link}
							<a
								href={post.link}
								target="_blank"
								class="text-2xl font-bold text-white transition-colors hover:text-blue-400"
							>
								{post.title}
							</a>
						{/if}
						{#if post.date}
							<p class="mt-2 mb-4 text-sm text-slate-400">
								📅 {new Intl.DateTimeFormat('ru-RU', {
									year: 'numeric',
									month: 'long',
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								}).format(new Date(post.date))}
							</p>
						{/if}
						{#if post.content}
							<div class="prose prose-invert max-w-none">
								{@html post.content
									.replace(/\n{3,}/g, '\n\n')
									.split('\n\n')
									.map((paragraph: string) => {
										const paragraphWithStyledLinks = paragraph
											.trim()
											.replace(
												/<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/g,
												'<a href="$1" target="_blank" class="text-yellow-400 hover:text-yellow-300 transition-colors">$2</a>'
											);
										return `<p class="text-slate-300 mt-3 leading-relaxed">${paragraphWithStyledLinks}</p>`;
									})
									.join('')}
							</div>
						{/if}
						{#if post.image}
							{@const imageUrl = `https://lnk.su/api/image.get?url=${post.image.split('?')[0]}`}
							<div class="mt-5 flex justify-center">
								<button
									type="button"
									class="max-w-full cursor-pointer rounded-2xl transition-transform duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:outline-none"
									style="padding:0;border:none;background:none;"
									on:click={() => handleImageClick(imageUrl)}
									on:keydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											handleImageClick(imageUrl);
										}
									}}
									aria-label="Открыть изображение поста в модальном окне"
								>
									<img
										src={imageUrl}
										alt=""
										role="presentation"
										style="max-height: 500px"
										class="max-w-full rounded-2xl object-cover"
									/>
								</button>
							</div>
						{/if}
						{#if post.reactions}
							<div class="reactions-container">
								{#each Object.entries(post.reactions) as [type, count]}
									{#if count > 0}
										<a href={post.link} target="_blank">
											<div class="reaction-item">
												<span>
													{#if type === 'like'}👍
													{:else if type === 'dislike'}👎
													{:else if type === 'heart'}❤️
													{:else if type === 'fire'}🔥
													{:else if type === 'wonder'}😮
													{:else if type === 'sad'}😢
													{:else if type === 'angry'}😠
													{:else if type === 'laught'}😄
													{/if}
												</span>
												{count}
											</div>
										</a>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</section>
	</main>
</PageLayout>

{#if showModal}
	<div
		id="image-modal"
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black {modalTransitioning
			? 'modal-closing'
			: 'modal-opening'}"
		on:click={handleModalClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div class="relative">
			<img
				src={selectedImage}
				alt="Увеличенное изображение поста"
				class="max-h-[90vh] max-w-[90vw] rounded-2xl object-contain"
			/>
			<button
				type="button"
				class="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 p-2 text-white hover:bg-red-800 md:h-10 md:w-10"
				on:click={closeModal}
				aria-label="Закрыть модальное окно"
			>
				&times;
			</button>
		</div>
	</div>
{/if}

<svelte:window on:keydown={handleKeydown} />

<style>
	.wrapper {
		width: 200px;
		height: 60px;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.circle {
		width: 20px;
		height: 20px;
		position: absolute;
		border-radius: 50%;
		background-color: #fff;
		left: 15%;
		transform-origin: 50%;
		animation: circle 0.5s alternate infinite ease;
	}

	@keyframes circle {
		0% {
			top: 60px;
			height: 5px;
			border-radius: 50px 50px 25px 25px;
			transform: scaleX(1.7);
		}
		40% {
			height: 20px;
			border-radius: 50%;
			transform: scaleX(1);
		}
		100% {
			top: 0%;
		}
	}

	.circle:nth-child(2) {
		left: 45%;
		animation-delay: 0.2s;
	}

	.circle:nth-child(3) {
		left: auto;
		right: 15%;
		animation-delay: 0.3s;
	}

	.shadow {
		width: 20px;
		height: 4px;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.5);
		position: absolute;
		top: 62px;
		transform-origin: 50%;
		z-index: -1;
		left: 15%;
		filter: blur(1px);
		animation: shadow 0.5s alternate infinite ease;
	}

	@keyframes shadow {
		0% {
			transform: scaleX(1.5);
		}
		40% {
			transform: scaleX(1);
			opacity: 0.7;
		}
		100% {
			transform: scaleX(0.2);
			opacity: 0.4;
		}
	}

	.shadow:nth-child(4) {
		left: 45%;
		animation-delay: 0.2s;
	}

	.shadow:nth-child(5) {
		left: auto;
		right: 15%;
		animation-delay: 0.3s;
	}

	.wrapper span {
		position: absolute;
		top: 75px;
		font-family: 'Lato';
		font-size: 20px;
		letter-spacing: 12px;
		color: #fff;
		left: 15%;
	}

	.modal-opening {
		animation: modalFadeIn 0.3s ease-out forwards;
	}

	.modal-closing {
		animation: modalFadeOut 0.3s ease-in forwards;
	}

	@keyframes modalFadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes modalFadeOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	.reactions-container {
		display: flex;
		gap: 20px;
		margin-top: 24px;
		flex-wrap: wrap;
	}

	.reaction-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 24px;
		background: rgba(30, 41, 59, 0.5);
		border-radius: 30px;
		font-size: 20px;
		color: #94a3b8;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.reaction-item:hover {
		transform: scale(1.05);
		background: rgba(30, 41, 59, 0.8);
	}

	.reaction-item span {
		font-size: 24px;
	}
</style>
