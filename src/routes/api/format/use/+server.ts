import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { useFormat } from '$lib/db/limits';
import { getSessionContext } from '$lib/server/sessionContext';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { fileName } = await request.json();
	if (!fileName) {
		return json({ error: 'Имя файла не указано' }, { status: 400 });
	}

	const success = await useFormat(context.user.id, fileName);
	if (!success) {
		return json({ error: 'Лимит форматирований исчерпан' }, { status: 403 });
	}

	return json({ success: true });
};
