<script>
  let { status = 404, message = '' } = $props();
</script>

<section class="flex flex-col-reverse gap-y-8 md:gap-y-12 py-6 md:py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-x-8">
  <div class="flex flex-col gap-y-3 max-w-full md:max-w-[27rem]">
    <h1 class="text-3xl md:text-4xl font-bold text-white">
      👋🏻 {status === 404 ? 'Страница не найдена!' : 'Произошла ошибка!'}
    </h1>
    <p class="text-base md:text-lg text-slate-400">{message}</p>
    <a href="/" class="mt-4 p-2 bg-blue-700 text-white rounded-2xl hover:bg-blue-600 transition-all">
      Вернуться на главную
    </a>
  </div>
  <div class="flex justify-center md:justify-end mt-4 md:mt-0">
    <div class="loading-indicator"></div>
  </div>
</section>

<style>
  .loading-indicator {
    width: 320px;
    height: 320px;
    background: url('https://ustaliy.ru/wp-content/uploads/2020/04/orig-5.gif') no-repeat center center;
    background-size: cover;
    border-radius: 20%;
  }
</style> 