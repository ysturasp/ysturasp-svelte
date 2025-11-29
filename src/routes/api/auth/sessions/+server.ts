import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import {
	getSessionById,
	listUserSessions,
	revokeSession,
	revokeSessionsByUser
} from '$lib/db/userSessions';

export const GET: RequestHandler = async ({ cookies, getClientAddress }) => {
	const ipAddress = getClientAddress();
	const context = await getSessionContext(cookies, { ipAddress });
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const sessions = await listUserSessions(context.user.id);

	return json({
		currentSessionId: context.session.id,
		sessions: sessions.map((session) => ({
			id: session.id,
			deviceName: session.device_name,
			ipAddress: session.ip_address,
			userAgent: session.user_agent,
			createdAt: session.created_at,
			lastSeen: session.last_seen,
			expiresAt: session.expires_at,
			revokedAt: session.revoked_at,
			isCurrent: session.id === context.session.id,
			isActive: !session.revoked_at && new Date(session.expires_at).getTime() > Date.now()
		}))
	});
};

type ActionBody =
	| { action: 'revoke'; sessionId?: string }
	| { action: 'revokeOthers' }
	| { action: 'revokeAll' };

export const POST: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	const ipAddress = getClientAddress();
	const context = await getSessionContext(cookies, { ipAddress });
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const body = (await request.json().catch(() => null)) as ActionBody | null;
	if (!body || typeof body.action !== 'string') {
		return json({ error: 'Некорректный запрос' }, { status: 400 });
	}

	if (body.action === 'revoke') {
		if (!body.sessionId) {
			return json({ error: 'sessionId обязателен' }, { status: 400 });
		}

		const target = await getSessionById(body.sessionId);
		if (!target || target.user_id !== context.user.id) {
			return json({ error: 'Сессия не найдена' }, { status: 404 });
		}

		await revokeSession(target.id);

		const revokedCurrent = target.id === context.session.id;
		if (revokedCurrent) {
			cookies.delete('session_token', { path: '/' });
		}

		return json({ success: true, revokedCurrent });
	}

	if (body.action === 'revokeOthers') {
		await revokeSessionsByUser(context.user.id, { excludeSessionId: context.session.id });
		return json({ success: true });
	}

	if (body.action === 'revokeAll') {
		await revokeSessionsByUser(context.user.id);
		cookies.delete('session_token', { path: '/' });
		return json({ success: true, revokedCurrent: true });
	}

	return json({ error: 'Неизвестное действие' }, { status: 400 });
};
