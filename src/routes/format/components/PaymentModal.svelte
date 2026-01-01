<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BottomModal from '$lib/components/ui/BottomModal.svelte';
	import CustomSelect from '$lib/components/ui/CustomSelect.svelte';
	import { getPriceWithPromotion, getCurrentPromotion } from '$lib/utils/promotions';
	import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
	import { convertRubToStars } from '$lib/utils/telegram-stars';
	import { invoice } from '@tma.js/sdk-svelte';

	export let isOpen = false;
	export let remaining = 0;
	export let formatsCount = 10;

	const dispatch = createEventDispatcher();

	let isProcessing = false;
	let isTelegram = false;
	let paymentMethod: 'telegram_stars' | 'yookassa' = 'telegram_stars';
	const promotion = getCurrentPromotion();

	onMount(() => {
		isTelegram = checkIsTelegramMiniApp();
		if (!isTelegram) {
			paymentMethod = 'yookassa';
		}
	});

	function calculateBasePrice(count: number): number {
		if (import.meta.env.DEV && count === 1) return 10;
		if (count >= 50) return 3000;
		if (count >= 20) return 1500;
		if (count >= 10) return 850;
		if (count >= 5) return 500;
		return count * 125;
	}

	function calculatePrice(count: number): number {
		const basePrice = calculateBasePrice(count);
		const { finalPrice } = getPriceWithPromotion(basePrice);
		return finalPrice;
	}

	function getPricePerFormat(count: number): number {
		return Math.round(calculatePrice(count) / count);
	}

	function getFormatOptionLabel(count: number): string {
		const basePrice = calculateBasePrice(count);
		const price = calculatePrice(count);
		const perDoc = getPricePerFormat(count);

		if (import.meta.env.DEV && count === 1) {
			return `Тест · 10 ₽ (10 ₽/шт)`;
		}

		const countText = count === 1 ? '1 форматирование' : `${count} форматирований`;
		return `${countText} · ${price} ₽ (${perDoc} ₽/шт)`;
	}

	const formatOptions = [
		{ id: 1, label: getFormatOptionLabel(1) },
		{ id: 5, label: getFormatOptionLabel(5) },
		{ id: 10, label: getFormatOptionLabel(10) },
		{ id: 20, label: getFormatOptionLabel(20) },
		{ id: 50, label: getFormatOptionLabel(50) }
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
			if (paymentMethod === 'telegram_stars' && isTelegram) {
				const response = await fetch('/api/payment/create-telegram', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ formatsCount })
				});

				if (!response.ok) {
					const errorData = await response
						.json()
						.catch(() => ({ error: 'Ошибка создания платежа' }));
					throw new Error(errorData.error || 'Ошибка создания платежа');
				}

				const data = await response.json();

				if (!data.invoiceLink) {
					throw new Error('Не удалось получить ссылку на оплату');
				}

				const invoiceLink = data.invoiceLink;

				try {
					const status = await invoice.openUrl(invoiceLink);

					console.log('Invoice закрыт со статусом:', status);

					if (status === 'paid') {
						try {
							await fetch('/api/payment/webhook-telegram', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ paymentId: data.paymentId })
							});
						} catch (error) {
							console.error('Ошибка уведомления сервера об оплате:', error);
						}
						dispatch('success', { message: 'Платеж успешно завершен!' });
						isProcessing = false;
						close();
					} else if (status === 'failed') {
						dispatch('error', { message: 'Ошибка оплаты. Попробуйте позже.' });
						isProcessing = false;
					} else if (status === 'cancelled' || status === 'canceled') {
						isProcessing = false;
					} else {
						console.log('Статус invoice:', status);
						isProcessing = false;
					}
				} catch (invoiceError) {
					console.error('Ошибка при открытии invoice:', invoiceError);
					const tg = (window as any).Telegram?.WebApp;

					if (tg && typeof tg.openInvoice === 'function') {
						try {
							tg.openInvoice(invoiceLink, async (status: string) => {
								if (status === 'paid') {
									try {
										await fetch('/api/payment/webhook-telegram', {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ paymentId: data.paymentId })
										});
									} catch (error) {
										console.error(
											'Ошибка уведомления сервера об оплате:',
											error
										);
									}
									dispatch('success', { message: 'Платеж успешно завершен!' });
									isProcessing = false;
									close();
								} else if (status === 'failed') {
									dispatch('error', {
										message: 'Ошибка оплаты. Попробуйте позже.'
									});
									isProcessing = false;
								} else {
									isProcessing = false;
								}
							});
							return;
						} catch (fallbackError) {
							console.error('Ошибка при fallback вызове openInvoice:', fallbackError);
						}
					}

					dispatch('error', {
						message: 'Не удалось открыть окно оплаты. Попробуйте позже.'
					});
					isProcessing = false;
				}
			} else {
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
			}
		} catch (error) {
			console.error('Ошибка платежа:', error);
			dispatch('error', {
				message:
					error instanceof Error
						? error.message
						: 'Ошибка создания платежа. Попробуйте позже.'
			});
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
		{#if promotion && promotion.isActive}
			<div
				class="rounded-lg border border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-3"
			>
				<div class="mb-1 flex items-center gap-2">
					<span class="text-xl">🎄</span>
					<span class="text-sm font-bold text-yellow-300">{promotion.name}</span>
					<span
						class="ml-auto rounded-full bg-yellow-500/30 px-2 py-0.5 text-xs font-bold text-yellow-200"
					>
						-{promotion.discountPercent}%
					</span>
				</div>
				<p class="text-xs text-yellow-100/90">{promotion.description}</p>
			</div>
		{/if}

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

		{#if isTelegram}
			<div class="flex gap-2">
				<button
					type="button"
					on:click={() => (paymentMethod = 'telegram_stars')}
					disabled={isProcessing}
					class="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 {paymentMethod ===
					'telegram_stars'
						? 'border-blue-400/50 bg-blue-500/30 text-blue-200 shadow-sm'
						: 'border-blue-500/20 bg-blue-500/10 text-blue-300/70 hover:border-blue-400/30 hover:bg-blue-500/20'}"
				>
					⭐ Telegram Stars
				</button>
				<button
					type="button"
					on:click={() => (paymentMethod = 'yookassa')}
					disabled={isProcessing}
					class="flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 {paymentMethod ===
					'yookassa'
						? 'border-emerald-400/50 bg-emerald-500/30 text-emerald-200 shadow-sm'
						: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300/70 hover:border-emerald-400/30 hover:bg-emerald-500/20'}"
				>
					💳 ЮKassa
				</button>
			</div>
		{/if}

		<div class="rounded-lg bg-blue-500/10 p-4">
			<div class="text-sm text-slate-400">К оплате</div>
			{#if promotion && promotion.isActive && calculateBasePrice(formatsCount) > calculatePrice(formatsCount)}
				<div class="mb-1 text-xs text-slate-500 line-through">
					{calculateBasePrice(formatsCount)} ₽
				</div>
			{/if}
			<div class="text-2xl font-bold text-blue-400">
				{#if paymentMethod === 'telegram_stars' && isTelegram}
					{calculatePrice(formatsCount)} ₽ ≈ {convertRubToStars(
						calculatePrice(formatsCount)
					)} Stars
				{:else}
					{calculatePrice(formatsCount)} ₽
				{/if}
			</div>
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
