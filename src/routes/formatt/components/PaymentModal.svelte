<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

	export let isOpen = false;
	export let remaining = 0;
	export let formatsCount = 10;

	const dispatch = createEventDispatcher();

	let isProcessing = false;

	function calculatePrice(count: number): number {
		if (import.meta.env.DEV && count === 1) return 10;
		if (count >= 50) return 3000;
		if (count >= 20) return 1500;
		if (count >= 10) return 850;
		return 500;
	}

	function getPricePerFormat(count: number): number {
		return Math.round(calculatePrice(count) / count);
	}

	const formatOptions = [
		{ id: 5, label: `5 форматирований · 500 ₽ (${getPricePerFormat(5)} ₽/шт)` },
		{ id: 10, label: `10 форматирований · 850 ₽ (${getPricePerFormat(10)} ₽/шт)` },
		{ id: 20, label: `20 форматирований · 1500 ₽ (${getPricePerFormat(20)} ₽/шт)` },
		{ id: 50, label: `50 форматирований · 3000 ₽ (${getPricePerFormat(50)} ₽/шт)` },
		...(import.meta.env.DEV ? [{ id: 1, label: `Тест · 10 ₽ (10 ₽/шт)` }] : [])
	];

	function canClose() {
		return !isProcessing;
	}

	function handleFormatSelect(event: CustomEvent<(typeof formatOptions)[0]>) {
		formatsCount = Number(event.detail.id);
	}

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
			dispatch('error', { message: 'Ошибка создания платежа. Попробуйте позже.' });
			isProcessing = false;
		}
	}
</script>

<BottomModal
	{isOpen}
	title="Покупка форматирований"
	subtitle={`Доступно форматирований: ${remaining}`}
	onClose={close}
	checkCanClose={canClose}
	contentClass="px-4 overflow-visible"
>
	<div class="space-y-4">
		<div class="rounded-lg bg-slate-700/50 p-4">
			<div class="text-sm text-slate-400">Выберите пакет</div>
			<div class="mt-3">
				<CustomSelect
					items={formatOptions}
					selectedId={formatsCount}
					width="100%"
					disabled={isProcessing}
					on:select={handleFormatSelect}
				/>
			</div>
		</div>

		<div class="rounded-lg bg-blue-500/10 p-4">
			<div class="text-sm text-slate-400">К оплате</div>
			<div class="text-2xl font-bold text-blue-400">{calculatePrice(formatsCount)} ₽</div>
			<div class="mt-1 text-xs text-slate-500">
				{getPricePerFormat(formatsCount)} ₽ за форматирование
			</div>
		</div>
	</div>

	<div slot="footer" class="flex gap-3">
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
</BottomModal>
