<script lang="ts">
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import NotificationsContainer from '$lib/components/notifications/NotificationsContainer.svelte';
</script>

<svelte:head>
	<title>Установка приложения ysturasp | Как установить PWA приложение</title>
	<meta
		name="description"
		content="Инструкция по установке PWA приложения ysturasp. Пошаговое руководство для установки на iOS и Android."
	/>
	<meta
		name="keywords"
		content="установка PWA ysturasp, PWA приложение ysturasp, как установить приложение ysturasp, ysturasp мобильное приложение"
	/>
	<meta
		property="og:title"
		content="Установка приложения ysturasp | Как установить PWA приложение"
	/>
	<meta
		property="og:description"
		content="Инструкция по установке PWA приложения ysturasp. Пошаговое руководство для установки на iOS и Android."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="ru_RU" />
</svelte:head>

<PageLayout>
	<Header />

	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="mt-8 rounded-2xl bg-slate-800 p-4 sm:p-6">
			<h1 class="mb-4 text-2xl font-bold text-white md:text-3xl">
				📱 Установка приложения ysturasp
			</h1>

			<div class="mb-4 rounded-lg bg-blue-900/50 p-4">
				<div class="flex items-start gap-3">
					<svg
						class="my-auto h-6 w-6 flex-shrink-0 text-blue-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<p class="text-blue-200">
						PWA (Progressive Web App) - это современный способ установки веб-приложений
						на ваше устройство. После установки вы сможете использовать ysturasp даже
						без интернета!
					</p>
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="rounded-xl bg-slate-900 p-4">
					<div class="mb-4 flex items-center gap-2">
						<svg class="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"
							/>
						</svg>
						<h2 class="text-xl font-semibold text-white">Установка на iOS и macOS</h2>
					</div>

					<ol class="list-decimal space-y-4 pl-6 text-gray-300">
						<li>Откройте ysturasp в Safari</li>
						<li>Нажмите на кнопку "Поделиться" (квадрат со стрелкой)</li>
						<li>Прокрутите вниз и выберите "На экран «Домой»"</li>
						<li>Нажмите "Добавить" в правом верхнем углу</li>
					</ol>
				</div>

				<div class="rounded-xl bg-slate-900 p-4">
					<div class="mb-4 flex items-center gap-2">
						<svg
							class="h-10 w-10 text-green-400"
							viewBox="0 0 32 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								fill-rule="evenodd"
								clip-rule="evenodd"
								d="M12.5915 3.88444C13.6002 3.32107 14.7626 3 16 3C17.2374 3 18.3998 3.32107 19.4085 3.88444L20.1464 3.14645C20.3417 2.95118 20.6583 2.95118 20.8536 3.14645C21.0488 3.34171 21.0488 3.65829 20.8536 3.85355L20.2612 4.44595C21.9266 5.72558 23 7.73743 23 10H9C9 7.73743 10.0734 5.72558 11.7388 4.44595L11.1464 3.85355C10.9512 3.65829 10.9512 3.34171 11.1464 3.14645C11.3417 2.95118 11.6583 2.95118 11.8536 3.14645L12.5915 3.88444ZM14 7C14 7.55228 13.5523 8 13 8C12.4477 8 12 7.55228 12 7C12 6.44772 12.4477 6 13 6C13.5523 6 14 6.44772 14 7ZM19 8C19.5523 8 20 7.55228 20 7C20 6.44772 19.5523 6 19 6C18.4477 6 18 6.44772 18 7C18 7.55228 18.4477 8 19 8Z"
								fill="#87C527"
							/>
							<path
								d="M5 12.5C5 11.6716 5.67157 11 6.5 11C7.32843 11 8 11.6716 8 12.5V18.5C8 19.3284 7.32843 20 6.5 20C5.67157 20 5 19.3284 5 18.5V12.5Z"
								fill="#87C527"
							/>
							<path
								d="M12 24V27.5C12 28.3284 12.6716 29 13.5 29C14.3284 29 15 28.3284 15 27.5V24H17V27.5C17 28.3284 17.6716 29 18.5 29C19.3284 29 20 28.3284 20 27.5V24H21C22.1046 24 23 23.1046 23 22V11H9V22C9 23.1046 9.89543 24 11 24H12Z"
								fill="#87C527"
							/>
							<path
								d="M24 12.5C24 11.6716 24.6716 11 25.5 11C26.3284 11 27 11.6716 27 12.5V18.5C27 19.3284 26.3284 20 25.5 20C24.6716 20 24 19.3284 24 18.5V12.5Z"
								fill="#87C527"
							/>
						</svg>
						<h2 class="text-xl font-semibold text-white">Установка на Android</h2>
					</div>

					<ol class="list-decimal space-y-4 pl-6 text-gray-300">
						<li>Откройте ysturasp в Chrome</li>
						<li>Дождитесь появления баннера "Установить приложение"</li>
						<li>Нажмите "Установить"</li>
						<li>Подтвердите установку</li>
					</ol>
				</div>
			</div>

			<div class="mt-4 rounded-lg bg-green-900/50 p-4">
				<div class="flex items-start gap-3">
					<svg
						class="h-6 w-6 flex-shrink-0 text-green-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div class="space-y-2 text-green-200">
						<p>После установки вы получите:</p>
						<ul class="list-disc">
							<li>Полноценное веб-приложение, не отличимое от обычного</li>
							<li>Быстрый доступ к расписанию через иконку на главном экране</li>
							<li>Работу приложения без интернета</li>
							<li>Автоматические обновления</li>
							<li>Уведомления о важных изменениях</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	</main>

	<Footer />
	<NotificationsContainer />
</PageLayout>
