import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPendingPaymentsOlderThan, updatePaymentStatus } from '$lib/db/payments';
import { getPayment as fetchPayment } from '$lib/payment/yookassa';

const PENDING_TIMEOUT_MINUTES = 10;

export const POST: RequestHandler = async () => {
	try {
		const oldPendingPayments = await getPendingPaymentsOlderThan(PENDING_TIMEOUT_MINUTES);

		let updatedCount = 0;
		let canceledCount = 0;

		for (const payment of oldPendingPayments) {
			try {
				const remotePayment = await fetchPayment(payment.yookassa_payment_id);
				const remoteStatus = remotePayment?.status;

				if (remoteStatus && remoteStatus !== payment.status) {
					await updatePaymentStatus(payment.yookassa_payment_id, remoteStatus);
					updatedCount++;

					if (remoteStatus === 'canceled') {
						canceledCount++;
					}
				} else if (remoteStatus === 'pending') {
					await updatePaymentStatus(payment.yookassa_payment_id, 'canceled');
					canceledCount++;
					updatedCount++;
				}
			} catch (error) {
				console.error(`Ошибка при проверке платежа ${payment.yookassa_payment_id}:`, error);
				await updatePaymentStatus(payment.yookassa_payment_id, 'canceled');
				canceledCount++;
				updatedCount++;
			}
		}

		return json({
			success: true,
			checked: oldPendingPayments.length,
			updated: updatedCount,
			canceled: canceledCount
		});
	} catch (error) {
		console.error('Ошибка при проверке pending платежей:', error);
		return json({ error: 'Ошибка при проверке платежей' }, { status: 500 });
	}
};
