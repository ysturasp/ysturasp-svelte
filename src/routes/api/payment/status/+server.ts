import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyGoogleToken } from '$lib/auth/google';
import { getUserByGoogleId } from '$lib/db/users';
import { getPaymentByYookassaId, updatePaymentStatus } from '$lib/db/payments';
import { addPaidFormats } from '$lib/db/limits';
import { getPayment as fetchPayment } from '$lib/payment/yookassa';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const paymentId = url.searchParams.get('paymentId');

	if (!paymentId) {
		return json({ error: 'paymentId is required' }, { status: 400 });
	}

	const token = cookies.get('session_token');
	const userIdCookie = cookies.get('user_id');

	if (!token || !userIdCookie) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const userInfo = await verifyGoogleToken(token);
	if (!userInfo) {
		return json({ error: 'Неверный токен' }, { status: 401 });
	}

	const user = await getUserByGoogleId(userInfo.id);
	if (!user) {
		return json({ error: 'Пользователь не найден' }, { status: 404 });
	}

	const payment = await getPaymentByYookassaId(paymentId);
	if (!payment) {
		return json({ error: 'Платеж не найден' }, { status: 404 });
	}

	if (payment.user_id !== user.id) {
		return json({ error: 'Нет доступа к этому платежу' }, { status: 403 });
	}

	let remoteStatus: string | undefined;
	try {
		const remotePayment = await fetchPayment(paymentId);
		remoteStatus = remotePayment?.status;
	} catch (error) {
		console.error('Не удалось получить статус платежа от ЮKassa:', error);
	}

	const previousStatus = payment.status;
	let currentStatus = payment.status;

	if (remoteStatus && remoteStatus !== payment.status) {
		const updated = await updatePaymentStatus(paymentId, remoteStatus);
		currentStatus = updated?.status ?? remoteStatus;
	} else {
		currentStatus = payment.status;
	}

	let formatsAdded = 0;

	if (previousStatus !== 'succeeded' && currentStatus === 'succeeded') {
		await addPaidFormats(user.id, payment.formats_count);
		formatsAdded = payment.formats_count;
	}

	return json({
		status: currentStatus,
		formatsAdded,
		updated: currentStatus !== previousStatus
	});
};
