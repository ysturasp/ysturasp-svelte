import { createHash } from 'crypto';
import { getPool } from './database';

export interface UserSession {
	id: string;
	user_id: string;
	token_hash: string;
	device_name: string | null;
	ip_address: string | null;
	user_agent: string | null;
	metadata: Record<string, unknown> | null;
	created_at: Date;
	last_seen: Date;
	expires_at: Date;
	revoked_at: Date | null;
}

export interface CreateUserSessionParams {
	userId: string;
	tokenHash: string;
	deviceName?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
	expiresAt: Date;
	metadata?: Record<string, unknown> | null;
}

export function hashSessionKey(sessionKey: string): string {
	return createHash('sha256').update(sessionKey).digest('hex');
}

export async function createUserSession(params: CreateUserSessionParams): Promise<UserSession> {
	const pool = getPool();
	const result = await pool.query(
		`INSERT INTO user_sessions (user_id, token_hash, device_name, ip_address, user_agent, metadata, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING *`,
		[
			params.userId,
			params.tokenHash,
			params.deviceName || null,
			params.ipAddress || null,
			params.userAgent || null,
			params.metadata || null,
			params.expiresAt
		]
	);

	return result.rows[0];
}

export async function getSessionById(sessionId: string): Promise<UserSession | null> {
	const pool = getPool();
	const result = await pool.query('SELECT * FROM user_sessions WHERE id = $1', [sessionId]);
	return result.rows[0] || null;
}

export async function updateSessionActivity(
	sessionId: string,
	options: { lastSeen?: Date; expiresAt?: Date } = {}
): Promise<void> {
	const pool = getPool();
	const fields: string[] = [];
	const values: Array<string | Date> = [];

	if (options.lastSeen) {
		values.push(options.lastSeen);
		fields.push(`last_seen = $${values.length}`);
	} else {
		fields.push('last_seen = NOW()');
	}

	if (options.expiresAt) {
		values.push(options.expiresAt);
		fields.push(`expires_at = $${values.length}`);
	}

	if (fields.length === 0) {
		return;
	}

	values.push(sessionId);
	await pool.query(
		`UPDATE user_sessions SET ${fields.join(', ')} WHERE id = $${values.length}`,
		values
	);
}

export async function revokeSession(sessionId: string): Promise<void> {
	const pool = getPool();
	await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE id = $1', [sessionId]);
}

export async function revokeSessionsByUser(
	userId: string,
	options: { excludeSessionId?: string } = {}
): Promise<void> {
	const pool = getPool();
	if (options.excludeSessionId) {
		await pool.query(
			'UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id != $2',
			[userId, options.excludeSessionId]
		);
	} else {
		await pool.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1', [
			userId
		]);
	}
}

export async function listUserSessions(userId: string): Promise<UserSession[]> {
	const pool = getPool();
	const result = await pool.query(
		'SELECT * FROM user_sessions WHERE user_id = $1 ORDER BY revoked_at IS NULL DESC, last_seen DESC',
		[userId]
	);
	return result.rows;
}
