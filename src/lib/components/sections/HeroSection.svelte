<script lang="ts">
	import TgsSticker from '$lib/components/common/TgsSticker.svelte';
	import { writable } from 'svelte/store';

	type University = 'ystu' | 'yspu';
	const selectedUniversity = writable<University>('ystu');

	const features = [
		{
			href: {
				ystu: '/rasp',
				yspu: '/yspu/rasp'
			},
			icon: '/stickers/student.tgs',
			title: 'Расписание студентов',
			description: 'Узнайте расписание своей группы',
			gradient: 'from-blue-500/10 to-blue-600/20',
			border: 'border-blue-500',
			hover: 'hover:border-blue-400/40 hover:shadow-blue-500',
			glowFrom: 'from-blue-600',
			glowTo: 'to-blue-700',
			showYspu: true
		},
		{
			href: {
				ystu: '/raspprep',
				yspu: '/yspu/raspprep'
			},
			icon: '/stickers/teacher.tgs',
			title: 'Расписание преподавателей',
			description: 'Расписание для преподавателей',
			gradient: 'from-purple-500/10 to-purple-600/20',
			border: 'border-purple-500',
			hover: 'hover:border-purple-400/40 hover:shadow-purple-500',
			glowFrom: 'from-purple-600',
			glowTo: 'to-purple-700',
			showYspu: true
		},
		{
			href: {
				ystu: '/raspaudience',
				yspu: '/yspu/raspaudience'
			},
			icon: '/stickers/audience.tgs',
			title: 'Расписание аудиторий',
			description: 'Найдите свободную аудиторию',
			gradient: 'from-green-500/10 to-green-600/20',
			border: 'border-green-500',
			hover: 'hover:border-green-400/40 hover:shadow-green-500',
			glowFrom: 'from-green-600',
			glowTo: 'to-green-700',
			showYspu: true
		},
		{
			href: {
				ystu: '/stat'
			},
			icon: '/stickers/statistics.tgs',
			title: 'Статистика оценок',
			description: 'Средние баллы по предметам, визуализация оценок',
			gradient: 'from-yellow-500/10 to-yellow-600/20',
			border: 'border-yellow-500',
			hover: 'hover:border-yellow-400/40 hover:shadow-yellow-500',
			glowFrom: 'from-yellow-600',
			glowTo: 'to-yellow-700',
			showYspu: false
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
		Ваш универсальный помощник для учебы
	</p>

	<div class="mx-auto grid max-w-5xl grid-cols-2 gap-4 lg:grid-cols-4">
		{#each features as feature}
			<a
				href={feature.href[$selectedUniversity] ?? feature.href.ystu}
				class="hero-card group relative overflow-hidden rounded-xl bg-gradient-to-br {feature.gradient} border {feature.border} p-4 backdrop-blur-sm transition-all {feature.hover}"
			>
				<div
					class="absolute inset-0 bg-gradient-to-br {feature.glowFrom} {feature.glowTo} opacity-0 transition-opacity group-hover:opacity-10"
				></div>
				<div class="relative z-10">
					<div
						class="mx-auto mb-2 flex h-35 w-35 items-center justify-center md:h-[150px] md:w-[150px]"
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

					{#if feature.showYspu}
						<div class="mt-4 flex justify-center gap-2">
							<button
								class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/10"
								on:click={() => selectedUniversity.set('ystu')}>ЯГТУ</button
							>
							<button
								class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/10"
								on:click={() => selectedUniversity.set('yspu')}>ЯГПУ</button
							>
						</div>
					{:else}
						<div class="mt-4 flex justify-center">
							<span
								class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/50"
								>🔒 Доступно только в ЯГТУ</span
							>
						</div>
					{/if}
				</div>
				<div
					class="absolute right-0 bottom-0 left-0 h-0.5 origin-left scale-x-0 transform bg-white/20 transition-transform group-hover:scale-x-100"
				></div>
			</a>
		{/each}
	</div>
</section>
