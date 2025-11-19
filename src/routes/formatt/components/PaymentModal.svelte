<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let isOpen = false;
	export let remaining = 0;

	const dispatch = createEventDispatcher();

	let isProcessing = false;
	let formatsCount = 10;

	function close() {
		if (!isProcessing) {
			dispatch('close');
		}
	}

	async function handlePayment() {
		isProcessing = true;
		try {
			const response = await fetch('/api/payment/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ formatsCount })
			});

			if (!response.ok) {
				throw new Error('Ошибка создания платежа');
			}

			const data = await response.json();

			if (data.paymentId) {
				try {
					window.localStorage.setItem('lastPaymentId', data.paymentId);
				} catch (storageError) {
					console.warn('Не удалось сохранить идентификатор платежа:', storageError);
				}
			}

			if (data.confirmationUrl) {
				window.location.href = data.confirmationUrl;
			}
		} catch (error) {
			console.error('Ошибка платежа:', error);
			alert('Ошибка создания платежа. Попробуйте позже.');
			isProcessing = false;
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		on:click={close}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && close()}
	>
		<div
			class="w-full max-w-md rounded-2xl bg-slate-800 p-6 shadow-xl"
			on:click|stopPropagation
		>
			<div class="mb-4 flex items-center justify-between">
				<h3 class="text-xl font-semibold text-white">Покупка форматирований</h3>
				<button
					on:click={close}
					class="text-slate-400 transition-colors hover:text-white"
					disabled={isProcessing}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="mb-6 space-y-4">
				<div class="rounded-lg bg-slate-700/50 p-4">
					<div class="mb-2 text-sm text-slate-400">
						Осталось бесплатных форматирований
					</div>
					<div class="text-2xl font-bold text-white">{remaining}</div>
				</div>

				<div>
					<label class="mb-2 block text-sm font-medium text-white">
						Количество форматирований
					</label>
					<select
						bind:value={formatsCount}
						disabled={isProcessing}
						class="w-full rounded-lg bg-slate-700 px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
					>
						<option value={5}>5 форматирований - 500 ₽</option>
						<option value={10}>10 форматирований - 1000 ₽</option>
						<option value={20}>20 форматирований - 2000 ₽</option>
						<option value={50}>50 форматирований - 5000 ₽</option>
					</select>
				</div>

				<div class="rounded-lg bg-blue-500/10 p-4">
					<div class="text-sm text-slate-400">Стоимость</div>
					<div class="text-2xl font-bold text-blue-400">{formatsCount * 100} ₽</div>
				</div>
			</div>

			<div class="flex gap-3">
				<button
					on:click={close}
					disabled={isProcessing}
					class="flex-1 rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
				>
					Отмена
				</button>
				<button
					on:click={handlePayment}
					disabled={isProcessing}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{isProcessing ? 'Обработка...' : 'Оплатить'}
				</button>
			</div>
		</div>
	</div>
{/if}
