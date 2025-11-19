import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getUserByGoogleId } from '$lib/db/users';
import { verifyGoogleToken } from '$lib/auth/google';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session_token');
	const userId = cookies.get('user_id');

	if (!token || !userId) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const userInfo = await verifyGoogleToken(token);
	if (!userInfo) {
		return json({ error: 'Неверный токен' }, { status: 401 });
	}

	const user = await getUserByGoogleId(userInfo.id);
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
