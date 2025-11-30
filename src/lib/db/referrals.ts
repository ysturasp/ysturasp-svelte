import { getPool } from './database';

export interface Referral {
	id: string;
	referrer_id: string;
	referred_id: string;
	created_at: Date;
}

export async function createReferralByCode(
	referralCode: string,
	referredId: string
): Promise<Referral | null> {
	const pool = getPool();
	if (!pool) return null;

	const { getUserByReferralCode } = await import('./users');
	const referrer = await getUserByReferralCode(referralCode);

	if (!referrer) {
		return null;
	}

	return await createReferral(referrer.id, referredId);
}

export async function createReferral(
	referrerId: string,
	referredId: string
): Promise<Referral | null> {
	const pool = getPool();
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
		await updateReferralBonus(referrerId);
	}

	return result.rows[0] || null;
}

export async function getReferralCount(userId: string): Promise<number> {
	const pool = getPool();
	if (!pool) return 0;

	const result = await pool.query(
		'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
		[userId]
	);

	return parseInt(result.rows[0]?.count || '0', 10);
}

export async function getReferralByReferredId(referredId: string): Promise<Referral | null> {
	const pool = getPool();
	if (!pool) return null;

	const result = await pool.query('SELECT * FROM referrals WHERE referred_id = $1', [referredId]);

	return result.rows[0] || null;
}

async function updateReferralBonus(userId: string): Promise<void> {
	const pool = getPool();
	if (!pool) return;

	const referralCount = await getReferralCount(userId);
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
	userId: string
): Promise<{ monthlyLimit: number; referralBonus: number }> {
	const pool = getPool();
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

	const referralCount = await getReferralCount(userId);
	const monthlyLimit = 10 + referralCount * 10;

	await pool.query(
		'INSERT INTO stat_limits (user_id, monthly_limit, referral_bonus) VALUES ($1, $2, $3)',
		[userId, monthlyLimit, referralCount]
	);

	return { monthlyLimit, referralBonus: referralCount };
}
