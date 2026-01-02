import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPayment as createPaymentRecord } from '$lib/db/payments';
import { createTelegramInvoice } from '$lib/payment/telegram-stars';
import { convertRubToStars } from '$lib/utils/telegram-stars';
import { getSessionContext } from '$lib/server/sessionContext';
import { dev } from '$app/environment';
import { getPriceWithPromotion } from '$lib/utils/promotions';

function generatePaymentId(): string {
	return `tg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const FORMATS_COUNT = 10;

function calculateBasePrice(count: number): number {
	if (dev && count === 1) return 10;
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

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const context = await getSessionContext(cookies, {});
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user, isTelegram } = context;

	if (!isTelegram) {
		return json(
			{ error: 'Оплата через Telegram Stars доступна только в Telegram Mini App' },
			{ status: 400 }
		);
	}

	const { formatsCount } = await request.json().catch(() => ({}) as { formatsCount?: number });
	const count = Math.min(Math.max(formatsCount ?? FORMATS_COUNT, 1), 500);
	const rubAmount = calculatePrice(count);
	const starsAmount = convertRubToStars(rubAmount);

	try {
		const paymentId = generatePaymentId();

		const invoiceLink = await createTelegramInvoice({
			title: `Покупка ${count} форматирований`,
			description: `Оплата ${count} форматирований через Telegram Stars`,
			payload: JSON.stringify({
				paymentId: paymentId,
				userId: user.id,
				formatsCount: count
			}),
			currency: 'XTR',
			prices: [
				{
					label: `${count} форматирований`,
					amount: starsAmount
				}
			]
		});

		return json({
			paymentId: paymentId,
			invoiceLink,
			starsAmount,
			rubAmount,
			paymentType: 'telegram_stars'
		});
	} catch (error) {
		console.error('Ошибка создания платежа через Telegram Stars:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Ошибка создания платежа'
			},
			{ status: 500 }
		);
	}
};
