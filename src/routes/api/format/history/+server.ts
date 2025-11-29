import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getSessionContext } from '$lib/server/sessionContext';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const pool = getPool();
	if (!pool) {
		return json({ error: 'База данных недоступна' }, { status: 503 });
	}

	const result = await pool.query(
		'SELECT file_name, is_paid, created_at FROM format_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
		[context.user.id]
	);

	return json({
		files: result.rows.map((row) => ({
			fileName: row.file_name,
			isPaid: row.is_paid,
			timestamp: row.created_at
		}))
	});
};
