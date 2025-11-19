<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';

	export let isOpen = false;
	export let remaining = 0;

	const dispatch = createEventDispatcher();

	let isProcessing = false;

	let formatsCount = 10;
	const formatOptions = [
		{ id: 5, label: '5 форматирований · 500 ₽' },
		{ id: 10, label: '10 форматирований · 1000 ₽' },
		{ id: 20, label: '20 форматирований · 2000 ₽' },
		{ id: 50, label: '50 форматирований · 5000 ₽' }
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
	subtitle={`Осталось бесплатных форматирований: ${remaining}`}
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
			<div class="text-sm text-slate-400">Стоимость</div>
			<div class="text-2xl font-bold text-blue-400">{formatsCount * 100} ₽</div>
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
