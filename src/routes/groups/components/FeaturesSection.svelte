<script>
	const features = [
		{
			emoji: '📅',
			title: 'умное расписание',
			description:
				'персональное расписание с возможностью отключить занятия, разделением лаб на подгруппы и аналитикой твоего учебного пути',
			link: '/rasp'
		},
		{
			emoji: '🏛️',
			title: 'карта кампуса',
			description: 'интерактивная карта всех корпусов и важных мест ЯГТУ',
			link: '/campus'
		},
		{
			emoji: '📊',
			title: 'статистика и аналитика',
			description:
				'отслеживай усредненную успеваемость по предметам и расчитывай как распределить учебную нагрузку в семестре по среднему баллу',
			link: '/stat'
		},
		{
			emoji: '📱',
			title: 'mini app в telegram',
			description:
				'прогрессивное mini приложение в телеграм, позволяющее просматривать расписание, получать уведомления и многое другое',
			link: 'https://t.me/ysturasp_bot'
		}
	];
</script>

<section class="relative px-4 py-20">
	<div class="mx-auto max-w-6xl">
		<h2 class="mb-12 text-center text-3xl font-bold text-white md:text-4xl">
			Что еще может ysturasp?
			<span class="inline-block">✨</span>
		</h2>

		<div class="grid grid-cols-1 gap-12 md:grid-cols-2">
			{#each features as feature}
				<div class="feature-card rounded-xl p-8">
					<div class="mb-4 text-3xl">{feature.emoji}</div>
					<h3 class="mb-4 text-xl font-bold text-white">{feature.title}</h3>
					<p class="mb-4 text-slate-300">{feature.description}</p>
					<a href={feature.link} class="text-blue-400 transition-all hover:text-blue-300">
						{feature.link.startsWith('http') ? 'Открыть' : 'Попробовать'} →
					</a>
				</div>
			{/each}
		</div>
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

	h2 {
		font-family: 'Unbounded', cursive;
		font-weight: 500;
		letter-spacing: -0.02em;
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

	a {
		font-family: 'Exo 2', sans-serif;
		letter-spacing: 0.02em;
	}
</style>
