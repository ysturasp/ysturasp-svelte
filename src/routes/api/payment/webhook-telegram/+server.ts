import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPaymentByTelegramId, updatePaymentStatus } from '$lib/db/payments';
import { addPaidFormats } from '$lib/db/limits';
import { getUserById } from '$lib/db/users';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();
		const { paymentId } = body;

		if (!paymentId) {
			return json({ error: 'ID платежа не найден' }, { status: 400 });
		}

		const payment = await getPaymentByTelegramId(paymentId, true);
		if (!payment) {
			return json({ error: 'Платеж не найден' }, { status: 404 });
		}

		const updatedPayment = await updatePaymentStatus(
			paymentId,
			'succeeded',
			'telegram_stars',
			true
		);

		if (updatedPayment && updatedPayment.status === 'succeeded') {
			let isTelegram = false;
			const userInMainDb = await getUserById(payment.user_id, false);
			if (!userInMainDb) {
				const userInBotDb = await getUserById(payment.user_id, true);
				if (userInBotDb) {
					isTelegram = true;
				}
			}
			await addPaidFormats(payment.user_id, payment.formats_count, isTelegram);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Ошибка обработки платежа Telegram Stars:', error);
		return json({ error: 'Ошибка обработки платежа' }, { status: 500 });
	}
};
