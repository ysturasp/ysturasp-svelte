import { getPool } from './database';

export interface Payment {
	id: string;
	user_id: string;
	yookassa_payment_id: string;
	amount: number;
	currency: string;
	status: string;
	formats_count: number;
	created_at: Date;
	updated_at: Date;
}

export async function createPayment(
	userId: string,
	yookassaPaymentId: string,
	amount: number,
	formatsCount: number,
	status: string = 'pending'
): Promise<Payment> {
	const pool = getPool();
	const result = await pool.query(
		`INSERT INTO payments (user_id, yookassa_payment_id, amount, formats_count, status) 
		 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
		[userId, yookassaPaymentId, amount, formatsCount, status]
	);
	return result.rows[0];
}

export async function updatePaymentStatus(
	yookassaPaymentId: string,
	status: string
): Promise<Payment | null> {
	const pool = getPool();
	const result = await pool.query(
		'UPDATE payments SET status = $1, updated_at = NOW() WHERE yookassa_payment_id = $2 RETURNING *',
		[status, yookassaPaymentId]
	);
	return result.rows[0] || null;
}

export async function getPaymentByYookassaId(yookassaPaymentId: string): Promise<Payment | null> {
	const pool = getPool();
	const result = await pool.query('SELECT * FROM payments WHERE yookassa_payment_id = $1', [
		yookassaPaymentId
	]);
	return result.rows[0] || null;
}
