import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { revokeSession } from '$lib/db/userSessions';

export const POST: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies, { touch: false });

	if (context) {
		await revokeSession(context.session.id);
	}

	cookies.delete('session_token', { path: '/' });
	return json({ success: true });
};
