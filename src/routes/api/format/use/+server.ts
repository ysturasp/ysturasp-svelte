import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useFormat } from '$lib/db/limits';
import { getUserById } from '$lib/db/users';
import { verifySessionToken } from '$lib/auth/session';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const token = cookies.get('session_token');
	const session = verifySessionToken(token);

	if (!session) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const user = await getUserById(session.userId);
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
