import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { canRefundPayment } from '$lib/db/payments';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = context;
	const paymentId = url.searchParams.get('paymentId');

	if (!paymentId) {
		return json({ error: 'ID платежа не указан' }, { status: 400 });
	}

	try {
		const result = await canRefundPayment(user.id, paymentId);
		return json(result);
	} catch (error) {
		console.error('Ошибка проверки возможности возврата:', error);
		return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
};
