import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { getPaymentById, canRefundPayment, markPaymentAsRefunded } from '$lib/db/payments';
import { refundPayment } from '$lib/payment/yookassa';
import { removePaidFormats } from '$lib/db/limits';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = context;

	try {
		const { paymentId } = await request.json().catch(() => ({}) as { paymentId?: string });

		if (!paymentId) {
			return json({ error: 'ID платежа не указан' }, { status: 400 });
		}

		const canRefund = await canRefundPayment(user.id, paymentId);

		if (!canRefund.can) {
			return json(
				{
					error: canRefund.reason || 'Возврат невозможен',
					usedCount: canRefund.usedCount,
					purchasedCount: canRefund.purchasedCount
				},
				{ status: 400 }
			);
		}

		const payment = await getPaymentById(paymentId);
		if (!payment) {
			return json({ error: 'Платеж не найден' }, { status: 404 });
		}

		const purchasedCount = Number(payment.formats_count);
		const refundedCount = purchasedCount;
		const usedCountForThisPayment = 0;

		try {
			await refundPayment({
				paymentId: payment.yookassa_payment_id,
				amount: Number(payment.amount),
				description: `Возврат за ${refundedCount} неиспользованных форматирований из платежа ${payment.yookassa_payment_id}`
			});
		} catch (error) {
			console.error('Ошибка возврата через YooKassa:', error);
			return json(
				{ error: 'Ошибка при выполнении возврата через платежную систему' },
				{ status: 500 }
			);
		}

		await markPaymentAsRefunded(paymentId, Number(payment.amount));

		await removePaidFormats(user.id, purchasedCount, usedCountForThisPayment);

		return json({
			success: true,
			message: 'Возврат успешно выполнен',
			refundedAmount: Number(payment.amount),
			refundedCount,
			usedCount: usedCountForThisPayment
		});
	} catch (error) {
		console.error('Ошибка возврата платежа:', error);
		return json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
	}
};
