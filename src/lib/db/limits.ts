import { getPool } from './database';

export interface UserLimits {
	id: string;
	user_id: string;
	free_formats_used: number;
	paid_formats_used: number;
	paid_formats_purchased: number;
	updated_at: Date;
}

const FREE_FORMATS_LIMIT = 3;

export async function getUserLimits(userId: string): Promise<UserLimits> {
	const pool = getPool();
	let result = await pool.query('SELECT * FROM user_limits WHERE user_id = $1', [userId]);

	if (result.rows.length === 0) {
		await pool.query('INSERT INTO user_limits (user_id) VALUES ($1)', [userId]);
		result = await pool.query('SELECT * FROM user_limits WHERE user_id = $1', [userId]);
	}

	return result.rows[0];
}

export async function canFormat(
	userId: string
): Promise<{ can: boolean; reason?: string; remaining?: number }> {
	const limits = await getUserLimits(userId);
	const totalAvailable =
		limits.free_formats_used < FREE_FORMATS_LIMIT
			? FREE_FORMATS_LIMIT - limits.free_formats_used
			: 0;
	const paidAvailable = limits.paid_formats_purchased - limits.paid_formats_used;
	const totalRemaining = totalAvailable + paidAvailable;

	if (totalRemaining > 0) {
		return { can: true, remaining: totalRemaining };
	}

	return {
		can: false,
		reason: 'Достигнут лимит форматирований. Пожалуйста, приобретите дополнительные форматирования.',
		remaining: 0
	};
}

export async function useFormat(
	userId: string,
	fileName: string,
	isPaid: boolean = false
): Promise<boolean> {
	const limits = await getUserLimits(userId);
	const pool = getPool();

	if (limits.free_formats_used < FREE_FORMATS_LIMIT) {
		await pool.query(
			'UPDATE user_limits SET free_formats_used = free_formats_used + 1, updated_at = NOW() WHERE user_id = $1',
			[userId]
		);
	} else if (limits.paid_formats_used < limits.paid_formats_purchased) {
		await pool.query(
			'UPDATE user_limits SET paid_formats_used = paid_formats_used + 1, updated_at = NOW() WHERE user_id = $1',
			[userId]
		);
		isPaid = true;
	} else {
		return false;
	}

	await pool.query(
		'INSERT INTO format_history (user_id, file_name, is_paid) VALUES ($1, $2, $3)',
		[userId, fileName, isPaid]
	);

	return true;
}

export async function addPaidFormats(userId: string, count: number): Promise<void> {
	const pool = getPool();
	await pool.query(
		'UPDATE user_limits SET paid_formats_purchased = paid_formats_purchased + $1, updated_at = NOW() WHERE user_id = $2',
		[count, userId]
	);
}
