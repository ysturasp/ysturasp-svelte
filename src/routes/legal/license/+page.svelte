<script>
	import Header from '$lib/components/layout/Header.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
	import LegalNavigation from '$lib/components/layout/LegalNavigation.svelte';
</script>

<svelte:head>
	<title>Лицензионное соглашение - ystuRASP</title>
	<meta
		name="description"
		content="Лицензионное соглашение сервиса ystuRASP - условия использования программного обеспечения"
	/>
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="flex flex-col gap-y-8 py-6 md:py-8">
			<div class="mx-auto w-full max-w-4xl">
				<h1 class="mb-8 text-3xl font-bold break-words text-white md:text-4xl">
					Лицензионное соглашение
				</h1>

				<div class="space-y-6 break-words text-slate-400">
					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">1. Определения</h2>
						<div class="space-y-4">
							<p>
								1.1. В настоящем Лицензионном соглашении (далее — «Соглашение»)
								используются следующие термины:
							</p>

							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>
									«Сервис» — программное обеспечение ystuRASP, включая все его
									компоненты, исходный код, документацию и обновления
								</li>
								<li>«Пользователь» — физическое лицо, использующее Сервис</li>
								<li>«Лицензиар» — правообладатель Сервиса</li>
								<li>
									«Контент» — любые данные, информация и материалы, доступные
									через Сервис
								</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							2. Предмет соглашения
						</h2>
						<div class="space-y-4">
							<p>
								2.1. Лицензиар предоставляет Пользователю неисключительную,
								бесплатную, действующую по всему миру лицензию на использование
								Сервиса в соответствии с условиями настоящего Соглашения.
							</p>

							<p>2.2. Лицензия включает право:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Использовать Сервис по прямому назначению</li>
								<li>Получать доступ к функциям Сервиса</li>
								<li>Создавать резервные копии данных</li>
								<li>Получать обновления Сервиса</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							3. Интеллектуальная собственность
						</h2>
						<div class="space-y-4">
							<p>
								3.1. Сервис, включая весь контент, является объектом авторского
								права и охраняется законодательством об интеллектуальной
								собственности.
							</p>

							<p>3.2. Пользователю запрещается:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>
									Модифицировать, декомпилировать или изменять исходный код
									Сервиса
								</li>
								<li>Создавать производные продукты на основе Сервиса</li>
								<li>Удалять или изменять уведомления об авторских правах</li>
								<li>Использовать Сервис для создания конкурирующего продукта</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							4. Условия использования
						</h2>
						<div class="space-y-4">
							<p>4.1. При использовании Сервиса Пользователь обязуется:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Соблюдать все применимые законы и правила</li>
								<li>Не нарушать права третьих лиц</li>
								<li>Не использовать Сервис для незаконных целей</li>
								<li>Не пытаться получить несанкционированный доступ к Сервису</li>
							</ul>

							<p>4.2. Пользователь несет ответственность за:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Сохранность своих данных доступа</li>
								<li>Все действия, совершенные через его учетную запись</li>
								<li>Соблюдение конфиденциальности информации</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							5. Ограничение ответственности
						</h2>
						<div class="space-y-4">
							<p>
								5.1. Сервис предоставляется на условиях «как есть» без каких-либо
								гарантий.
							</p>

							<p>5.2. Лицензиар не гарантирует:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Отсутствие ошибок в работе Сервиса</li>
								<li>Непрерывную работу Сервиса</li>
								<li>Соответствие Сервиса конкретным целям Пользователя</li>
								<li>
									Совместимость со всеми устройствами и программным обеспечением
								</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							6. Обновления и изменения
						</h2>
						<div class="space-y-4">
							<p>6.1. Лицензиар имеет право:</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Выпускать обновления Сервиса</li>
								<li>Изменять функциональность Сервиса</li>
								<li>Модифицировать или прекращать работу отдельных функций</li>
								<li>
									Изменять условия настоящего Соглашения в любое время без
									предварительного уведомления
								</li>
							</ul>

							<p>
								6.2. Актуальная версия Соглашения всегда доступна на сайте Сервиса.
								Продолжение использования Сервиса после изменений означает согласие
								с новыми условиями.
							</p>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">
							7. Срок действия и прекращение
						</h2>
						<div class="space-y-4">
							<p>
								7.1. Настоящее Соглашение действует с момента начала использования
								Сервиса до его прекращения.
							</p>

							<p>
								7.2. Лицензиар имеет право прекратить действие Соглашения в случае:
							</p>
							<ul class="ml-4 list-inside list-disc space-y-2">
								<li>Нарушения Пользователем условий Соглашения</li>
								<li>Прекращения работы Сервиса</li>
								<li>По требованию законодательства</li>
							</ul>
						</div>
					</div>

					<div class="rounded-2xl bg-slate-800 p-6">
						<h2 class="mb-4 text-2xl font-semibold text-white">8. Применимое право</h2>
						<div class="space-y-4">
							<p>
								8.1. Настоящее Соглашение регулируется законодательством Российской
								Федерации.
							</p>

							<p>
								8.2. Все споры, возникающие из настоящего Соглашения, подлежат
								разрешению в соответствии с законодательством Российской Федерации.
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
	<LegalNavigation currentPage="license" />
</PageLayout>
