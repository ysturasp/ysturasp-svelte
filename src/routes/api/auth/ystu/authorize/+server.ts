import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getOAuthAuthorizeUrl } from '$lib/auth/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { randomBytes } from 'crypto';

export const GET: RequestHandler = async ({ cookies, request, url, getClientAddress }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return new Response('Необходимо авторизоваться в основном профиле', { status: 401 });
	}

	const state = randomBytes(32).toString('hex');

	cookies.set('ystu_oauth_state', state, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 600
	});

	cookies.set('ystu_oauth_user_id', context.user.id, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 600
	});

	cookies.set('ystu_oauth_is_telegram', String(context.isTelegram), {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 600
	});

	const authUrl = getOAuthAuthorizeUrl(state);
	throw redirect(302, authUrl);
};
