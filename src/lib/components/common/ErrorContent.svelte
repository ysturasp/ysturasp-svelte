<script>
	let { status = 404, message = '' } = $props();
</script>

<section
	class="flex flex-col-reverse gap-y-8 py-6 md:gap-y-12 md:py-8 lg:flex-row lg:items-center lg:justify-between lg:gap-x-8"
>
	<div class="flex max-w-full flex-col gap-y-3 md:max-w-[27rem]">
		<h1 class="text-3xl font-bold text-white md:text-4xl">
			👋🏻 {status === 404 ? 'Страница не найдена!' : 'Произошла ошибка!'}
		</h1>
		<p class="text-base text-slate-400 md:text-lg">{message}</p>
		<a
			href="/"
			class="mt-4 rounded-2xl bg-blue-700 p-2 text-white transition-all hover:bg-blue-600"
		>
			Вернуться на главную
		</a>
	</div>
	<div class="mt-4 flex justify-center md:mt-0 md:justify-end">
		<div class="loading-indicator"></div>
	</div>
</section>

<style>
	.loading-indicator {
		width: 320px;
		height: 320px;
		background: url('https://ustaliy.ru/wp-content/uploads/2020/04/orig-5.gif') no-repeat center
			center;
		background-size: cover;
		border-radius: 20%;
	}
</style>
