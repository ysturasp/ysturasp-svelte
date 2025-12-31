import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canFormat } from '$lib/db/limits';
import { getSessionContext } from '$lib/server/sessionContext';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const result = await canFormat(context.user.id, context.isTelegram);
	return json(result);
};
