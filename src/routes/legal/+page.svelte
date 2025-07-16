<script>
  import Header from '$lib/components/layout/Header.svelte';
  import PageLayout from '$lib/components/layout/PageLayout.svelte';
</script>

<svelte:head>
  <title>Юридическая информация - ystuRASP</title>
  <meta name="description" content="Юридическая информация и документы сервиса ystuRASP">
</svelte:head>

<PageLayout>
  <Header />
  <main class="container mx-auto mt-5 md:mt-7 px-3 md:px-0">
    <section class="flex flex-col gap-y-8 py-6 md:py-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl md:text-4xl font-bold text-white mb-8">Юридическая информация</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/legal/terms" class="legal-card">
            <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all">
              <h2 class="text-xl font-semibold text-white mb-3">Условия использования</h2>
              <p class="text-slate-400">Правила использования сервиса, права и обязанности пользователей</p>
            </div>
          </a>

          <a href="/legal/privacy" class="legal-card">
            <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all">
              <h2 class="text-xl font-semibold text-white mb-3">Политика конфиденциальности</h2>
              <p class="text-slate-400">Информация о сборе, использовании и защите данных пользователей</p>
            </div>
          </a>

          <a href="/legal/license" class="legal-card">
            <div class="p-6 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all">
              <h2 class="text-xl font-semibold text-white mb-3">Лицензионное соглашение</h2>
              <p class="text-slate-400">Условия использования программного обеспечения и прав на интеллектуальную собственность</p>
            </div>
          </a>
        </div>

        <div class="mt-8 text-slate-400">
          <p>Последнее обновление: 16 марта 2024 года</p>
          <p class="mt-4">Если у вас есть вопросы относительно юридических документов, пожалуйста, свяжитесь с нами через <a href="/support" class="text-blue-400 hover:text-blue-300">форму обратной связи</a>.</p>
        </div>
      </div>
    </section>
  </main>
</PageLayout> 