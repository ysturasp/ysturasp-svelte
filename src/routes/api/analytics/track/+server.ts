import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackEventAuto } from '$lib/server/analyticsContext';
import { getSessionContext } from '$lib/server/sessionContext';

export const POST: RequestHandler = async (event) => {
	const { request, cookies } = event;
	const context = await getSessionContext(cookies);

	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { eventType, payload } = body;

		if (!eventType || typeof eventType !== 'string') {
			return json({ error: 'eventType обязателен' }, { status: 400 });
		}

		await trackEventAuto(event, context.user.id, eventType, payload || null);

		return json({ success: true });
	} catch (error) {
		console.error('Ошибка при трекинге события:', error);
		return json({ error: 'Ошибка при трекинге события' }, { status: 500 });
	}
};
