<script>
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';

	const features = [
		{
			href: '/rasp',
			icon: '/stickers/student.tgs',
			title: 'Расписание студентов',
			description: 'Узнайте расписание своей группы',
			gradient: 'from-blue-500/10 to-blue-600/20',
			border: 'border-blue-500',
			hover: 'hover:border-blue-400/40 hover:shadow-blue-500',
			glowFrom: 'from-blue-600',
			glowTo: 'to-blue-700'
		},
		{
			href: '/raspprep',
			icon: '/stickers/teacher.tgs',
			title: 'Расписание преподавателей',
			description: 'Расписание для преподавателей',
			gradient: 'from-purple-500/10 to-purple-600/20',
			border: 'border-purple-500',
			hover: 'hover:border-purple-400/40 hover:shadow-purple-500',
			glowFrom: 'from-purple-600',
			glowTo: 'to-purple-700'
		},
		{
			href: '/raspaudience',
			icon: '/stickers/audience.tgs',
			title: 'Расписание аудиторий',
			description: 'Найдите свободную аудиторию',
			gradient: 'from-green-500/10 to-green-600/20',
			border: 'border-green-500',
			hover: 'hover:border-green-400/40 hover:shadow-green-500',
			glowFrom: 'from-green-600',
			glowTo: 'to-green-700'
		},
		{
			href: '/stat',
			icon: '/stickers/statistics.tgs',
			title: 'Статистика оценок',
			description: 'Анализ успеваемости',
			gradient: 'from-yellow-500/10 to-yellow-600/20',
			border: 'border-yellow-500',
			hover: 'hover:border-yellow-400/40 hover:shadow-yellow-500',
			glowFrom: 'from-yellow-600',
			glowTo: 'to-yellow-700'
		}
	];
</script>

<section
	class="hero-gradient relative mb-16 overflow-hidden rounded-2xl p-2 py-4 text-center md:p-8 md:py-16"
>
	<div
		class="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-600/10 to-purple-600/10"
	></div>
	<h1 class="hero-title pb-2 text-3xl font-bold md:pb-6 md:text-5xl">
		Добро пожаловать в ystuRASP
	</h1>
	<p class="text-md mx-auto mb-2 max-w-2xl text-slate-300 md:mb-6 md:text-xl">
		Ваш универсальный помощник для учебы в ЯГТУ
	</p>

	<div class="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
		{#each features as feature}
			<a
				href={feature.href}
				class="hero-card group relative overflow-hidden rounded-xl bg-gradient-to-br {feature.gradient} border {feature.border} p-4 backdrop-blur-sm transition-all {feature.hover}"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br {feature.glowFrom} {feature.glowTo} opacity-0 transition-opacity group-hover:opacity-10"
				></div>
				<div class="relative z-10">
					<div
						class="mx-auto mb-2 flex h-35 w-35 items-center justify-center md:h-[190px] md:w-[190px]"
					>
						<TgsSticker
							src={feature.icon}
							autoplay={true}
							once={false}
							quality={3}
							width="100%"
							height="100%"
						/>
					</div>
					<h3 class="mb-2 text-base font-semibold text-white lg:text-lg">
						{feature.title}
					</h3>
					<p class="text-xs text-slate-300 lg:text-sm">{feature.description}</p>
				</div>
				<div
					class="absolute right-0 bottom-0 left-0 h-1 bg-gradient-to-r {feature.glowFrom} {feature.glowTo} origin-left scale-x-0 transform transition-transform group-hover:scale-x-100"
				></div>
			</a>
		{/each}
	</div>
</section>
