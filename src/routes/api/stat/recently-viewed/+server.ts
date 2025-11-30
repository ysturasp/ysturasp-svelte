import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRecentlyViewed } from '$lib/db/statViews';

export const GET: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = sessionContext;
	const views = await getRecentlyViewed(user.id, 5);

	return json({
		items: views.map((view) => ({
			discipline: view.discipline,
			institute: view.institute,
			createdAt: view.created_at
		}))
	});
};
