<script lang="ts">
	import { onMount } from 'svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import WelcomeSection from './components/WelcomeSection.svelte';
	import ChatsSection from './components/ChatsSection.svelte';
	import FeaturesSection from './components/FeaturesSection.svelte';
	import AddGroupModal from './components/AddGroupModal.svelte';
	import DeleteGroupModal from './components/DeleteGroupModal.svelte';
	import AuthModal from './components/AuthModal.svelte';
	import { authToken, refreshToken } from './stores';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

	let showAddModal = false;
	let showDeleteModal = false;
	let showAuthModal = false;

	onMount(() => {
		const token = localStorage.getItem('authToken');
		const refresh = localStorage.getItem('refreshToken');
		if (token) authToken.set(token);
		if (refresh) refreshToken.set(refresh);

		const starsContainer = document.getElementById('starsContainer');
		if (starsContainer) {
			const starCount = 100;
			for (let i = 0; i < starCount; i++) {
				const star = document.createElement('div');
				star.className = 'star';
				star.style.left = `${Math.random() * 100}%`;
				star.style.top = `${Math.random() * 100}%`;
				const size = Math.random() * 3;
				star.style.width = `${size}px`;
				star.style.height = `${size}px`;
				star.style.setProperty('--delay', `${Math.random() * 3}s`);
				star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);
				starsContainer.appendChild(star);
			}
		}
	});
</script>

<svelte:head>
	<title>ysturasp. ну привет, первокурсник 👋</title>
	<meta
		name="description"
		content="Каталог чатов групп ЯГТУ для первокурсников и студентов. Присоединяйся к официальным чатам, добавляй свой чат, находи расписание и общайся с однокурсниками."
	/>
	<meta
		name="keywords"
		content="ЯГТУ студентам, чаты ЯГТУ, группы ЯГТУ, чат группы ЯГТУ, чат института ЯГТУ, чат студентов ЯГТУ, ЯГТУ чаты, студенческие чаты ЯГТУ, ЯГТУ, первокурсники ЯГТУ, институты ЯГТУ"
	/>
	<meta property="og:title" content="Чаты групп ЯГТУ | Найди и добавь чат своей группы" />
	<meta
		property="og:description"
		content="Каталог чатов групп ЯГТУ для студентов. Присоединяйся к официальным чатам, добавляй свой чат, находи расписание и общайся с однокурсниками."
	/>
</svelte:head>

<PageLayout>
	<div class="animated-background">
		<div class="stars" id="starsContainer"></div>
		<div class="gradient-sphere sphere-1"></div>
		<div class="gradient-sphere sphere-2"></div>
		<div class="gradient-sphere sphere-3"></div>
	</div>

	<div class="relative z-10">
		<Header />
		<main class="relative">
			<WelcomeSection
				on:scrollToChats={() =>
					document.getElementById('chats')?.scrollIntoView({ behavior: 'smooth' })}
			/>
			<ChatsSection
				on:addGroup={() => (showAddModal = true)}
				on:deleteGroup={() => (showDeleteModal = true)}
				on:showAuth={() => (showAuthModal = true)}
			/>
			<FeaturesSection />
		</main>
		<Footer />
	</div>

	{#if showAddModal}
		<AddGroupModal on:close={() => (showAddModal = false)} />
	{/if}

	{#if showDeleteModal}
		<DeleteGroupModal on:close={() => (showDeleteModal = false)} />
	{/if}

	{#if showAuthModal}
		<AuthModal on:close={() => (showAuthModal = false)} />
	{/if}
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
			opacity: 0.5;
			transform: scale(1);
		}
	}

	.gradient-sphere {
		position: absolute;
		border-radius: 50%;
		filter: blur(60px);
		opacity: 0.15;
		animation: float 20s ease-in-out infinite;
	}

	.sphere-1 {
		top: 10%;
		left: -10%;
		width: 600px;
		height: 600px;
		background: radial-gradient(
			circle at center,
			rgba(59, 130, 246, 0.4),
			rgba(59, 130, 246, 0)
		);
		animation-delay: -5s;
	}

	.sphere-2 {
		top: 40%;
		right: -5%;
		width: 500px;
		height: 500px;
		background: radial-gradient(
			circle at center,
			rgba(147, 51, 234, 0.4),
			rgba(147, 51, 234, 0)
		);
		animation-delay: -2s;
	}

	.sphere-3 {
		bottom: -10%;
		left: 30%;
		width: 700px;
		height: 700px;
		background: radial-gradient(
			circle at center,
			rgba(236, 72, 153, 0.3),
			rgba(236, 72, 153, 0)
		);
		animation-delay: -8s;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0);
		}
		25% {
			transform: translate(50px, 50px);
		}
		50% {
			transform: translate(0, 100px);
		}
		75% {
			transform: translate(-50px, 50px);
		}
	}
</style>
