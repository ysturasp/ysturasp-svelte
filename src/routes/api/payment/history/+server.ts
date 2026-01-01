import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getSessionContext } from '$lib/server/sessionContext';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const pool = getPool(context.isTelegram);
	if (!pool) {
		return json({ error: 'База данных недоступна' }, { status: 503 });
	}

	const result = await pool.query(
		`SELECT 
			id,
			yookassa_payment_id,
			telegram_payment_id,
			payment_type,
			amount,
			currency,
			status,
			formats_count,
			created_at,
			updated_at
		FROM payments 
		WHERE user_id = $1 
		ORDER BY created_at DESC 
		LIMIT 50`,
		[context.user.id]
	);

	return json({
		payments: result.rows.map((row) => ({
			id: row.id,
			paymentId: row.yookassa_payment_id || row.telegram_payment_id,
			paymentType: row.payment_type || 'yookassa',
			amount: Number(row.amount),
			currency: row.currency || 'RUB',
			status: row.status,
			formatsCount: row.formats_count,
			createdAt: row.created_at,
			updatedAt: row.updated_at
		}))
	});
};
