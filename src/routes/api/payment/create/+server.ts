import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPayment } from '$lib/payment/yookassa';
import { createPayment as createPaymentRecord } from '$lib/db/payments';
import { getUserById } from '$lib/db/users';
import { verifySessionToken } from '$lib/auth/session';

const FORMATS_PRICE = 100;
const FORMATS_COUNT = 10;

export const POST: RequestHandler = async ({ request, cookies, url }) => {
	const token = cookies.get('session_token');
	const session = verifySessionToken(token);

	if (!session) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const user = await getUserById(session.userId);
	if (!user) {
		return json({ error: 'Пользователь не найден' }, { status: 404 });
	}

	const { formatsCount } = await request.json().catch(() => ({}));
	const count = formatsCount || FORMATS_COUNT;
	const amount = FORMATS_PRICE * count;

	try {
		const payment = await createPayment({
			amount,
			description: `Покупка ${count} форматирований`,
			returnUrl: `${url.origin}/format?payment=success`,
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
