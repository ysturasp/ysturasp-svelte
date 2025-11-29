import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPayment } from '$lib/payment/yookassa';
import { createPayment as createPaymentRecord } from '$lib/db/payments';
import { getSessionContext } from '$lib/server/sessionContext';

const FORMATS_COUNT = 10;

function calculatePrice(count: number): number {
	if (count >= 50) return 3000;
	if (count >= 20) return 1500;
	if (count >= 10) return 850;
	if (count >= 5) return 500;
	return count * 100;
}

export const POST: RequestHandler = async ({ request, cookies, url, getClientAddress }) => {
	const ipAddress = getClientAddress();
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
			returnUrl: `${url.origin}/formatt?payment=success`,
			metadata: {
				userId: user.id,
				formatsCount: count.toString()
			}
		});

		await createPaymentRecord(user.id, payment.id, amount, count, payment.status || 'pending');

		return json({
			paymentId: payment.id,
			confirmationUrl: payment.confirmation?.confirmation_url
		});
	} catch (error) {
		console.error('Ошибка создания платежа:', error);
		return json({ error: 'Ошибка создания платежа' }, { status: 500 });
	}
};
