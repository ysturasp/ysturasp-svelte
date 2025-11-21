import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSessionToken, shouldRefreshSession, DEFAULT_SESSION_TTL } from '$lib/auth/session';
import { getSessionContext } from '$lib/server/sessionContext';
import { updateSessionActivity } from '$lib/db/userSessions';

export const GET: RequestHandler = async ({ cookies }) => {
	const context = await getSessionContext(cookies, { touch: false });
	if (!context) {
		return json({ authenticated: false }, { status: 401 });
	}

	const { user, session, payload } = context;

	if (shouldRefreshSession(payload)) {
		const refreshed = createSessionToken({
			userId: user.id,
			sessionId: session.id,
			sessionKey: payload.sessionKey
		});

		cookies.set('session_token', refreshed.token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: DEFAULT_SESSION_TTL
		});

		await updateSessionActivity(session.id, {
			expiresAt: new Date(refreshed.expiresAt * 1000)
		});
	} else {
		await updateSessionActivity(session.id);
	}

	return json({
		authenticated: true,
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			picture: user.picture
		}
	});
};
