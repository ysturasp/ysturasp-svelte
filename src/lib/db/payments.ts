import { getPool } from './database';
import { getUserLimits } from './limits';

export interface Payment {
	id: string;
	user_id: string;
	yookassa_payment_id: string | null;
	telegram_payment_id: string | null;
	payment_type: 'yookassa' | 'telegram_stars';
	amount: number;
	currency: string;
	status: string;
	formats_count: number;
	created_at: Date;
	updated_at: Date;
}

export async function createPayment(
	userId: string,
	paymentId: string,
	amount: number,
	formatsCount: number,
	paymentType: 'yookassa' | 'telegram_stars' = 'yookassa',
	status: string = 'pending',
	isTelegram: boolean = false
): Promise<Payment> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	const yookassaPaymentId = paymentType === 'yookassa' ? paymentId : null;
	const telegramPaymentId = paymentType === 'telegram_stars' ? paymentId : null;

	const result = await pool.query(
		`INSERT INTO payments (user_id, yookassa_payment_id, telegram_payment_id, payment_type, amount, formats_count, status) 
		 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
		[userId, yookassaPaymentId, telegramPaymentId, paymentType, amount, formatsCount, status]
	);
	return result.rows[0];
}

export async function updatePaymentStatus(
	paymentId: string,
	status: string,
	paymentType: 'yookassa' | 'telegram_stars' = 'yookassa',
	isTelegram: boolean = false
): Promise<Payment | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result =
		paymentType === 'yookassa'
			? await pool.query(
					'UPDATE payments SET status = $1, updated_at = NOW() WHERE yookassa_payment_id = $2 RETURNING *',
					[status, paymentId]
				)
			: await pool.query(
					'UPDATE payments SET status = $1, updated_at = NOW() WHERE telegram_payment_id = $2 RETURNING *',
					[status, paymentId]
				);
	return result.rows[0] || null;
}

export async function getPaymentByYookassaId(
	yookassaPaymentId: string,
	isTelegram?: boolean
): Promise<Payment | null> {
	if (isTelegram !== undefined) {
		const pool = getPool(isTelegram);
		if (!pool) return null;
		const result = await pool.query('SELECT * FROM payments WHERE yookassa_payment_id = $1', [
			yookassaPaymentId
		]);
		return result.rows[0] || null;
	}

	const mainPool = getPool(false);
	if (mainPool) {
		const result = await mainPool.query(
			'SELECT * FROM payments WHERE yookassa_payment_id = $1',
			[yookassaPaymentId]
		);
		if (result.rows[0]) {
			return result.rows[0];
		}
	}

	const botPool = getPool(true);
	if (botPool) {
		const result = await botPool.query(
			'SELECT * FROM payments WHERE yookassa_payment_id = $1',
			[yookassaPaymentId]
		);
		if (result.rows[0]) {
			return result.rows[0];
		}
	}

	return null;
}

export async function getPaymentByTelegramId(
	telegramPaymentId: string,
	isTelegram: boolean = true
): Promise<Payment | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM payments WHERE telegram_payment_id = $1', [
		telegramPaymentId
	]);
	return result.rows[0] || null;
}

export async function getPaymentById(
	paymentId: string,
	isTelegram: boolean = false
): Promise<Payment | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
	return result.rows[0] || null;
}

export async function getUserPayments(userId: string): Promise<Payment[]> {
	const pool = getPool();
	if (!pool) return [];
	const result = await pool.query(
		'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
		[userId]
	);
	return result.rows;
}

export async function getUsedFormatsCountForPayment(
	userId: string,
	paymentId: string,
	isTelegram: boolean = false
): Promise<number> {
	const pool = getPool(isTelegram);
	if (!pool) return 0;

	const payment = await getPaymentById(paymentId, isTelegram);
	if (!payment) {
		return 0;
	}

	const paymentsResult = await pool.query(
		`SELECT id, formats_count, created_at 
		 FROM payments 
		 WHERE user_id = $1 AND status = 'succeeded' AND created_at <= $2 
		 ORDER BY created_at ASC`,
		[userId, payment.created_at]
	);

	const payments = paymentsResult.rows;

	let totalPurchased = 0;
	let targetPaymentIndex = -1;

	for (let i = 0; i < payments.length; i++) {
		totalPurchased += Number(payments[i].formats_count);
		if (payments[i].id === paymentId) {
			targetPaymentIndex = i;
		}
	}

	if (targetPaymentIndex === -1) {
		return 0;
	}

	const formatsResult = await pool.query(
		`SELECT created_at 
		 FROM format_history 
		 WHERE user_id = $1 AND is_paid = true 
		 ORDER BY created_at ASC`,
		[userId]
	);

	const usedFormats = formatsResult.rows;

	let usedFromPreviousPayments = 0;

	for (let i = 0; i < targetPaymentIndex; i++) {
		usedFromPreviousPayments += Number(payments[i].formats_count);
	}

	const totalUsed = usedFormats.length;
	const usedFromThisPayment = Math.max(
		0,
		Math.min(Number(payment.formats_count), totalUsed - usedFromPreviousPayments)
	);

	return usedFromThisPayment;
}

export async function canRefundPayment(
	userId: string,
	paymentId: string,
	isTelegram: boolean = false
): Promise<{ can: boolean; reason?: string; usedCount?: number; purchasedCount?: number }> {
	const payment = await getPaymentById(paymentId, isTelegram);

	if (!payment) {
		return { can: false, reason: 'Платеж не найден' };
	}

	if (payment.user_id !== userId) {
		return { can: false, reason: 'Платеж не принадлежит вам' };
	}

	if (payment.status === 'refunded') {
		return { can: false, reason: 'Платеж уже был возвращен' };
	}

	if (payment.status !== 'succeeded') {
		return { can: false, reason: 'Можно вернуть только успешные платежи' };
	}

	if (payment.payment_type === 'telegram_stars') {
		return { can: false, reason: 'Возврат для платежей через Telegram Stars невозможен' };
	}

	const paymentDate = new Date(payment.created_at);
	const now = new Date();
	const daysSincePayment = Math.floor(
		(now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24)
	);
	const REFUND_DEADLINE_DAYS = 7;

	if (daysSincePayment > REFUND_DEADLINE_DAYS) {
		return {
			can: false,
			reason: `Срок возврата истек. Возврат возможен в течение ${REFUND_DEADLINE_DAYS} дней с момента оплаты`,
			usedCount: 0,
			purchasedCount: Number(payment.formats_count)
		};
	}

	const limits = await getUserLimits(userId, isTelegram);
	const purchasedCount = Number(payment.formats_count);
	const usedCount = limits.paid_formats_used;
	const totalPurchased = limits.paid_formats_purchased;

	const available = totalPurchased - usedCount;

	if (available < purchasedCount) {
		return {
			can: false,
			reason: 'Невозможно вернуть платеж: использованы форматирования',
			usedCount,
			purchasedCount
		};
	}

	return {
		can: true,
		usedCount,
		purchasedCount
	};
}

export async function markPaymentAsRefunded(
	paymentId: string,
	refundedAmount: number,
	isTelegram: boolean = false
): Promise<Payment | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result = await pool.query(
		`UPDATE payments 
		 SET status = 'refunded', updated_at = NOW() 
		 WHERE id = $1 AND status = 'succeeded' 
		 RETURNING *`,
		[paymentId]
	);
	return result.rows[0] || null;
}

export async function getPendingPaymentsOlderThan(minutes: number): Promise<Payment[]> {
	const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
	const allPayments: Payment[] = [];

	const mainPool = getPool(false);
	if (mainPool) {
		const mainResult = await mainPool.query(
			`SELECT * FROM payments 
			 WHERE status = 'pending' 
			 AND created_at < $1
			 ORDER BY created_at ASC`,
			[cutoffTime]
		);
		allPayments.push(...mainResult.rows);
	}

	const botPool = getPool(true);
	if (botPool) {
		const botResult = await botPool.query(
			`SELECT * FROM payments 
			 WHERE status = 'pending' 
			 AND created_at < $1
			 ORDER BY created_at ASC`,
			[cutoffTime]
		);
		allPayments.push(...botResult.rows);
	}

	return allPayments;
}
