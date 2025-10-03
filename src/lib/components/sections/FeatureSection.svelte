<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	let mounted = false;
	let cards: HTMLElement[] = [];

	const features = [
		{
			title: 'Расписание занятий',
			description:
				'Актуальное расписание с удобным интерфейсом и автоматическим распределением подгрупп на лабораторные занятия',
			link: '/rasp',
			linkText: 'Открыть расписание',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="calendar-shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.25" />
            </filter>
            <linearGradient id="calendar-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.1)" />
                <stop offset="100%" style="stop-color:rgba(59, 130, 246, 0.05)" />
            </linearGradient>
        </defs>

        <rect x="20" y="20" width="160" height="160" rx="12" fill="url(#calendar-gradient)"
            stroke="#3B82F6" stroke-width="2" filter="url(#calendar-shadow)" />

        <path class="header-panel" d="M20 32a12 12 0 0112-12h136a12 12 0 0112 12v28H20V32z"
            fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6" stroke-width="2" />

        <g class="weekdays" fill="#3B82F6" font-weight="bold">
            <text x="30" y="44" font-size="10">ПН</text>
            <text x="61" y="44" font-size="10">ВТ</text>
            <text x="92" y="44" font-size="10">СР</text>
            <text x="123" y="44" font-size="10">ЧТ</text>
            <text x="154" y="44" font-size="10">ПТ</text>
        </g>

        <g class="calendar-grid" stroke="#3B82F6" stroke-opacity="0.2">
            <path d="M50 60v110M85 60v110M120 60v110M155 60v110" />
            <path d="M20 90h160M20 125h160M20 160h160" />
        </g>

        <g class="lesson-blocks">
            <rect class="lesson-block" x="30" y="70" width="40" height="30" rx="6"
                fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" />
            <text x="35" y="88" fill="#3B82F6" font-size="8">Лекция</text>


            <rect class="lesson-block" x="92" y="110" width="50" height="40" rx="6"
                fill="rgba(239, 68, 68, 0.2)" stroke="#EF4444" />
            <text x="98" y="125" fill="#EF4444" font-size="8">Практика</text>


            <rect class="lesson-block" x="150" y="160" width="40" height="35" rx="6"
                fill="rgba(34, 197, 94, 0.2)" stroke="#22C55E" />
            <text x="157" y="180" fill="#22C55E" font-size="8">Лаб</text>
        </g>


        <line class="current-time" x1="20" y1="140" x2="180" y2="140" stroke="#3B82F6"
            stroke-width="2" stroke-dasharray="4 4" />


        <circle class="time-indicator" cx="90" cy="140" r="4" fill="#3B82F6">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
        </circle>
    </svg>`
		},
		{
			title: 'Статистика оценок',
			description: 'Анализ успеваемости, средние баллы и рейтинги предметов по институтам',
			link: '/stat',
			linkText: 'Посмотреть статистику',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="stat-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.1)" />
                <stop offset="100%" style="stop-color:rgba(147, 197, 253, 0.05)" />
            </linearGradient>
            <filter id="stat-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="average-line" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:#3B82F6" />
                <stop offset="100%" style="stop-color:#60A5FA" />
            </linearGradient>
        </defs>


        <rect x="20" y="20" width="160" height="160" rx="12" fill="url(#stat-gradient)"
            stroke="#3B82F6" stroke-width="2" />

        <g class="grid" stroke="#3B82F6" stroke-opacity="0.1">
            <path d="M40 40h120M40 70h120M40 100h120M40 130h120M40 160h120" />
            <path d="M40 40v120M70 40v120M100 40v120M130 40v120M160 40v120" />
        </g>

        <g class="grade-labels" fill="#94A3B8" font-size="12">
            <text x="30" y="165">2</text>
            <text x="30" y="125">3</text>
            <text x="30" y="85">4</text>
            <text x="30" y="45">5</text>
        </g>

        <g class="grade-bars">
            <rect class="grade-bar" x="60" y="160" width="20" height="0"
                fill="rgba(239, 68, 68, 0.3)" stroke="#EF4444">
                <animate attributeName="height" values="0;20;20;0" dur="6s" begin="0s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                <animate attributeName="y" values="160;140;140;160" dur="6s" begin="0s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </rect>

            <rect class="grade-bar" x="90" y="160" width="20" height="0"
                fill="rgba(234, 179, 8, 0.3)" stroke="#EAB308">
                <animate attributeName="height" values="0;40;40;0" dur="6s" begin="0.5s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                <animate attributeName="y" values="160;120;120;160" dur="6s" begin="0.5s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </rect>

            <rect class="grade-bar" x="120" y="160" width="20" height="0"
                fill="rgba(34, 197, 94, 0.3)" stroke="#22C55E">
                <animate attributeName="height" values="0;60;60;0" dur="6s" begin="1s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                <animate attributeName="y" values="160;100;100;160" dur="6s" begin="1s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </rect>

            <rect class="grade-bar" x="150" y="160" width="20" height="0"
                fill="rgba(59, 130, 246, 0.3)" stroke="#3B82F6">
                <animate attributeName="height" values="0;80;80;0" dur="6s" begin="1.5s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                <animate attributeName="y" values="160;80;80;160" dur="6s" begin="1.5s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </rect>
        </g>

        <g class="average-calculation" filter="url(#stat-glow)">

            <path class="average-line" d="M50 110 C70 110, 90 110, 170 110"
                stroke="url(#average-line)" stroke-width="2" stroke-dasharray="4 4">
                <animate attributeName="d" values="
                            M50 160 C70 160, 90 160, 170 160;
                            M50 110 C70 110, 90 110, 170 110;
                            M50 110 C70 110, 90 110, 170 110;
                            M50 160 C70 160, 90 160, 170 160
                        " dur="6s" repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </path>

            <circle class="average-point" cx="110" cy="110" r="4" fill="#60A5FA">
                <animate attributeName="cy" values="160;110;110;160" dur="6s"
                    repeatCount="indefinite" calcMode="spline"
                    keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
            </circle>

            <g class="average-text" font-size="14" fill="#60A5FA">
                <text x="100" y="95" text-anchor="middle" class="average-label">
                    Среднее:
                    <animate attributeName="y" values="145;95;95;145" dur="6s"
                        repeatCount="indefinite" calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                </text>
                <text x="100" y="115" text-anchor="middle" class="average-value">
                    <animate attributeName="textContent" values="2.0;3.5;3.8;2.0" dur="6s"
                        repeatCount="indefinite" />
                    <animate attributeName="y" values="165;115;115;165" dur="6s"
                        repeatCount="indefinite" calcMode="spline"
                        keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1" />
                </text>
            </g>
        </g>

        <g class="decorative-elements">
            <circle cx="40" cy="40" r="3" fill="#3B82F6" opacity="0.5">
                <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s"
                    repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="40" r="3" fill="#22C55E" opacity="0.5">
                <animate attributeName="r" values="3;5;3" dur="2s" begin="0.5s"
                    repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" begin="0.5s"
                    repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="160" r="3" fill="#EF4444" opacity="0.5">
                <animate attributeName="r" values="3;5;3" dur="2s" begin="1s"
                    repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" begin="1s"
                    repeatCount="indefinite" />
            </circle>
            <circle cx="160" cy="160" r="3" fill="#EAB308" opacity="0.5">
                <animate attributeName="r" values="3;5;3" dur="2s" begin="1.5s"
                    repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" begin="1.5s"
                    repeatCount="indefinite" />
            </circle>

            <g class="particles">
                <circle cx="50" cy="80" r="2" fill="#3B82F6">
                    <animate attributeName="cx" values="50;150;50" dur="4s"
                        repeatCount="indefinite" />
                    <animate attributeName="cy" values="80;120;80" dur="4s"
                        repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="4s"
                        repeatCount="indefinite" />
                </circle>
                <circle cx="150" cy="120" r="2" fill="#22C55E">
                    <animate attributeName="cx" values="150;50;150" dur="4s" begin="2s"
                        repeatCount="indefinite" />
                    <animate attributeName="cy" values="120;80;120" dur="4s" begin="2s"
                        repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="4s" begin="2s"
                        repeatCount="indefinite" />
                </circle>
            </g>
        </g>
    </svg>`
		},
		{
			title: 'Кампус ЯГТУ',
			description: 'Информация о корпусах, общежитиях и инфраструктуре университета',
			link: '/campus',
			linkText: 'Изучить кампус',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="building-shadow">
                <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2" />
            </filter>
            <linearGradient id="sky-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.1)" />
                <stop offset="100%" style="stop-color:rgba(59, 130, 246, 0.05)" />
            </linearGradient>
        </defs>

        <rect x="0" y="0" width="200" height="200" fill="url(#sky-gradient)" />

        <g class="main-building" filter="url(#building-shadow)">

            <path d="M40 180V60l60-40 60 40v120H40z" fill="rgba(59, 130, 246, 0.1)"
                stroke="#3B82F6" stroke-width="2" />

            <g class="columns" stroke="#3B82F6" stroke-width="2">
                <path d="M55 180V80" />
                <path d="M75 180V80" />
                <path d="M125 180V80" />
                <path d="M145 180V80" />
            </g>

            <g class="building-windows">
                <rect x="60" y="90" width="20" height="25" rx="2" class="building-window" />
                <rect x="120" y="90" width="20" height="25" rx="2" class="building-window" />
                <rect x="60" y="125" width="20" height="25" rx="2" class="building-window" />
                <rect x="120" y="125" width="20" height="25" rx="2" class="building-window" />
            </g>

            <path d="M100 20L30 60h140L100 20z" fill="rgba(59, 130, 246, 0.15)" stroke="#3B82F6"
                stroke-width="2" />

            <g class="flag">
                <path d="M100 10v-20" stroke="#3B82F6" stroke-width="2" />
                <path d="M100 -10l20 10-20 10" fill="rgba(239, 68, 68, 0.5)" stroke="#EF4444" />
            </g>
        </g>

        <g class="trees">
            <g class="tree" transform="translate(30, 170)">
                <circle r="15" fill="rgba(34, 197, 94, 0.3)" stroke="#22C55E" />
                <line x1="0" y1="15" x2="0" y2="30" stroke="#22C55E" stroke-width="2" />
            </g>
            <g class="tree" transform="translate(170, 170)">
                <circle r="15" fill="rgba(34, 197, 94, 0.3)" stroke="#22C55E" />
                <line x1="0" y1="15" x2="0" y2="30" stroke="#22C55E" stroke-width="2" />
            </g>
        </g>

        <g class="clouds">
            <path class="cloud"
                d="M20 50a10 10 0 0120 0 7 7 0 0114 0 10 10 0 01-20 0 7 7 0 01-14 0z"
                fill="rgba(255, 255, 255, 0.1)">
                <animateMotion path="M0 0h40" dur="10s" repeatCount="indefinite" />
            </path>
            <path class="cloud"
                d="M140 30a8 8 0 0116 0 5 5 0 0110 0 8 8 0 01-16 0 5 5 0 01-10 0z"
                fill="rgba(255, 255, 255, 0.1)">
                <animateMotion path="M0 0h30" dur="15s" repeatCount="indefinite" />
            </path>
        </g>
    </svg>`
		},
		{
			title: 'Управление данными',
			description: 'Экспорт и импорт ваших персональных настроек и данных',
			link: '/data',
			linkText: 'Управление данными',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <filter id="data-glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <g class="data-center">
            <g class="data-orbit">
                <circle cx="100" cy="100" r="45" stroke="#3B82F6" stroke-opacity="0.3"
                    stroke-dasharray="4 4" />
                <circle cx="100" cy="100" r="75" stroke="#3B82F6" stroke-opacity="0.3"
                    stroke-dasharray="4 4" />
            </g>

            <g class="rotating-elements">

                <g transform="translate(85, 40)">
                    <rect width="30" height="40" rx="4" fill="rgba(59, 130, 246, 0.2)"
                        stroke="#3B82F6" />
                    <path d="M5 10h20M5 20h20M5 30h10" stroke="#3B82F6" stroke-width="1" />
                </g>

                <g transform="translate(140, 100)">
                    <path
                        d="M0 0c0 5.5-9 10-20 10s-20-4.5-20-10v-20c0-5.5 9-10 20-10s20 4.5 20 10v20z"
                        fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" />
                    <path d="M-40 -10c11 0 20-4.5 20-10M-40 0c11 0 20-4.5 20-10"
                        stroke="#3B82F6" />
                </g>

                <g transform="translate(60, 120)">
                    <path
                        d="M0 0a15 15 0 0130 0 10 10 0 0020 0 15 15 0 01-30 0 10 10 0 00-20 0z"
                        fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" />
                </g>
            </g>
        </g>

        <g class="data-streams" filter="url(#data-glow)">

        </g>

        <g class="data-particles">
            <circle cx="100" cy="70" r="3" fill="#3B82F6">
                <animate attributeName="cy" values="70;130;70" dur="3s"
                    repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="100" r="3" fill="#3B82F6">
                <animate attributeName="cx" values="70;130;70" dur="3s"
                    repeatCount="indefinite" />
            </circle>
        </g>
    </svg>`
		},
		{
			title: 'Мобильное приложение',
			description: 'Установите ysturasp как приложение на ваш телефон для быстрого доступа',
			link: '/installapp',
			linkText: 'Установить приложение',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="phone-shadow">
            <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.2" />
          </filter>
          <linearGradient id="screen-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" style="stop-color:rgba(59, 130, 246, 0.05)" />
          </linearGradient>
        </defs>
        <g class="phone" filter="url(#phone-shadow)">
          <rect x="50" y="20" width="100" height="160" rx="20" stroke="#3B82F6" stroke-width="2" fill="rgba(59, 130, 246, 0.05)" />
          <rect x="55" y="25" width="90" height="150" rx="16" fill="url(#screen-gradient)" />
          <g class="screen-content">
            <rect x="60" y="35" width="80" height="15" rx="4" fill="rgba(59, 130, 246, 0.2)" />
            <g transform="translate(0, 0)">
              <rect x="65" y="60" width="70" height="10" rx="2" fill="rgba(59, 130, 246, 0.15)" />
              <rect x="65" y="80" width="50" height="40" rx="4" fill="rgba(239, 68, 68, 0.2)" />
              <rect x="65" y="130" width="70" height="8" rx="2" fill="rgba(59, 130, 246, 0.15)" />
              <rect x="65" y="145" width="60" height="8" rx="2" fill="rgba(59, 130, 246, 0.15)" />
            </g>
          </g>
        </g>
      </svg>`
		},
		{
			title: 'О проекте',
			description: 'История развития проекта, новости и обновления',
			link: '/about',
			linkText: 'Узнать больше',
			svg: `<svg class="vector-graphic" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="timeline-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx="100" cy="100" r="80" fill="rgba(59, 130, 246, 0.05)" stroke="#3B82F6" stroke-width="2" />

        <g class="info-blocks">
            <g transform="translate(45, 50)">
                <rect width="40" height="15" rx="4" fill="rgba(59, 130, 246, 0.2)" />
                <text x="8" y="11" fill="#3B82F6" font-size="8">2024</text>
            </g>

            <g transform="translate(115, 40)">
                <rect width="40" height="15" rx="4" fill="rgba(34, 197, 94, 0.2)" />
                <text x="8" y="11" fill="#22C55E" font-size="8">2025</text>
            </g>
        </g>

        <g class="timeline" filter="url(#timeline-glow)">
          <path d="M40 100h120" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4 4" />
          <g class="timeline-points">
            <circle class="timeline-point" cx="60" cy="100" r="8" fill="rgba(59, 130, 246, 0.3)" stroke="#3B82F6" />
            <circle class="timeline-point" cx="100" cy="100" r="8" fill="rgba(239, 68, 68, 0.3)" stroke="#EF4444" />
            <circle class="timeline-point" cx="140" cy="100" r="8" fill="rgba(34, 197, 94, 0.3)" stroke="#22C55E" />
          </g>
        </g>
      </svg>`
		}
	];

	function handleMouseMove(e: MouseEvent, card: HTMLElement) {
		const rect = card.getBoundingClientRect();
		card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
		card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
	}

	onMount(() => {
		mounted = true;
	});
</script>

<section class="py-6 md:py-12">
	<h2 class="hero-title mb-12 text-center text-3xl font-bold">Основные возможности</h2>
	{#if mounted}
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" id="features-grid">
			{#each features as feature, i}
				<div
					class="feature-card rounded-2xl"
					transition:fly={{ y: 20, duration: 500, delay: i * 100 }}
					bind:this={cards[i]}
					on:mousemove={(e) => handleMouseMove(e, cards[i])}
					role="button"
					tabindex="0"
				>
					<div class="card-content">
						<div class="vector-container">
							{@html feature.svg}
							<div class="vector-overlay"></div>
						</div>
						<div class="card-body">
							<h3 class="card-title">{feature.title}</h3>
							<p class="card-description">{feature.description}</p>
							<a href={feature.link} class="feature-link">{feature.linkText}</a>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</section>

<style>
	.feature-card {
		background: rgba(30, 41, 59, 0.8);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
		min-height: 400px;
		border-radius: 20px;
		opacity: 1;
	}

	.feature-card .card-content {
		position: relative;
		z-index: 3;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.feature-card .vector-container {
		height: 300px;
		width: 100%;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
		border-radius: 1rem 1rem 0 0;
	}

	:global(.feature-card .vector-graphic) {
		width: 90%;
		height: 90%;
	}

	:global(.feature-card .vector-graphic path),
	:global(.feature-card .vector-graphic circle),
	:global(.feature-card .vector-graphic rect) {
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: draw 2s ease forwards;
	}

	:global(.feature-card .vector-graphic .calendar-grid) {
		stroke-dasharray: 4;
		animation: dash 30s linear infinite;
	}

	.card-body {
		padding: 1.5rem;
	}

	.card-title {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 0.75rem;
		color: #fff;
	}

	.card-description {
		color: #94a3b8;
		margin-bottom: 1rem;
		line-height: 1.5;
	}

	.feature-link {
		color: #3b82f6;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s;
	}

	.feature-link:hover {
		color: #60a5fa;
	}

	@keyframes draw {
		to {
			stroke-dashoffset: 0;
		}
	}

	@keyframes dash {
		to {
			stroke-dashoffset: 1000;
		}
	}

	:global(.building-window) {
		fill: rgba(59, 130, 246, 0.2);
		stroke: #3b82f6;
	}

	.vector-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: radial-gradient(
			circle at var(--mouse-x, 50%) var(--mouse-y, 50%),
			rgba(59, 130, 246, 0.1) 0%,
			transparent 100%
		);
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.3s;
	}

	.feature-card:hover .vector-overlay {
		opacity: 1;
	}
</style>
