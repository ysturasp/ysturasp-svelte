import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPool } from '$lib/db/database';
import { getSessionContext } from '$lib/server/sessionContext';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies);

	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const mainPool = getPool(false);
		const mainEvents = mainPool
			? await mainPool.query(
					`
			SELECT event_type, source, created_at, payload
			FROM web_events
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 10
		`,
					[context.user.id]
				)
			: { rows: [] };

		const botPool = getPool(true);
		const botEvents = botPool
			? await botPool.query(
					`
			SELECT event_type, source, created_at, payload
			FROM webapp_events
			WHERE user_id = $1
			ORDER BY created_at DESC
			LIMIT 10
		`,
					[context.user.id]
				)
			: { rows: [] };

		return json({
			user: {
				id: context.user.id,
				email: context.user.email,
				name: context.user.name
			},
			mainDb: {
				hasPool: !!mainPool,
				eventsCount: mainEvents.rows.length,
				events: mainEvents.rows
			},
			botDb: {
				hasPool: !!botPool,
				eventsCount: botEvents.rows.length,
				events: botEvents.rows
			}
		});
	} catch (error) {
		console.error('Ошибка при получении событий:', error);
		return json(
			{
				error: error instanceof Error ? error.message : 'Неизвестная ошибка',
				stack: error instanceof Error ? error.stack : undefined
			},
			{ status: 500 }
		);
	}
};
