import type { Cookies } from '@sveltejs/kit';
import { verifySessionToken, type SessionPayload } from '$lib/auth/session';
import {
	getSessionById,
	hashSessionKey,
	updateSessionActivity,
	type UserSession
} from '$lib/db/userSessions';
import { getUserById, type User } from '$lib/db/users';

export interface SessionContext {
	user: User;
	session: UserSession;
	payload: SessionPayload;
	isTelegram: boolean;
}

export async function getSessionContext(
	cookies: Cookies,
	{ touch = true, ipAddress }: { touch?: boolean; ipAddress?: string | null } = {}
): Promise<SessionContext | null> {
	const token = cookies.get('session_token');
	if (!token) {
		return null;
	}

	const payload = verifySessionToken(token);
	if (!payload) {
		cookies.delete('session_token', { path: '/' });
		return null;
	}

	let session = await getSessionById(payload.sessionId, false);
	let isTelegram = false;

	if (!session) {
		session = await getSessionById(payload.sessionId, true);
		isTelegram = true;
	}

	if (!session || session.user_id !== payload.userId) {
		cookies.delete('session_token', { path: '/' });
		return null;
	}

	if (session.revoked_at || new Date(session.expires_at).getTime() <= Date.now()) {
		cookies.delete('session_token', { path: '/' });
		return null;
	}

	const hashed = hashSessionKey(payload.sessionKey);
	if (session.token_hash !== hashed) {
		cookies.delete('session_token', { path: '/' });
		return null;
	}

	if (
		session.metadata &&
		typeof session.metadata === 'object' &&
		'isTelegram' in session.metadata
	) {
		isTelegram = Boolean(session.metadata.isTelegram);
	}

	const user = await getUserById(payload.userId, isTelegram);
	if (!user) {
		cookies.delete('session_token', { path: '/' });
		return null;
	}

	if (touch || (ipAddress !== undefined && session.ip_address !== ipAddress)) {
		const updateOptions: { ipAddress?: string | null } = {};
		if (ipAddress !== undefined && session.ip_address !== ipAddress) {
			updateOptions.ipAddress = ipAddress;
		}
		await updateSessionActivity(session.id, updateOptions, isTelegram);
	}

	return { user, session, payload, isTelegram };
}
