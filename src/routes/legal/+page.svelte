<script>
	import Header from '$lib/components/layout/Header.svelte';
	import PageLayout from '$lib/components/layout/PageLayout.svelte';
</script>

<svelte:head>
	<title>Юридическая информация - ystuRASP</title>
	<meta name="description" content="Юридическая информация и документы сервиса ystuRASP" />
</svelte:head>

<PageLayout>
	<Header />
	<main class="container mx-auto mt-5 px-3 md:mt-7 md:px-0">
		<section class="flex flex-col gap-y-8 py-6 md:py-8">
			<div class="mx-auto max-w-4xl">
				<h1 class="mb-8 text-3xl font-bold text-white md:text-4xl">
					Юридическая информация
				</h1>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<a href="/legal/terms" class="legal-card">
						<div
							class="rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-blue-500"
						>
							<h2 class="mb-3 text-xl font-semibold text-white">
								Условия использования
							</h2>
							<p class="text-slate-400">
								Правила использования сервиса, права и обязанности пользователей
							</p>
						</div>
					</a>

					<a href="/legal/privacy" class="legal-card">
						<div
							class="rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-blue-500"
						>
							<h2 class="mb-3 text-xl font-semibold text-white">
								Политика конфиденциальности
							</h2>
							<p class="text-slate-400">
								Информация о сборе, использовании и защите данных пользователей
							</p>
						</div>
					</a>

					<a href="/legal/license" class="legal-card">
						<div
							class="rounded-2xl border border-slate-700 bg-slate-800 p-6 transition-all hover:border-blue-500"
						>
							<h2 class="mb-3 text-xl font-semibold text-white">
								Лицензионное соглашение
							</h2>
							<p class="text-slate-400">
								Условия использования программного обеспечения и прав на
								интеллектуальную собственность
							</p>
						</div>
					</a>
				</div>

				<div class="mt-8 text-slate-400">
					<p>Последнее обновление: 27 октября 2025 года</p>
					<p class="mt-2">
						Если у вас есть вопросы относительно юридических документов, пожалуйста,
						свяжитесь с нами через <a
							href="/support"
							class="text-blue-400 hover:text-blue-300">форму обратной связи</a
						>.
					</p>
				</div>
			</div>
		</section>
	</main>
</PageLayout>
