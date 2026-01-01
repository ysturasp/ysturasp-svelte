import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';

const ONLINE_KEY_PREFIX = 'online:';
const CACHE_KEY = 'online:count:cache';

const deleteUser = async (userId: string) => {
	const redis = getRedisClient();
	const key = `${ONLINE_KEY_PREFIX}${userId}`;

	await redis.del(key);

	await redis.del(CACHE_KEY);

	redis.publish('online:updates', 'update').catch((error) => {
		console.error('Error publishing update:', error);
	});
};

export const DELETE: RequestHandler = async ({ params }) => {
	try {
		const { userId } = params;

		if (!userId) {
			return json({ error: 'Invalid userId' }, { status: 400 });
		}

		await deleteUser(userId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ params }) => {
	try {
		const { userId } = params;

		if (!userId) {
			return json({ error: 'Invalid userId' }, { status: 400 });
		}

		await deleteUser(userId);

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
