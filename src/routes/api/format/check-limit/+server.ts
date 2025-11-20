import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canFormat } from '$lib/db/limits';
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

	const result = await canFormat(user.id);
	return json(result);
};
