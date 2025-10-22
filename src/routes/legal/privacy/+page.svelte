<script>
	import Header from '$lib/components/layout/Header.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import LegalNavigation from '$lib/components/layout/LegalNavigation.svelte';
</script>

<svelte:head>
	<title>Политика конфиденциальности - ystuRASP</title>
	<meta
		name="description"
		content="Политика конфиденциальности сервиса ystuRASP - как мы защищаем ваши данные"
	/>
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="flex flex-col gap-y-8 py-6 md:py-8">
			<div class="mx-auto w-full max-w-4xl">
				<h1 class="mb-8 text-3xl font-bold break-words text-white md:text-4xl">
					Политика конфиденциальности
				</h1>

				<div class="space-y-6 break-words text-slate-400">
					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">1. Введение</h2>
						<div class="space-y-4">
							<p>
								1.1. Настоящая Политика конфиденциальности (далее — «Политика»)
								описывает, как ystuRASP (далее — «Сервис», «мы», «наш») собирает,
								использует и защищает информацию о пользователях.
							</p>

							<p>
								1.2. Используя Сервис, вы соглашаетесь с условиями данной Политики и
								даете согласие на обработку ваших персональных данных в соответствии
								с ней.
							</p>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							2. Собираемая информация
						</h2>
						<div class="space-y-4">
							<p>2.1. Мы собираем следующие типы информации:</p>

							<h3 class="mt-4 mb-2 text-xl font-semibold text-white">
								2.1.1. Информация, предоставляемая пользователем:
							</h3>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Выбранная группа или институт</li>
								<li>Настройки отображения расписания</li>
								<li>Пользовательские настройки интерфейса</li>
								<li>Скрытые предметы и настройки подгрупп</li>
							</ul>

							<h3 class="mt-4 mb-2 text-xl font-semibold text-white">
								2.1.2. Автоматически собираемая информация:
							</h3>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>IP-адрес</li>
								<li>Тип браузера и устройства</li>
								<li>Время доступа и посещенные страницы</li>
								<li>Статистика использования функций</li>
								<li>
									Данные, собираемые сервисами аналитики (Яндекс.Метрика, Google
									Analytics и др.)
								</li>
							</ul>

							<h3 class="mt-4 mb-2 text-xl font-semibold text-white">
								2.1.3. Данные локального хранилища:
							</h3>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Кэшированные данные расписания</li>
								<li>Пользовательские настройки</li>
								<li>Токены для обмена настройками</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							3. Использование информации
						</h2>
						<div class="space-y-4">
							<p>3.1. Мы используем собранную информацию для:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Предоставления доступа к расписанию и статистике</li>
								<li>Сохранения пользовательских настроек</li>
								<li>Улучшения работы Сервиса</li>
								<li>Анализа использования Сервиса</li>
								<li>Обеспечения безопасности</li>
							</ul>

							<p>
								3.2. Мы можем передавать данные третьим лицам в следующих случаях:
							</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Для улучшения работы Сервиса</li>
								<li>
									Для анализа использования Сервиса через сервисы веб-аналитики
								</li>
								<li>При получении согласия пользователя</li>
								<li>В случаях, предусмотренных законодательством</li>
								<li>Для защиты прав и безопасности</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							4. Хранение и защита данных
						</h2>
						<div class="space-y-4">
							<p>4.1. Мы принимаем следующие меры для защиты данных:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Использование защищенного протокола HTTPS</li>
								<li>Шифрование чувствительных данных</li>
								<li>Регулярное обновление систем безопасности</li>
								<li>Ограничение доступа к данным</li>
							</ul>

							<p>4.2. Данные хранятся:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>В локальном хранилище браузера пользователя</li>
								<li>В зашифрованном виде на серверах Сервиса</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							5. Файлы cookie и аналитика
						</h2>
						<div class="space-y-4">
							<p>5.1. Мы используем файлы cookie и аналогичные технологии для:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Сохранения пользовательских настроек</li>
								<li>Анализа использования Сервиса</li>
								<li>Улучшения производительности</li>
								<li>Обеспечения безопасности</li>
							</ul>

							<p>
								5.2. Пользователь может отключить файлы cookie в настройках
								браузера, но это может ограничить функциональность Сервиса.
							</p>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							6. Права пользователей
						</h2>
						<div class="space-y-4">
							<p>6.1. Пользователи могут:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Получать общую информацию об обработке их данных</li>
								<li>Прекратить использование Сервиса</li>
								<li>Настраивать параметры файлов cookie в своем браузере</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							7. Изменения в политике конфиденциальности
						</h2>
						<div class="space-y-4">
							<p>
								7.1. Мы оставляем за собой право изменять данную Политику в любое
								время без предварительного уведомления.
							</p>

							<p>7.2. Актуальная версия Политики всегда доступна на сайте Сервиса.</p>

							<p>
								7.3. Продолжение использования Сервиса после изменения Политики
								означает согласие с новыми условиями.
							</p>
						</div>
					</div>

					<div class="mt-8 mb-20 text-slate-300 md:mb-8">
						<p>Дата последнего обновления: 16 марта 2024 года</p>
					</div>
				</div>
			</div>
		</section>
	</main>
	<LegalNavigation currentPage="privacy" />
</PageLayout>
