import { getPool } from './database';

export interface Referral {
	id: string;
	referrer_id: string;
	referred_id: string;
	created_at: Date;
}

export async function createReferralByCode(
	referralCode: string,
	referredId: string,
	isTelegram: boolean = false
): Promise<Referral | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;

	const { getUserByReferralCode } = await import('./users');
	let referrer = await getUserByReferralCode(referralCode, false);
	if (!referrer) {
		referrer = await getUserByReferralCode(referralCode, true);
	}

	if (!referrer) {
		return null;
	}

	const referrerIsTelegram = !!(referrer as any).chatId;
	return await createReferral(referrer.id, referredId, referrerIsTelegram);
}

export async function createReferral(
	referrerId: string,
	referredId: string,
	isTelegram: boolean = false
): Promise<Referral | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;

	if (referrerId === referredId) {
		return null;
	}

	const existing = await pool.query('SELECT * FROM referrals WHERE referred_id = $1', [
		referredId
	]);

	if (existing.rows.length > 0) {
		return null;
	}

	const result = await pool.query(
		'INSERT INTO referrals (referrer_id, referred_id) VALUES ($1, $2) RETURNING *',
		[referrerId, referredId]
	);

	if (result.rows.length > 0) {
		await updateReferralBonus(referrerId, isTelegram);
	}

	return result.rows[0] || null;
}

export async function getReferralCount(
	userId: string,
	isTelegram: boolean = false
): Promise<number> {
	const pool = getPool(isTelegram);
	if (!pool) return 0;

	const result = await pool.query(
		'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
		[userId]
	);

	return parseInt(result.rows[0]?.count || '0', 10);
}

export async function getReferralByReferredId(
	referredId: string,
	isTelegram: boolean = false
): Promise<Referral | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;

	const result = await pool.query('SELECT * FROM referrals WHERE referred_id = $1', [referredId]);

	return result.rows[0] || null;
}

async function updateReferralBonus(userId: string, isTelegram: boolean = false): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) return;

	const referralCount = await getReferralCount(userId, isTelegram);
	const bonusLimit = 10 + referralCount * 10;

	await pool.query(
		`INSERT INTO stat_limits (user_id, monthly_limit, referral_bonus)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (user_id) 
		 DO UPDATE SET monthly_limit = $2, referral_bonus = $3, updated_at = NOW()`,
		[userId, bonusLimit, referralCount]
	);
}

export async function getStatLimit(
	userId: string,
	isTelegram: boolean = false
): Promise<{ monthlyLimit: number; referralBonus: number }> {
	const pool = getPool(isTelegram);
	if (!pool) return { monthlyLimit: 10, referralBonus: 0 };

	const result = await pool.query(
		'SELECT monthly_limit, referral_bonus FROM stat_limits WHERE user_id = $1',
		[userId]
	);

	if (result.rows.length > 0) {
		return {
			monthlyLimit: result.rows[0].monthly_limit,
			referralBonus: result.rows[0].referral_bonus
		};
	}

	const referralCount = await getReferralCount(userId, isTelegram);
	const monthlyLimit = 10 + referralCount * 10;

	await pool.query(
		'INSERT INTO stat_limits (user_id, monthly_limit, referral_bonus) VALUES ($1, $2, $3)',
		[userId, monthlyLimit, referralCount]
	);

	return { monthlyLimit, referralBonus: referralCount };
}
