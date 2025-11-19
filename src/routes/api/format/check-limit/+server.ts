import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canFormat } from '$lib/db/limits';
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

	const result = await canFormat(user.id);
	return json(result);
};
