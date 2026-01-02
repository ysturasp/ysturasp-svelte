import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getSessionContext } from '$lib/server/sessionContext';
import { getUserPromoCodes } from '$lib/db/promo-codes';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const pool = getPool(context.isTelegram);
	if (!pool) {
		return json({ error: 'База данных недоступна' }, { status: 503 });
	}

	const mainPool = getPool(false);
	const paymentsResult = await pool.query(
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

	const payments = paymentsResult.rows.map((row) => ({
		id: row.id,
		type: 'payment' as const,
		paymentId: row.yookassa_payment_id || row.telegram_payment_id,
		paymentType: row.payment_type || 'yookassa',
		amount: Number(row.amount),
		currency: row.currency || 'RUB',
		status: row.status,
		formatsCount: row.formats_count,
		createdAt: row.created_at,
		updatedAt: row.updated_at
	}));

	const promoCodes = await getUserPromoCodes(context.user.id, context.isTelegram);
	const promoCodeItems = promoCodes.map((pc) => ({
		id: pc.id,
		type: 'promo_code' as const,
		code: pc.code,
		description: pc.description,
		formatsCount: pc.formats_count,
		createdAt: pc.created_at
	}));

	const allItems = [...payments, ...promoCodeItems].sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
	);

	return json({
		payments: allItems
	});
};
