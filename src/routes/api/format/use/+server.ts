import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useFormat } from '$lib/db/limits';
import { getUserByGoogleId } from '$lib/db/users';
import { verifyGoogleToken } from '$lib/auth/google';

export const POST: RequestHandler = async ({ request, cookies }) => {
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

	const { fileName } = await request.json();
	if (!fileName) {
		return json({ error: 'Имя файла не указано' }, { status: 400 });
	}

	const success = await useFormat(user.id, fileName);
	if (!success) {
		return json({ error: 'Лимит форматирований исчерпан' }, { status: 403 });
	}

	return json({ success: true });
};
