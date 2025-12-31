import { getPool } from './database';

export interface StatView {
	id: string;
	user_id: string;
	discipline: string;
	institute: string;
	created_at: Date;
}

export async function createStatView(
	userId: string,
	discipline: string,
	institute: string,
	isTelegram: boolean = false
): Promise<StatView | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;

	const result = await pool.query(
		'INSERT INTO stat_views (user_id, discipline, institute) VALUES ($1, $2, $3) RETURNING *',
		[userId, discipline, institute]
	);

	return result.rows[0] || null;
}

export async function getMonthlyViewCount(
	userId: string,
	isTelegram: boolean = false
): Promise<number> {
	const pool = getPool(isTelegram);
	if (!pool) return 0;

	const now = new Date();
	const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const result = await pool.query(
		`SELECT COUNT(*) as count FROM stat_views 
		 WHERE user_id = $1 AND created_at >= $2`,
		[userId, firstDayOfMonth]
	);

	return parseInt(result.rows[0]?.count || '0', 10);
}

export async function getRecentlyViewed(userId: string, limit: number = 5): Promise<StatView[]> {
	const pool = getPool();
	if (!pool) return [];

	const result = await pool.query(
		`SELECT DISTINCT ON (discipline, institute) 
		 id, user_id, discipline, institute, created_at
		 FROM stat_views 
		 WHERE user_id = $1 
		 ORDER BY discipline, institute, created_at DESC 
		 LIMIT $2`,
		[userId, limit]
	);

	return result.rows || [];
}
