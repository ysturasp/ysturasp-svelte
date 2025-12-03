import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { getOrCreateUser } from '$lib/db/users';
import { createUserSession, hashSessionKey } from '$lib/db/userSessions';
import { createSessionToken, DEFAULT_SESSION_TTL } from '$lib/auth/session';
import { randomBytes } from 'crypto';
import { getRealIp } from '$lib/server/ip';

const TEST_USER_GOOGLE_ID = 'manual-test-login';

function detectDevice(userAgent: string | null): string {
	if (!userAgent) return 'Неизвестное устройство';
	if (/mobile|android|iphone|ipod|ipad/i.test(userAgent)) return 'Мобильное устройство';
	if (/windows/i.test(userAgent)) return 'Windows';
	if (/mac os/i.test(userAgent)) return 'macOS';
	if (/linux/i.test(userAgent)) return 'Linux';
	return 'Браузер';
}

function normalizeEmail(value: unknown): string {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function readPassword(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const expectedEmail = (env.TEST_ACCOUNT_EMAIL || 'test@ysturasp.ru').toLowerCase();
	const expectedPassword = env.TEST_ACCOUNT_PASSWORD || 'testpassword123';

	if (!expectedEmail || !expectedPassword) {
		return json({ error: 'Тестовый вход недоступен' }, { status: 503 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Некорректный формат запроса' }, { status: 400 });
	}

	const email = normalizeEmail((body as Record<string, unknown>)?.email);
	const password = readPassword((body as Record<string, unknown>)?.password);

	if (email !== expectedEmail || password !== expectedPassword) {
		await new Promise((resolve) => setTimeout(resolve, 400));
		return json({ error: 'Неверный логин или пароль' }, { status: 401 });
	}

	const displayName = env.TEST_ACCOUNT_NAME || 'Тестовый аккаунт';
	const picture = env.TEST_ACCOUNT_AVATAR || null;

	const user = await getOrCreateUser(
		TEST_USER_GOOGLE_ID,
		expectedEmail,
		displayName,
		picture || undefined
	);

	const sessionKey = randomBytes(32).toString('hex');
	const tokenHash = hashSessionKey(sessionKey);
	const expiresAt = new Date(Date.now() + DEFAULT_SESSION_TTL * 1000);
	const userAgent = request.headers.get('user-agent');
	const deviceName = detectDevice(userAgent);
	const ipAddress = getRealIp(request, getClientAddress);

	const userSession = await createUserSession({
		userId: user.id,
		tokenHash,
		deviceName,
		ipAddress,
		userAgent,
		expiresAt,
		metadata: { mode: 'manual_test' }
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

	return json({ ok: true });
};
