<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	const hubs = [
		{
			id: 'students-hub',
			name: 'Студенты',
			desc: 'Поиск расписания студентов. автораспределение на подгруппы',
			icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
			color: '#3b82f6',
			size: 'lg',
			links: [
				{ name: 'ЯГТУ', href: '/rasp' },
				{ name: 'ЯГПУ', href: '/yspu/rasp' }
			]
		},
		{
			id: 'teachers-hub',
			name: 'Преподаватели',
			desc: 'Поиск расписания преподавателей',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
			color: '#8b5cf6',
			size: 'md',
			links: [
				{ name: 'ЯГТУ', href: '/raspprep' },
				{ name: 'ЯГПУ', href: '/yspu/raspprep' }
			]
		},
		{
			id: 'rooms-hub',
			name: 'Аудитории',
			desc: 'Поиск расписания аудиторий и свободных',
			icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
			color: '#06b6d4',
			size: 'md',
			links: [
				{ name: 'ЯГТУ', href: '/raspaudience' },
				{ name: 'ЯГПУ', href: '/yspu/raspaudience' }
			]
		}
	];

	const tools = [
		{
			id: 'stat',
			name: 'Успеваемость',
			desc: 'Статистика оценок по предметам ЯГТУ',
			link: '/stat',
			icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
			color: '#6366f1'
		},
		{
			id: 'format',
			name: 'Форматтер',
			desc: 'Автоматическая верстка по ГОСТ',
			link: '/format',
			icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
			color: '#f59e0b'
		},
		{
			id: 'vkr',
			name: 'ВКР Генератор',
			desc: 'Нейро-идеи для дипломных работ',
			link: '/vkr',
			icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
			color: '#14b8a6'
		},
		{
			id: 'toilets',
			name: 'WC Навигатор',
			desc: 'Поиск удобств в корпусах ЯГТУ',
			link: '/toilets',
			icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z',
			color: '#0ea5e9'
		},
		{
			id: 'campus',
			name: 'Map 3D',
			desc: 'Территория кампуса ЯГТУ',
			link: '/campus',
			icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
			color: '#10b981'
		}
	];

	function handleMouseMove(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		target.style.setProperty('--mouse-x', `${x}%`);
		target.style.setProperty('--mouse-y', `${y}%`);
	}
</script>

<svelte:head>
	<title>core.ysturasp | all services ecosystem</title>
	<meta
		name="description"
		content="Все сервисы и инструменты ysturasp: расписание студентов, преподавателей и аудиторий ЯГТУ/ЯГПУ, форматирование отчётов по ГОСТ, статистика оценок, карта кампуса, установка PWA и другое."
	/>
	<meta
		name="keywords"
		content="ysturasp, сервисы ysturasp, экосистема ysturasp, расписание ЯГТУ, расписание ЯГПУ, форматирование отчётов, ГОСТ форматирование, статистика оценок, карта кампуса, PWA приложение"
	/>
	<meta property="og:title" content="Все сервисы ysturasp | Экосистема" />
	<meta
		property="og:description"
		content="Все сервисы и инструменты ysturasp: расписание студентов, преподавателей и аудиторий ЯГТУ/ЯГПУ, форматирование отчётов по ГОСТ, статистика оценок, карта кампуса, установка PWA и другое."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
</svelte:head>

<PageLayout>
	<div class="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
		<div class="absolute inset-0 opacity-[0.03] mix-blend-overlay" style="background-image: url('https://grainy-gradients.vercel.app/noise.svg');"></div>
		<div class="blob b-1"></div>
		<div class="blob b-2"></div>
		<div class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:60px_60px] [mask-image:radial-gradient(circle_at_50%_50%,black,transparent_80%)]"></div>
	</div>

	<Header />

	<main class="relative container mx-auto px-4 py-14 md:py-24">
		<header class="mb-8 md:mb-16" in:fade={{ duration: 1200 }}>
			<div class="flex items-end gap-4 overflow-hidden border-b border-white/20 pb-6 md:pb-12">
				<h1 class="font-unbounded text-4xl md:text-7xl lg:text-8xl text-white tracking-tighter leading-none">
					core.ysturasp
				</h1>
			</div>
			<p class="mt-8 text-xl md:text-3xl text-slate-500 max-w-2xl font-light">
				Все наши сервисы в одном месте
			</p>
		</header>

		<div class="flex flex-col gap-16 md:gap-32">
			
			<section>
				<div class="flex items-center gap-4 mb-8">
					<span class="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse"></span>
					<h2 class="font-unbounded text-xl text-slate-500 uppercase tracking-xl font-medium leading-none">хабы расписания</h2>
				</div>

				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
					{#each hubs as hub, i}
						<div 
							class="relative group bg-white/[0.02] border border-white/[0.05] rounded-[2.5rem] overflow-hidden backdrop-blur-[40px] transition-all duration-500 hover:border-white/10 hover:-translate-y-1 
							{hub.size === 'lg' ? 'col-span-2 lg:col-span-3 min-h-[300px] md:min-h-[400px]' : 'col-span-2 min-h-[300px] md:min-h-[350px]'}" 
							style="--theme-color: {hub.color}"
							on:mousemove={handleMouseMove}
							in:fly={{ y: 50, duration: 800, delay: i * 100, easing: quintOut }}
						>
							<div class="beam absolute inset-[-1px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>
							
							<div class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:24px_24px] pointer-events-none z-0"></div>

							<div class="flex flex-col justify-between h-full p-6 md:p-12 relative z-10">
								<div class="transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" style="color: {hub.color}">
									<svg class="w-10 h-10 md:w-12 md:h-12 opacity-60 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d={hub.icon} />
									</svg>
								</div>
								
								<div>
									<h2 class="font-unbounded text-xl md:text-3xl lg:text-4xl text-white uppercase leading-tight">{hub.name}</h2>
									<p class="text-slate-400 mt-2 text-xs md:text-base max-w-sm font-light leading-relaxed">{hub.desc}</p>
									
									<div class="grid grid-cols-2 gap-3 mt-6 md:mt-8">
										{#each hub.links as link}
											<a href={link.href} class="flex items-center justify-center p-3 md:p-4 bg-white/[0.03] border border-white/5 rounded-2xl text-white text-xs md:text-base font-medium transition-all hover:bg-white/[0.08] hover:border-current hover:-translate-y-0.5 group/link" style="color: {hub.color}">
												<span class="group-hover/link:text-white transition-colors">{link.name}</span>
											</a>
										{/each}
									</div>
								</div>
							</div>
							
							<div class="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 z-10" style="background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--theme-color), transparent 80%)"></div>
						</div>
					{/each}
				</div>
			</section>

			<section>
				<div class="flex items-center gap-4 mb-8">
					<span class="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse"></span>
					<h2 class="font-unbounded text-xl text-slate-500 uppercase tracking-xl font-medium leading-none">сервисы и инструменты</h2>
				</div>

				<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
					{#each tools as tool, i}
						<a 
							href={tool.link} 
							class="relative group bg-white/[0.02] border border-white/[0.05] rounded-[2rem] min-h-[180px] md:min-h-[220px] backdrop-blur-[40px] transition-all duration-500 hover:bg-white/[0.05] hover:border-white/10 hover:-translate-y-1 overflow-hidden" 
							style="--theme-color: {tool.color}"
							on:mousemove={handleMouseMove}
							in:fly={{ y: 40, duration: 800, delay: 500 + i * 50, easing: quintOut }}
						>
							<div class="flex flex-col justify-between h-full p-6 md:p-8 relative z-10">
								<div class="flex justify-between items-start">
									<div class="opacity-60 group-hover:opacity-100 transition-opacity" style="color: {tool.color}">
										<svg class="w-7 h-7 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={tool.icon} />
										</svg>
									</div>
									<div class="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shadow-[0_0_10px_currentColor] transition-transform group-hover:scale-125" style="background: {tool.color}; color: {tool.color}"></div>
								</div>
								
								<div>
									<h3 class="font-unbounded text-sm md:text-lg text-white leading-tight">{tool.name}</h3>
									<p class="text-slate-500 text-[0.65rem] md:text-sm mt-1 font-light leading-snug">{tool.desc}</p>
								</div>
							</div>
							<div class="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"></div>
							<div class="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-0 group-hover:opacity-[0.15] transition-opacity duration-500 z-10" style="background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), var(--theme-color), transparent 80%)"></div>
						</a>
					{/each}
				</div>
			</section>

		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 mt-20 md:mt-40 border-t border-white/5 pt-12">
			{#each [
				{ label: 'About Project', href: '/about' },
				{ label: 'Customer Care', href: '/support' },
				{ label: 'Open Source', href: 'https://github.com/ysturasp/ysturasp-svelte' },
				{ label: 'History', href: '/changelog' }
			] as item, i}
				<a href={item.href} class="flex flex-col gap-2 group">
					<span class="font-unbounded text-[0.6rem] text-slate-700 tracking-widest">0{i+1}</span>
					<span class="text-white font-medium group-hover:text-blue-500 transition-colors uppercase text-sm md:text-base">{item.label}</span>
				</a>
			{/each}
		</div>
	</main>

	<Footer />
</PageLayout>

<style>
	.font-unbounded {
		font-family: 'Unbounded', cursive;
	}

	.blob {
		position: absolute;
		border-radius: 50%;
		filter: blur(120px);
		opacity: 0.1;
		animation: blob-drift 30s infinite alternate linear;
		z-index: -1;
	}
	.b-1 { width: 60vw; height: 60vw; background: #3b82f6; top: -20%; left: -10%; }
	.b-2 { width: 50vw; height: 50vw; background: #8b5cf6; bottom: -10%; right: -10%; animation-delay: -10s; }

	@keyframes blob-drift {
		from { transform: translate(0, 0) scale(1); }
		to { transform: translate(100px, 50px) scale(1.2); }
	}

	.beam {
		mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		mask-composite: exclude;
		background: conic-gradient(from var(--angle, 0deg), transparent, var(--theme-color), transparent 30%);
		animation: rotate-beam 4s linear infinite;
	}

	@property --angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	@keyframes rotate-beam {
		from { --angle: 0deg; }
		to { --angle: 360deg; }
	}
</style>
