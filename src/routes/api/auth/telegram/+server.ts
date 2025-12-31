import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractTelegramUser, isInitDataValid } from '$lib/auth/telegram';
import { getOrCreateUser } from '$lib/db/users';
import { createSessionToken, DEFAULT_SESSION_TTL } from '$lib/auth/session';
import { createUserSession, hashSessionKey } from '$lib/db/userSessions';
import { randomBytes } from 'crypto';
import { getRealIp } from '$lib/server/ip';

const RETURN_URL_COOKIE_NAME = 'oauth_return_url';

function detectDevice(userAgent: string | null): string {
	if (!userAgent) return 'Неизвестное устройство';
	if (/mobile|android|iphone|ipod|ipad/i.test(userAgent)) return 'Мобильное устройство';
	if (/windows/i.test(userAgent)) return 'Windows';
	if (/mac os/i.test(userAgent)) return 'macOS';
	if (/linux/i.test(userAgent)) return 'Linux';
	return 'Браузер';
}

export const POST: RequestHandler = async (event) => {
	const { request, cookies, getClientAddress } = event;

	try {
		const body = await request.json();
		const initData = body.initData;

		if (!initData || typeof initData !== 'string') {
			return json({ error: 'initData не предоставлен' }, { status: 400 });
		}

		if (!isInitDataValid(initData)) {
			return json({ error: 'Неверный или устаревший initData' }, { status: 400 });
		}

		const telegramUser = extractTelegramUser(initData);
		if (!telegramUser) {
			return json({ error: 'Не удалось извлечь информацию о пользователе' }, { status: 400 });
		}

		const email = telegramUser.username
			? `${telegramUser.username}@telegram.local`
			: `tg_${telegramUser.id}@telegram.local`;

		const name = telegramUser.last_name
			? `${telegramUser.first_name} ${telegramUser.last_name}`
			: telegramUser.first_name;

		const user = await getOrCreateUser(
			{
				telegramId: telegramUser.id,
				email: email || undefined,
				name,
				picture: telegramUser.photo_url || undefined,
				username: telegramUser.username || undefined,
				firstName: telegramUser.first_name || undefined,
				lastName: telegramUser.last_name || undefined
			},
			true
		);

		const sessionKey = randomBytes(32).toString('hex');
		const tokenHash = hashSessionKey(sessionKey);
		const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL * 1000);
		const userAgent = request.headers.get('user-agent');
		const deviceName = detectDevice(userAgent);
		const ipAddress = getRealIp(request, getClientAddress);

		const userSession = await createUserSession(
			{
				userId: user.id,
				tokenHash,
				deviceName,
				ipAddress,
				userAgent,
				expiresAt
			},
			true
		);

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

		const savedReturnUrl = cookies.get(RETURN_URL_COOKIE_NAME);
		cookies.delete(RETURN_URL_COOKIE_NAME, { path: '/' });

		const redirectTo =
			savedReturnUrl && savedReturnUrl.startsWith('/') ? savedReturnUrl : '/format';

		return json({
			success: true,
			redirectTo
		});
	} catch (error) {
		console.error('Ошибка авторизации через Telegram:', error);
		return json({ error: 'Ошибка при авторизации через Telegram' }, { status: 500 });
	}
};
