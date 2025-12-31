import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createSessionToken, shouldRefreshSession, DEFAULT_SESSION_TTL } from '$lib/auth/session';
import { getSessionContext } from '$lib/server/sessionContext';
import { updateSessionActivity } from '$lib/db/userSessions';
import { getRealIp } from '$lib/server/ip';

export const GET: RequestHandler = async ({ cookies, getClientAddress, request }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });
	if (!context) {
		return json({ authenticated: false }, { status: 401 });
	}

	const { user, session, payload, isTelegram } = context;

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

		await updateSessionActivity(
			session.id,
			{
				expiresAt: new Date(refreshed.expiresAt * 1000)
			},
			isTelegram
		);
	}

	let email = user.email;
	let name = user.name;
	let picture = user.picture;

	if (isTelegram && !email) {
		const botUser = user as any;
		if (botUser.username) {
			email = `${botUser.username}@telegram.local`;
		} else if (botUser.chatId) {
			email = `tg_${botUser.chatId}@telegram.local`;
		}
	}

	if (isTelegram && !name) {
		const botUser = user as any;
		if (botUser.firstName && botUser.lastName) {
			name = `${botUser.firstName} ${botUser.lastName}`;
		} else if (botUser.firstName) {
			name = botUser.firstName;
		} else if (botUser.username) {
			name = botUser.username;
		}
	}

	return json({
		authenticated: true,
		user: {
			id: user.id,
			email: email || null,
			name: name || null,
			picture: picture || null
		}
	});
};
