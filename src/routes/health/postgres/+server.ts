import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getPool } from '$lib/db/database';

export const GET: RequestHandler = async () => {
	try {
		const pool = getPool(false);

		if (!pool) {
			return json({ status: 'error', reason: 'no_pool' }, { status: 503 });
		}

		const result = await pool.query('SELECT 1 as ok');

		if (!result.rows?.length) {
			return json({ status: 'error', reason: 'no_rows' }, { status: 503 });
		}

		return json({
			status: 'ok',
			timestamp: new Date().toISOString()
		});
	} catch (error) {
		console.error('Postgres health check failed:', error);
		return json({ status: 'error' }, { status: 503 });
	}
};
