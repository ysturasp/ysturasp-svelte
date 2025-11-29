import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getGoogleOAuthUrl, exchangeGoogleCode, verifyGoogleToken } from '$lib/auth/google';
import { getOrCreateUser } from '$lib/db/users';
import { createSessionToken, DEFAULT_SESSION_TTL } from '$lib/auth/session';
import { createUserSession, hashSessionKey } from '$lib/db/userSessions';
import { randomBytes } from 'crypto';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_TTL_SECONDS = 60 * 5;

function detectDevice(userAgent: string | null): string {
	if (!userAgent) return 'Неизвестное устройство';
	if (/mobile|android|iphone|ipod|ipad/i.test(userAgent)) return 'Мобильное устройство';
	if (/windows/i.test(userAgent)) return 'Windows';
	if (/mac os/i.test(userAgent)) return 'macOS';
	if (/linux/i.test(userAgent)) return 'Linux';
	return 'Браузер';
}

export const GET: RequestHandler = async (event) => {
	const { url, cookies, request, getClientAddress } = event;
	const code = url.searchParams.get('code');
	const stateParam = url.searchParams.get('state');

	const baseUrl = 'https://ahah.ysturasp.ru';
	const redirectUri = `${baseUrl}/api/auth/google`;

	if (!code) {
		const stateValue = randomBytes(16).toString('hex');
		cookies.set(STATE_COOKIE_NAME, stateValue, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: STATE_TTL_SECONDS
		});
		const authUrl = getGoogleOAuthUrl(redirectUri, stateValue);
		console.log('Redirect URI:', redirectUri);
		throw redirect(302, authUrl);
	}

	const storedState = cookies.get(STATE_COOKIE_NAME);
	if (!storedState || !stateParam || storedState !== stateParam) {
		cookies.delete(STATE_COOKIE_NAME, { path: '/' });
		return json({ error: 'Неверный параметр state' }, { status: 400 });
	}

	cookies.delete(STATE_COOKIE_NAME, { path: '/' });

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

	const sessionKey = randomBytes(32).toString('hex');
	const tokenHash = hashSessionKey(sessionKey);
	const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL * 1000);
	const userAgent = request.headers.get('user-agent');
	const deviceName = detectDevice(userAgent);
	const ipAddress = getClientAddress();

	const userSession = await createUserSession({
		userId: user.id,
		tokenHash,
		deviceName,
		ipAddress,
		userAgent,
		expiresAt
	});

	const session = createSessionToken({
		userId: user.id,
		sessionId: userSession.id,
		sessionKey
	});

	cookies.set('session_token', session.token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: DEFAULT_SESSION_TTL
	});

	throw redirect(302, '/formatt');
};
