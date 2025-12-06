import {
	getPendingPaymentsOlderThan,
	updatePaymentStatus,
	getPaymentByYookassaId
} from '$lib/db/payments';
import { getPayment as fetchPayment } from '$lib/payment/yookassa';

const PENDING_TIMEOUT_MINUTES = 10;

interface ScheduledCheck {
	paymentId: string;
	timeoutId: NodeJS.Timeout;
	scheduledAt: Date;
}

const scheduledChecks = new Map<string, ScheduledCheck>();

export function schedulePaymentCheck(yookassaPaymentId: string): void {
	cancelPaymentCheck(yookassaPaymentId);

	const timeoutMs = PENDING_TIMEOUT_MINUTES * 60 * 1000;
	const timeoutId = setTimeout(async () => {
		await checkPaymentStatus(yookassaPaymentId);
		scheduledChecks.delete(yookassaPaymentId);
	}, timeoutMs);

	scheduledChecks.set(yookassaPaymentId, {
		paymentId: yookassaPaymentId,
		timeoutId,
		scheduledAt: new Date()
	});
}

export function cancelPaymentCheck(yookassaPaymentId: string): void {
	const scheduled = scheduledChecks.get(yookassaPaymentId);
	if (scheduled) {
		clearTimeout(scheduled.timeoutId);
		scheduledChecks.delete(yookassaPaymentId);
	}
}

async function checkPaymentStatus(yookassaPaymentId: string): Promise<void> {
	try {
		const payment = await getPaymentByYookassaId(yookassaPaymentId);

		if (!payment || payment.status !== 'pending') {
			return;
		}

		const paymentCreatedAt = new Date(payment.created_at);
		const now = new Date();
		const minutesSinceCreation = (now.getTime() - paymentCreatedAt.getTime()) / (1000 * 60);

		if (minutesSinceCreation < PENDING_TIMEOUT_MINUTES) {
			schedulePaymentCheck(yookassaPaymentId);
			return;
		}

		try {
			const remotePayment = await fetchPayment(yookassaPaymentId);
			const remoteStatus = remotePayment?.status;

			if (remoteStatus && remoteStatus !== payment.status) {
				await updatePaymentStatus(yookassaPaymentId, remoteStatus);
			} else if (remoteStatus === 'pending' || !remoteStatus) {
				await updatePaymentStatus(yookassaPaymentId, 'canceled');
			}
		} catch (error) {
			console.error(`Ошибка при проверке платежа ${yookassaPaymentId} от ЮKassa:`, error);
			await updatePaymentStatus(yookassaPaymentId, 'canceled');
		}
	} catch (error) {
		console.error(`Ошибка при проверке платежа ${yookassaPaymentId}:`, error);
	}
}

export async function checkOldPendingPayments(): Promise<void> {
	try {
		const oldPendingPayments = await getPendingPaymentsOlderThan(PENDING_TIMEOUT_MINUTES);

		for (const payment of oldPendingPayments) {
			if (!scheduledChecks.has(payment.yookassa_payment_id)) {
				await checkPaymentStatus(payment.yookassa_payment_id);
			}
		}
	} catch (error) {
		console.error('Ошибка при проверке старых pending платежей:', error);
	}
}

export function startPaymentChecker(): void {
	setInterval(() => {
		checkOldPendingPayments().catch((error) => {
			console.error('Ошибка в фоновой проверке платежей:', error);
		});
	}, 60 * 1000);

	console.log('[Payment Scheduler] Фоновый процесс проверки платежей запущен');
}
