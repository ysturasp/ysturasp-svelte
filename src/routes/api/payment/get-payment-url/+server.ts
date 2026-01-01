import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { getPaymentByYookassaId } from '$lib/db/payments';
import { getPayment as fetchPayment } from '$lib/payment/yookassa';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const paymentId = url.searchParams.get('paymentId');

	if (!paymentId) {
		return json({ error: 'paymentId is required' }, { status: 400 });
	}

	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user, isTelegram } = context;

	const payment = await getPaymentByYookassaId(paymentId, isTelegram);
	if (!payment) {
		return json({ error: 'Платеж не найден' }, { status: 404 });
	}

	if (payment.user_id !== user.id) {
		return json({ error: 'Нет доступа к этому платежу' }, { status: 403 });
	}

	if (payment.status !== 'pending') {
		return json({ error: 'Платеж не в статусе ожидания оплаты' }, { status: 400 });
	}

	try {
		const remotePayment = await fetchPayment(paymentId);
		const confirmationUrl = remotePayment?.confirmation?.confirmation_url;

		if (!confirmationUrl) {
			return json({ error: 'URL для оплаты не найден' }, { status: 404 });
		}

		return json({ confirmationUrl });
	} catch (error) {
		console.error('Ошибка при получении URL платежа от ЮKassa:', error);
		return json({ error: 'Не удалось получить URL для оплаты' }, { status: 500 });
	}
};
