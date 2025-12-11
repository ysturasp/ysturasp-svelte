<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		openPayment: { docs: number };
	}>();

	export let remaining = 0;

	function calculatePrice(count: number): number {
		if (count >= 50) return 3000;
		if (count >= 20) return 1500;
		if (count >= 10) return 850;
		return 500;
	}

	function getPricePerFormat(count: number): number {
		return Math.round(calculatePrice(count) / count);
	}

	const plans = [
		{
			id: '5',
			name: 'starter',
			description: 'Подходит чтобы попробовать сервис или оформить пару отчётов',
			docs: 5,
			price: calculatePrice(5),
			perDoc: getPricePerFormat(5)
		},
		{
			id: '10',
			name: 'vip',
			description: 'Для контрольных, лабораторных и нескольких РГР за семестр',
			docs: 10,
			price: calculatePrice(10),
			perDoc: getPricePerFormat(10)
		},
		{
			id: '20',
			name: 'premium',
			description: 'Удобно, если часто сдаёшь отчёты в течение семестра',
			docs: 20,
			price: calculatePrice(20),
			perDoc: getPricePerFormat(20)
		},
		{
			id: '50',
			name: 'deluxe',
			description: 'Для долгого пользования и плотной учебной нагрузки',
			docs: 50,
			price: calculatePrice(50),
			perDoc: getPricePerFormat(50)
		}
	];

	function handleBuy(docs: number) {
		dispatch('openPayment', { docs });
	}
</script>

<section class="rounded-2xl bg-slate-800/80 p-4 md:p-6">
	<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div>
			<h3 class="text-lg font-semibold text-white md:text-2xl">Тарифы форматирования</h3>
			<p class="mt-1 text-sm text-slate-400 md:text-base">
				Выберите удобный пакет форматирований, пополните баланс и используйте их в любое
				время
			</p>
		</div>
		<div class="rounded-xl bg-slate-900/60 px-3 py-2 text-right text-xs text-slate-300 md:px-4">
			<div class="text-slate-400">Сейчас доступно</div>
			<div class="text-sm font-semibold text-white md:text-base">
				{remaining || 0} док.
			</div>
		</div>
	</div>

	<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
		{#each plans as plan}
			<div
				class="group relative flex flex-col justify-between rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 transition-all hover:border-blue-500/80 hover:bg-slate-900"
			>
				<div class="space-y-2">
					<div class="flex items-center justify-between gap-2">
						<h4 class="text-base font-semibold text-white md:text-lg">{plan.name}</h4>
						<div class="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
							{plan.docs} док.
						</div>
					</div>
					<p class="text-xs text-slate-400 md:text-sm">{plan.description}</p>
				</div>

				<div class="mt-4 flex items-end justify-between">
					<div>
						<div class="text-lg font-semibold text-white md:text-2xl">
							{plan.price} ₽
						</div>
						<div class="text-[11px] text-slate-500 md:text-xs">
							{plan.perDoc} ₽ за форматирование
						</div>
					</div>
					<button
						class="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white transition-all group-hover:shadow-lg hover:bg-blue-500 md:px-4 md:text-sm"
						on:click={() => handleBuy(plan.docs)}
					>
						Выбрать
					</button>
				</div>
			</div>
		{/each}
	</div>
</section>
