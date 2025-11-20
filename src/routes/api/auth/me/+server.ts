import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserById } from '$lib/db/users';
import { createSessionToken, shouldRefreshSession, verifySessionToken } from '$lib/auth/session';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session_token');

	const session = verifySessionToken(token);
	if (!session) {
		cookies.delete('session_token', { path: '/' });
		return json({ authenticated: false }, { status: 401 });
	}

	const user = await getUserById(session.userId);
	if (!user) {
		cookies.delete('session_token', { path: '/' });
		return json({ authenticated: false }, { status: 401 });
	}

	if (shouldRefreshSession(session)) {
		const newSession = createSessionToken(user.id);
		cookies.set('session_token', newSession.token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 30
		});
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
