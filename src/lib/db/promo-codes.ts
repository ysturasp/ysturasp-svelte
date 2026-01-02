import { getPool } from './database';

export interface PromoCode {
	id: string;
	code: string;
	description: string | null;
	formats_count: number;
	reward_type: 'formats';
	max_uses: number | null;
	used_count: number;
	valid_from: Date;
	valid_until: Date | null;
	is_active: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface PromoCodeUse {
	id: string;
	promo_code_id: string;
	user_id: string;
	created_at: Date;
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
	const pool = getPool(false);
	if (!pool) return null;

	const result = await pool.query('SELECT * FROM promo_codes WHERE code = $1', [
		code.toUpperCase().trim()
	]);
	return result.rows[0] || null;
}

export async function hasUserUsedPromoCode(
	userId: string,
	promoCodeId: string,
	isTelegram: boolean = false
): Promise<boolean> {
	const pool = getPool(isTelegram);
	if (!pool) return false;

	const result = await pool.query(
		'SELECT id FROM promo_code_uses WHERE user_id = $1 AND promo_code_id = $2',
		[userId, promoCodeId]
	);
	return result.rows.length > 0;
}

export async function isValidPromoCode(promoCode: PromoCode): Promise<{
	valid: boolean;
	reason?: string;
}> {
	const now = new Date();

	if (!promoCode.is_active) {
		return { valid: false, reason: 'Промокод неактивен' };
	}

	if (new Date(promoCode.valid_from) > now) {
		return { valid: false, reason: 'Промокод еще не вступил в силу' };
	}

	if (promoCode.valid_until && new Date(promoCode.valid_until) < now) {
		return { valid: false, reason: 'Срок действия промокода истек' };
	}

	if (promoCode.max_uses !== null && promoCode.used_count >= promoCode.max_uses) {
		return { valid: false, reason: 'Промокод исчерпан' };
	}

	return { valid: true };
}

export async function applyPromoCode(
	userId: string,
	promoCodeId: string,
	isTelegram: boolean = false
): Promise<{ success: boolean; formatsAdded?: number; error?: string }> {
	const mainPool = getPool(false);
	const userPool = getPool(isTelegram);

	if (!mainPool || !userPool) {
		return { success: false, error: 'База данных недоступна' };
	}

	try {
		await userPool.query('BEGIN');

		const promoCodeResult = await mainPool.query(
			'SELECT * FROM promo_codes WHERE id = $1 FOR UPDATE',
			[promoCodeId]
		);

		if (promoCodeResult.rows.length === 0) {
			await userPool.query('ROLLBACK');
			return { success: false, error: 'Промокод не найден' };
		}

		const promoCode = promoCodeResult.rows[0] as PromoCode;

		const validation = await isValidPromoCode(promoCode);
		if (!validation.valid) {
			await userPool.query('ROLLBACK');
			return { success: false, error: validation.reason || 'Промокод недействителен' };
		}

		const useCheck = await userPool.query(
			'SELECT id FROM promo_code_uses WHERE user_id = $1 AND promo_code_id = $2',
			[userId, promoCodeId]
		);
		if (useCheck.rows.length > 0) {
			await userPool.query('ROLLBACK');
			return { success: false, error: 'Вы уже использовали этот промокод' };
		}

		if (promoCode.reward_type !== 'formats') {
			await userPool.query('ROLLBACK');
			return { success: false, error: 'Неподдерживаемый тип награды' };
		}

		const formatsToAdd = promoCode.formats_count;
		if (formatsToAdd <= 0) {
			await userPool.query('ROLLBACK');
			return { success: false, error: 'Промокод не предоставляет награду' };
		}

		await userPool.query(
			'INSERT INTO promo_code_uses (promo_code_id, user_id) VALUES ($1, $2)',
			[promoCodeId, userId]
		);

		await userPool.query(
			`INSERT INTO user_limits (user_id, paid_formats_purchased, updated_at) 
			 VALUES ($2, $1, NOW())
			 ON CONFLICT (user_id) 
			 DO UPDATE SET paid_formats_purchased = user_limits.paid_formats_purchased + $1, updated_at = NOW()`,
			[formatsToAdd, userId]
		);

		await userPool.query('COMMIT');

		await mainPool.query(
			'UPDATE promo_codes SET used_count = used_count + 1, updated_at = NOW() WHERE id = $1',
			[promoCodeId]
		);

		return { success: true, formatsAdded: formatsToAdd };
	} catch (error) {
		await userPool.query('ROLLBACK');
		console.error('Ошибка при применении промокода:', error);

		if (error instanceof Error && error.message.includes('duplicate key')) {
			return { success: false, error: 'Вы уже использовали этот промокод' };
		}

		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка'
		};
	}
}

export async function getUserPromoCodes(
	userId: string,
	isTelegram: boolean = false
): Promise<
	Array<{
		id: string;
		promo_code_id: string;
		code: string;
		description: string | null;
		formats_count: number;
		created_at: Date;
	}>
> {
	const userPool = getPool(isTelegram);
	const mainPool = getPool(false);
	if (!userPool || !mainPool) return [];

	const result = await userPool.query(
		`SELECT 
			pcuse.id,
			pcuse.promo_code_id,
			pcuse.created_at
		FROM promo_code_uses pcuse
		WHERE pcuse.user_id = $1
		ORDER BY pcuse.created_at DESC
		LIMIT 50`,
		[userId]
	);

	const promoCodeIds = result.rows.map((row) => row.promo_code_id);
	if (promoCodeIds.length === 0) return [];

	const promoCodeResult = await mainPool.query(
		`SELECT id, code, description, formats_count FROM promo_codes WHERE id = ANY($1)`,
		[promoCodeIds]
	);

	const promoCodeMap = new Map(
		promoCodeResult.rows.map((row) => [
			row.id,
			{ code: row.code, description: row.description, formats_count: row.formats_count }
		])
	);

	return result.rows
		.map((row) => {
			const promoCode = promoCodeMap.get(row.promo_code_id);
			if (!promoCode) return null;
			return {
				id: row.id,
				promo_code_id: row.promo_code_id,
				code: promoCode.code,
				description: promoCode.description,
				formats_count: promoCode.formats_count,
				created_at: row.created_at
			};
		})
		.filter((item) => item !== null) as Array<{
		id: string;
		promo_code_id: string;
		code: string;
		description: string | null;
		formats_count: number;
		created_at: Date;
	}>;
}

export async function createPromoCode(params: {
	code: string;
	description?: string | null;
	formats_count: number;
	max_uses?: number | null;
	valid_from?: Date;
	valid_until?: Date | null;
	is_active?: boolean;
}): Promise<PromoCode> {
	const pool = getPool(false);
	if (!pool) throw new Error('База данных недоступна');

	const result = await pool.query(
		`INSERT INTO promo_codes (
			code, description, formats_count, reward_type, max_uses, 
			valid_from, valid_until, is_active
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
		[
			params.code.toUpperCase().trim(),
			params.description || null,
			params.formats_count,
			'formats',
			params.max_uses ?? null,
			params.valid_from || new Date(),
			params.valid_until || null,
			params.is_active !== undefined ? params.is_active : true
		]
	);
	return result.rows[0];
}
