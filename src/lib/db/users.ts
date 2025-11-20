import { getPool } from './database';

export interface User {
	id: string;
	google_id: string;
	email: string;
	name: string | null;
	picture: string | null;
	created_at: Date;
	updated_at: Date;
}

export async function getUserByGoogleId(googleId: string): Promise<User | null> {
	const pool = getPool();
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
	const result = await pool.query(
		'INSERT INTO users (google_id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *',
		[googleId, email, name || null, picture || null]
	);
	return result.rows[0];
}

export async function getUserById(id: string): Promise<User | null> {
	const pool = getPool();
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0] || null;
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
		await pool.query(
			'UPDATE users SET email = $1, name = $2, picture = $3, updated_at = NOW() WHERE google_id = $4',
			[email, name || null, picture || null, googleId]
		);
		return { ...existing, email, name: name || null, picture: picture || null };
	}
	return await createUser(googleId, email, name, picture);
}
