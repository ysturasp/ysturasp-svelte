<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import { notifications } from '$lib/stores/notifications';

	const dispatch = createEventDispatcher();

	interface Payment {
		id: string;
		paymentId: string;
		amount: number;
		currency: string;
		status: string;
		formatsCount: number;
		createdAt: string;
		updatedAt: string;
	}

	interface RefundCheck {
		can: boolean;
		reason?: string;
		usedCount?: number;
		purchasedCount?: number;
	}

	let payments: Payment[] = [];
	let isLoading = false;
	let error = '';
	let isLoaded = false;
	let refundModalOpen = false;
	let selectedPayment: Payment | null = null;
	let refundCheck: RefundCheck | null = null;
	let isCheckingRefund = false;
	let isProcessingRefund = false;

	function getStatusText(status: string): string {
		const statusMap: Record<string, string> = {
			pending: 'Ожидает оплаты',
			succeeded: 'Оплачено',
			canceled: 'Отменено',
			waiting_for_capture: 'Ожидает подтверждения',
			refunded: 'Возвращено'
		};
		return statusMap[status] || status;
	}

	function getStatusColor(status: string): string {
		const colorMap: Record<string, string> = {
			pending: 'text-yellow-400',
			succeeded: 'text-green-400',
			canceled: 'text-red-400',
			waiting_for_capture: 'text-blue-400',
			refunded: 'text-slate-400'
		};
		return colorMap[status] || 'text-slate-400';
	}

	async function loadPayments() {
		if (!$auth.authenticated || isLoading || isLoaded) {
			if (!$auth.authenticated) {
				isLoading = false;
			}
			return;
		}

		try {
			isLoading = true;
			error = '';
			const response = await fetch('/api/payment/history');
			if (!response.ok) {
				throw new Error('Ошибка при загрузке истории');
			}
			const data = await response.json();
			payments = data.payments || [];
			isLoaded = true;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка при загрузке платежей';
		} finally {
			isLoading = false;
		}
	}

	async function checkRefund(payment: Payment) {
		try {
			isCheckingRefund = true;
			const response = await fetch(`/api/payment/check-refund?paymentId=${payment.id}`);
			if (!response.ok) {
				throw new Error('Ошибка при проверке возможности возврата');
			}
			const data = await response.json();
			refundCheck = data;
			selectedPayment = payment;
			refundModalOpen = true;
		} catch (err) {
			notifications.add(
				err instanceof Error ? err.message : 'Ошибка при проверке возможности возврата',
				'error'
			);
		} finally {
			isCheckingRefund = false;
		}
	}

	async function processRefund() {
		if (!selectedPayment) return;

		try {
			isProcessingRefund = true;
			const response = await fetch('/api/payment/refund', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paymentId: selectedPayment.id })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Ошибка при выполнении возврата');
			}

			notifications.add('Возврат успешно выполнен', 'success');
			refundModalOpen = false;
			selectedPayment = null;
			refundCheck = null;
			isLoaded = false;
			await loadPayments();
			dispatch('refund-success');
		} catch (err) {
			notifications.add(
				err instanceof Error ? err.message : 'Ошибка при выполнении возврата',
				'error'
			);
		} finally {
			isProcessingRefund = false;
		}
	}

	function closeRefundModal() {
		if (!isProcessingRefund) {
			refundModalOpen = false;
			selectedPayment = null;
			refundCheck = null;
		}
	}

	$: if (!$auth.loading && $auth.authenticated && !isLoaded && !isLoading) {
		loadPayments();
	}
</script>

<div>
	{#if isLoading}
		<div class="flex justify-center py-8 text-slate-400">Загрузка...</div>
	{:else if error}
		<div class="rounded-lg bg-red-500/10 p-4 text-red-400">
			{error}
		</div>
	{:else if payments.length === 0}
		<div class="flex justify-center py-8 text-slate-400">У вас пока нет платежей</div>
	{:else}
		<div class="space-y-3">
			{#each payments as payment}
				<div
					class="flex items-center justify-between border-b border-slate-700 pb-3 last:border-0"
				>
					<div class="flex-1">
						<div class="flex items-center gap-3">
							<span class="font-medium text-white">
								{payment.formatsCount} форматирований
							</span>
							<span class={getStatusColor(payment.status)}>
								{getStatusText(payment.status)}
							</span>
						</div>
						<div class="mt-1 flex items-center gap-3 text-sm text-slate-400">
							<span>{payment.amount.toLocaleString('ru-RU')} {payment.currency}</span>
							<span>·</span>
							<span>{new Date(payment.createdAt).toLocaleString('ru-RU')}</span>
						</div>
					</div>
					{#if payment.status === 'succeeded'}
						<button
							on:click={() => checkRefund(payment)}
							disabled={isCheckingRefund}
							class="ml-4 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
							title="Запросить возврат"
						>
							{isCheckingRefund && selectedPayment?.id === payment.id
								? 'Проверка...'
								: 'Вернуть'}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<BottomModal
	isOpen={refundModalOpen}
	title="Возврат платежа"
	subtitle={refundCheck?.can
		? `Вы можете вернуть ${refundCheck.purchasedCount! - (refundCheck.usedCount || 0)} неиспользованных форматирований`
		: refundCheck?.reason || 'Проверка возможности возврата...'}
	subtitleClass={refundCheck?.can ? 'text-green-400' : 'text-red-400'}
	onClose={closeRefundModal}
	checkCanClose={() => !isProcessingRefund}
>
	{#if refundCheck && selectedPayment}
		{#if refundCheck.can}
			<div class="space-y-4">
				<div class="rounded-lg bg-slate-700/50 p-4">
					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-slate-400">Куплено форматирований:</span>
							<span class="text-white">{refundCheck.purchasedCount}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Использовано:</span>
							<span class="text-white">{refundCheck.usedCount || 0}</span>
						</div>
						<div class="flex justify-between border-t border-slate-600 pt-2">
							<span class="text-slate-400">К возврату:</span>
							<span class="font-semibold text-green-400">
								{refundCheck.purchasedCount! - (refundCheck.usedCount || 0)}
							</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-400">Сумма возврата:</span>
							<span class="font-semibold text-white">
								{selectedPayment.amount.toLocaleString('ru-RU')}
								{selectedPayment.currency}
							</span>
						</div>
					</div>
				</div>
				<div class="rounded-lg bg-blue-500/10 p-3 text-sm text-blue-300">
					Возврат будет выполнен на тот же способ оплаты, который использовался при
					покупке.
				</div>
			</div>
		{:else}
			<div class="rounded-lg bg-slate-700/50 p-4">
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-slate-400">Куплено форматирований:</span>
						<span class="text-white">{refundCheck.purchasedCount}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-slate-400">Использовано:</span>
						<span class="text-white">{refundCheck.usedCount || 0}</span>
					</div>
					<div class="flex justify-between border-t border-slate-600 pt-2">
						<span class="text-slate-400">Доступно:</span>
						<span class="font-semibold text-red-400">
							{refundCheck.purchasedCount! - (refundCheck.usedCount || 0)}
						</span>
					</div>
				</div>
			</div>
		{/if}
	{/if}

	<div slot="footer" class="flex gap-3">
		<button
			on:click={closeRefundModal}
			disabled={isProcessingRefund}
			class="flex-1 rounded-lg bg-slate-700 px-4 py-2 text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
		>
			{refundCheck?.can ? 'Отмена' : 'Закрыть'}
		</button>
		{#if refundCheck?.can}
			<button
				on:click={processRefund}
				disabled={isProcessingRefund}
				class="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
			>
				{isProcessingRefund ? 'Обработка...' : 'Подтвердить возврат'}
			</button>
		{/if}
	</div>
</BottomModal>
