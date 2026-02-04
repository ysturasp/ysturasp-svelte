import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSummary } from '$lib/server/analytics';
import { getSessionContext } from '$lib/server/sessionContext';
import { isMiniApp } from '$lib/server/analyticsContext';

export const GET: RequestHandler = async (event) => {
	const { url, cookies } = event;
	const context = await getSessionContext(cookies);

	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const days = parseInt(url.searchParams.get('days') || '7', 10);
		const miniApp = isMiniApp(event);

		const endDate = new Date();
		const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

		const summary = await getSummary(startDate, endDate, miniApp);

		return json(summary);
	} catch (error) {
		console.error('Ошибка при получении сводки аналитики:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
			{ status: 500 }
		);
	}
};
