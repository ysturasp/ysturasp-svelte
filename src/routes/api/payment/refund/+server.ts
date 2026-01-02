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

		const canRefund = await canRefundPayment(user.id, paymentId, context.isTelegram);

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

		const payment = await getPaymentById(paymentId, context.isTelegram);
		if (!payment) {
			return json({ error: 'Платеж не найден' }, { status: 404 });
		}

		if (payment.user_id !== user.id) {
			return json({ error: 'Платеж не принадлежит вам' }, { status: 403 });
		}

		if (payment.status === 'refunded') {
			return json({ error: 'Платеж уже был возвращен' }, { status: 400 });
		}

		if (payment.status !== 'succeeded') {
			return json({ error: 'Можно вернуть только успешные платежи' }, { status: 400 });
		}

		if (payment.payment_type === 'telegram_stars') {
			return json(
				{ error: 'Возврат для платежей через Telegram Stars невозможен' },
				{ status: 400 }
			);
		}

		const purchasedCount = Number(payment.formats_count);
		const refundedCount = purchasedCount;
		const usedCountForThisPayment = 0;

		if (payment.payment_type === 'yookassa' && payment.yookassa_payment_id) {
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
		} else {
			return json({ error: 'Неподдерживаемый тип платежа для возврата' }, { status: 400 });
		}

		await markPaymentAsRefunded(paymentId, Number(payment.amount), context.isTelegram);

		await removePaidFormats(
			user.id,
			purchasedCount,
			usedCountForThisPayment,
			context.isTelegram
		);

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
