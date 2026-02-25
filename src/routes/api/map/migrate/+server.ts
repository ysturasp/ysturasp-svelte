import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getPool } from '$lib/db/database';
import { seedMap } from '$lib/db/map-seeder';

export const POST: RequestHandler = async () => {
	const pool = getPool(false);
	if (!pool) return json({ error: 'Database not initialized' }, { status: 500 });

	try {
		console.log('[Migration] Starting map migration...');

		await pool.query('DELETE FROM map_connections');
		await pool.query('DELETE FROM map_stairs_blocks');
		await pool.query('DELETE FROM map_auditoriums');
		await pool.query('DELETE FROM map_custom_elements');
		await pool.query('DELETE FROM map_sections');

		await seedMap(pool);

		return json({ success: true, message: 'Map migrated successfully' });
	} catch (error) {
		console.error('Migration failed:', error);
		return json({ error: 'Migration failed', detail: String(error) }, { status: 500 });
	}
};
