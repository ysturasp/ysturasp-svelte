import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getEventsByType } from '$lib/server/analytics';
import { getSessionContext } from '$lib/server/sessionContext';
import { isMiniApp } from '$lib/server/analyticsContext';

export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
	const context = await getSessionContext(cookies);

	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const days = parseInt(url.searchParams.get('days') || '30', 10);
		const miniApp = isMiniApp(event);

		const endDate = new Date();
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const events = await getEventsByType(startDate, endDate, miniApp);

		return json({
			events: events.map((e) => ({
				eventType: e.event_type,
				count: parseInt(e.count, 10)
			}))
		});
	} catch (error) {
		console.error('Ошибка при получении событий:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
			{ status: 500 }
		);
	}
};
