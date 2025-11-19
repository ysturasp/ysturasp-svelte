import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthUrl, exchangeGoogleCode, verifyGoogleToken } from '$lib/auth/google';
import { getOrCreateUser } from '$lib/db/users';
import { initDatabase } from '$lib/db/database';

export const GET: RequestHandler = async ({ url, cookies }) => {
	try {
		await initDatabase();
	} catch (error) {
		console.error('Ошибка инициализации БД:', error);
	}

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

	cookies.set('session_token', accessToken, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30
	});

	cookies.set('user_id', user.id, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30
	});

	throw redirect(302, '/format');
};
