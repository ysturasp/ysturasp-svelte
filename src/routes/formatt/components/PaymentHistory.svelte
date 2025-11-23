<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';

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

	let payments: Payment[] = [];
	let isLoading = true;
	let error = '';

	function getStatusText(status: string): string {
		const statusMap: Record<string, string> = {
			pending: 'Ожидает оплаты',
			succeeded: 'Оплачено',
			canceled: 'Отменено',
			waiting_for_capture: 'Ожидает подтверждения'
		};
		return statusMap[status] || status;
	}

	function getStatusColor(status: string): string {
		const colorMap: Record<string, string> = {
			pending: 'text-yellow-400',
			succeeded: 'text-green-400',
			canceled: 'text-red-400',
			waiting_for_capture: 'text-blue-400'
		};
		return colorMap[status] || 'text-slate-400';
	}

	async function loadPayments() {
		if (!$auth.authenticated) {
			isLoading = false;
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
		} catch (err) {
			error = err instanceof Error ? err.message : 'Ошибка при загрузке платежей';
		} finally {
			isLoading = false;
		}
	}

	auth.subscribe(() => {
		loadPayments();
	});

	onMount(() => {
		loadPayments();
	});
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
				</div>
			{/each}
		</div>
	{/if}
</div>
