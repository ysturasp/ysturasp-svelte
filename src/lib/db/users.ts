import { getPool } from './database';
import { randomBytes } from 'crypto';

export interface User {
	id: string;
	google_id: string;
	email: string;
	name: string | null;
	picture: string | null;
	referral_code: string | null;
	created_at: Date;
	updated_at: Date;
}

function generateReferralCode(): string {
	return randomBytes(8).toString('base64url').substring(0, 12).toUpperCase();
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
	const pool = getPool();
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
	return result.rows[0] || null;
}

export async function createUser(
	googleId: string,
	email: string,
	name?: string,
	picture?: string
): Promise<User> {
	const pool = getPool();
	if (!pool) throw new Error('База данных недоступна');

	let referralCode = generateReferralCode();
	let attempts = 0;

	while (attempts < 10) {
		const existing = await pool.query('SELECT id FROM users WHERE referral_code = $1', [
			referralCode
		]);

		if (existing.rows.length === 0) {
			break;
		}

		referralCode = generateReferralCode();
		attempts++;
	}

	const result = await pool.query(
		'INSERT INTO users (google_id, email, name, picture, referral_code) VALUES ($1, $2, $3, $4, $5) RETURNING *',
		[googleId, email, name || null, picture || null, referralCode]
	);
	return result.rows[0];
}

export async function getUserById(id: string): Promise<User | null> {
	const pool = getPool();
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0] || null;
}

export async function getUserByReferralCode(referralCode: string): Promise<User | null> {
	const pool = getPool();
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM users WHERE referral_code = $1', [referralCode]);
	return result.rows[0] || null;
}

export async function ensureReferralCode(userId: string): Promise<string> {
	const pool = getPool();
	if (!pool) throw new Error('База данных недоступна');

	const user = await getUserById(userId);
	if (!user) throw new Error('Пользователь не найден');

	if (user.referral_code) {
		return user.referral_code;
	}

	let referralCode = generateReferralCode();
	let attempts = 0;

	while (attempts < 10) {
		const existing = await pool.query('SELECT id FROM users WHERE referral_code = $1', [
			referralCode
		]);

		if (existing.rows.length === 0) {
			break;
		}

		referralCode = generateReferralCode();
		attempts++;
	}

	await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [referralCode, userId]);

	return referralCode;
}

export async function getOrCreateUser(
	googleId: string,
	email: string,
	name?: string,
	picture?: string
): Promise<User> {
	const existing = await getUserByGoogleId(googleId);
	if (existing) {
		const pool = getPool();
		if (!pool) throw new Error('База данных недоступна');
		await pool.query(
			'UPDATE users SET email = $1, name = $2, picture = $3, updated_at = NOW() WHERE google_id = $4',
			[email, name || null, picture || null, googleId]
		);
		return { ...existing, email, name: name || null, picture: picture || null };
	}
	return await createUser(googleId, email, name, picture);
}
