import { getPool } from './database';
import type { YSTUTokens } from '$lib/api/ystu';
import { env } from '$env/dynamic/private';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

interface YstuTokenRecord {
	userId: string;
	isTelegram: boolean;
	accessTokenEnc: string;
	refreshTokenEnc: string | null;
	accessExpiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

function getEncryptionKey(): Buffer {
	const key = env.YSTU_TOKENS_SECRET;
	if (!key) {
		throw new Error('YSTU_TOKENS_SECRET is not configured');
	}

	const buf = Buffer.from(key, 'base64');
	if (buf.length !== 32) {
		throw new Error('YSTU_TOKENS_SECRET must be a base64-encoded 32-byte key');
	}
	return buf;
}

function encryptToken(plain: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(12);
	const cipher = createCipheriv('aes-256-gcm', key, iv);

	const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();

	return Buffer.concat([iv, authTag, ciphertext]).toString('base64');
}

function decryptToken(enc: string): string {
	const key = getEncryptionKey();
	const data = Buffer.from(enc, 'base64');

	const iv = data.subarray(0, 12);
	const authTag = data.subarray(12, 28);
	const ciphertext = data.subarray(28);

	const decipher = createDecipheriv('aes-256-gcm', key, iv);
	decipher.setAuthTag(authTag);

	const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return plaintext.toString('utf8');
}

async function ensureTable(isTelegram: boolean): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) {
		throw new Error('База данных недоступна');
	}

	await pool.query(`
		CREATE TABLE IF NOT EXISTS ystu_tokens (
			user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			is_telegram BOOLEAN NOT NULL DEFAULT FALSE,
			access_token_enc TEXT NOT NULL,
			refresh_token_enc TEXT,
			access_expires_at TIMESTAMPTZ NOT NULL,
			grade_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
			PRIMARY KEY (user_id, is_telegram)
		)
	`);

	const columnCheck = await pool.query(`
		SELECT EXISTS (
			SELECT 1 FROM information_schema.columns 
			WHERE table_name = 'ystu_tokens' AND column_name = 'grade_notifications_enabled'
		)
	`);

	if (!columnCheck.rows[0]?.exists) {
		await pool.query(`
			ALTER TABLE ystu_tokens 
			ADD COLUMN grade_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE
		`);
	}
}

export async function saveYstuTokens(
	userId: string,
	isTelegram: boolean,
	tokens: YSTUTokens
): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) {
		throw new Error('База данных недоступна');
	}

	await ensureTable(isTelegram);

	const accessTokenEnc = encryptToken(tokens.access_token);
	const refreshTokenEnc = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null;

	const now = Date.now();
	const accessExpiresAt = new Date(now + tokens.expires_in * 1000);

	await pool.query(
		`
		INSERT INTO ystu_tokens (user_id, is_telegram, access_token_enc, refresh_token_enc, access_expires_at, grade_notifications_enabled)
		VALUES ($1, $2, $3, $4, $5, TRUE)
		ON CONFLICT (user_id, is_telegram) DO UPDATE
		SET access_token_enc = EXCLUDED.access_token_enc,
			refresh_token_enc = EXCLUDED.refresh_token_enc,
			access_expires_at = EXCLUDED.access_expires_at,
			updated_at = NOW()
		`,
		[userId, isTelegram, accessTokenEnc, refreshTokenEnc, accessExpiresAt]
	);
}

export async function getYstuTokensForUser(
	userId: string,
	isTelegram: boolean
): Promise<(YstuTokenRecord & { accessToken: string; refreshToken: string | null }) | null> {
	const pool = getPool(isTelegram);
	if (!pool) {
		throw new Error('База данных недоступна');
	}

	await ensureTable(isTelegram);

	const result = await pool.query(
		`
		SELECT 
			user_id,
			is_telegram,
			access_token_enc,
			refresh_token_enc,
			access_expires_at,
			created_at,
			updated_at
		FROM ystu_tokens
		WHERE user_id = $1 AND is_telegram = $2
		`,
		[userId, isTelegram]
	);

	const row = result.rows[0];
	if (!row) {
		return null;
	}

	return {
		userId: row.user_id,
		isTelegram: row.is_telegram,
		accessTokenEnc: row.access_token_enc,
		refreshTokenEnc: row.refresh_token_enc,
		accessExpiresAt: row.access_expires_at,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		accessToken: decryptToken(row.access_token_enc),
		refreshToken: row.refresh_token_enc ? decryptToken(row.refresh_token_enc) : null
	};
}

export async function clearYstuTokensForUser(userId: string, isTelegram: boolean): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) {
		throw new Error('База данных недоступна');
	}

	await ensureTable(isTelegram);

	await pool.query(
		`
		DELETE FROM ystu_tokens
		WHERE user_id = $1 AND is_telegram = $2
		`,
		[userId, isTelegram]
	);
}

export async function setGradeNotificationsEnabled(
	userId: string,
	enabled: boolean,
	isTelegram: boolean = false
): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	await ensureTable(isTelegram);

	try {
		const result = await pool.query(
			`
			UPDATE ystu_tokens 
			SET grade_notifications_enabled = $1, updated_at = NOW()
			WHERE user_id = $2 AND is_telegram = $3
			`,
			[enabled, userId, isTelegram]
		);

		if (result.rowCount === 0) {
			throw new Error('Токены YSTU не найдены для данного пользователя');
		}
	} catch (error: any) {
		console.error('[Database Error in setGradeNotificationsEnabled]:', error);
		throw new Error(`Ошибка сохранения настройки уведомлений: ${error.message}`);
	}
}

export async function getGradeNotificationsEnabled(
	userId: string,
	isTelegram: boolean = false
): Promise<boolean> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	await ensureTable(isTelegram);

	try {
		const result = await pool.query(
			`
			SELECT grade_notifications_enabled 
			FROM ystu_tokens 
			WHERE user_id = $1 AND is_telegram = $2
			`,
			[userId, isTelegram]
		);

		if (result.rows.length === 0) {
			return false;
		}

		return result.rows[0]?.grade_notifications_enabled ?? true;
	} catch (error: any) {
		console.error('[Database Error in getGradeNotificationsEnabled]:', error);
		return false;
	}
}
