import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthUrl, exchangeGoogleCode, verifyGoogleToken } from '$lib/auth/google';
import { getOrCreateUser } from '$lib/db/users';
import { createSessionToken } from '$lib/auth/session';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');

	const baseUrl = url.origin;
	const redirectUri = `${baseUrl}/api/auth/google`;

	if (!code) {
		const authUrl = getGoogleOAuthUrl(redirectUri);
		console.log('Redirect URI:', redirectUri);
		throw redirect(302, authUrl);
	}

	const accessToken = await exchangeGoogleCode(code, redirectUri);
	if (!accessToken) {
		console.error('Не удалось получить токен. Redirect URI:', redirectUri);
		return json(
			{ error: 'Не удалось получить токен. Проверьте настройки OAuth.' },
			{ status: 400 }
		);
	}

	const userInfo = await verifyGoogleToken(accessToken);
	if (!userInfo) {
		return json({ error: 'Не удалось получить информацию о пользователе' }, { status: 400 });
	}

	const user = await getOrCreateUser(
		userInfo.id,
		userInfo.email,
		userInfo.name,
		userInfo.picture
	);

	const session = createSessionToken(user.id);

	cookies.set('session_token', session.token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(302, '/format');
};
