import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getUserById } from '$lib/db/users';
import { verifySessionToken } from '$lib/auth/session';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session_token');
	const session = verifySessionToken(token);

	if (!session) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const user = await getUserById(session.userId);
	if (!user) {
		return json({ error: 'Пользователь не найден' }, { status: 404 });
	}

	const pool = getPool();
	const result = await pool.query(
		'SELECT file_name, is_paid, created_at FROM format_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
		[user.id]
	);

	return json({
		files: result.rows.map((row) => ({
			fileName: row.file_name,
			isPaid: row.is_paid,
			timestamp: row.created_at
		}))
	});
};
