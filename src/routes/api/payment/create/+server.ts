import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPayment } from '$lib/payment/yookassa';
import { createPayment as createPaymentRecord } from '$lib/db/payments';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { schedulePaymentCheck } from '$lib/payment/payment-scheduler';
import { dev } from '$app/environment';
import { getPriceWithPromotion } from '$lib/utils/promotions';

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

export const POST: RequestHandler = async ({ request, cookies, url, getClientAddress }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { ipAddress });
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = context;

	const { formatsCount } = await request.json().catch(() => ({}) as { formatsCount?: number });
	const count = Math.min(Math.max(formatsCount ?? FORMATS_COUNT, 1), 500);
	const amount = calculatePrice(count);

	try {
		const payment = await createPayment({
			amount,
			description: `Покупка ${count} форматирований`,
			returnUrl: `${url.origin}/format?payment=success`,
			clientIp: ipAddress,
			metadata: {
				userId: user.id,
				formatsCount: count.toString()
			},
			receipt: {
				customer: {
					email: user.email
				},
				items: [
					{
						description: `Покупка ${count} форматирований`,
						quantity: '1.00',
						amount: {
							value: amount.toFixed(2),
							currency: 'RUB'
						},
						vat_code: '1',
						payment_mode: 'full_payment',
						payment_subject: 'service'
					}
				]
			}
		});

		await createPaymentRecord(user.id, payment.id, amount, count, payment.status || 'pending');

		if (payment.status === 'pending') {
			schedulePaymentCheck(payment.id);
		}

		return json({
			paymentId: payment.id,
			confirmationUrl: payment.confirmation?.confirmation_url
		});
	} catch (error) {
		console.error('Ошибка создания платежа:', error);
		return json({ error: 'Ошибка создания платежа' }, { status: 500 });
	}
};
