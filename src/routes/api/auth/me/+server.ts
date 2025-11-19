import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserByGoogleId } from '$lib/db/users';
import { verifyGoogleToken } from '$lib/auth/google';

export const GET: RequestHandler = async ({ cookies }) => {
	const token = cookies.get('session_token');
	const userId = cookies.get('user_id');

	if (!token || !userId) {
		return json({ authenticated: false }, { status: 401 });
	}

	const userInfo = await verifyGoogleToken(token);
	if (!userInfo) {
		cookies.delete('session_token', { path: '/' });
		cookies.delete('user_id', { path: '/' });
		return json({ authenticated: false }, { status: 401 });
	}

	const user = await getUserByGoogleId(userInfo.id);
	if (!user) {
		return json({ authenticated: false }, { status: 401 });
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
