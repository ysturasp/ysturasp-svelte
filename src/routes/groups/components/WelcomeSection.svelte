<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';

	const dispatch = createEventDispatcher();
</script>

<section
	class="welcome-section relative flex min-h-screen flex-col items-center justify-center px-4 py-20"
>
	<h1 class="relative mb-8 text-center text-4xl font-bold md:text-6xl">
		<div class="mx-auto mb-4 flex items-center justify-center md:hidden">
			<TgsSticker src="/stickers/waving_hand.tgs" width="100px" height="100px" />
		</div>
		<span class="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
			ну привет, первокурсник
			<div class="hidden md:inline-block" style="height: 1em; vertical-align: -0.1em;">
				<TgsSticker src="/stickers/waving_hand.tgs" width="80px" height="80px" />
			</div>
		</span>
	</h1>

	<p class="text-md mb-12 max-w-3xl text-center text-slate-300 md:text-2xl">
		тут ты можешь найти чат своего института или группы, добавить его сюда сам, а также
		посмотреть расписание по своей группе 🚀
	</p>

	<div class="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		<div class="feature-card relative rounded-xl p-6">
			<div class="mb-4 text-3xl">👥</div>
			<h3 class="mb-2 text-xl font-bold text-white">официальные чаты групп</h3>
			<p class="text-slate-300">
				присоединяйся к проверенным чатам ВКонтакте, созданным кураторами института или
				твоей группы
			</p>
		</div>

		<div class="feature-card relative rounded-xl p-6">
			<div class="mb-4 text-3xl">👨‍🏫</div>
			<h3 class="mb-2 text-xl font-bold text-white">связь с группой</h3>
			<p class="text-slate-300">знакомься со своими однокурсниками и общайся с ними</p>
		</div>

		<div class="feature-card relative rounded-xl p-6">
			<div class="mb-4 text-3xl">📚</div>
			<h3 class="mb-2 text-xl font-bold text-white">учебные материалы</h3>
			<p class="text-slate-300">
				делись конспектами, методичками и помогай одногруппникам в учебе
			</p>
		</div>
	</div>

	<div class="mt-12">
		<button
			on:click={() => dispatch('scrollToChats')}
			class="transform rounded-xl bg-blue-600 px-8 py-4 text-lg font-medium text-white transition-all hover:scale-105 hover:bg-blue-700"
		>
			Найти свой чат
			<span class="ml-2">👇</span>
		</button>
	</div>
</section>

<style>
	.feature-card {
		background: rgba(30, 41, 59, 0.7);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(59, 130, 246, 0.1);
		transform: rotate(-2deg);
		transition: all 0.3s ease;
	}

	.feature-card:nth-child(even) {
		transform: rotate(2deg);
	}

	.feature-card:hover {
		transform: rotate(0) scale(1.02);
	}

	h1 {
		font-family: 'Unbounded', cursive;
		font-weight: 600;
		letter-spacing: -0.03em;
	}

	h3 {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	p {
		font-family: 'Exo 2', sans-serif;
		letter-spacing: 0.02em;
	}

	button {
		font-family: 'Exo 2', sans-serif;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
</style>
