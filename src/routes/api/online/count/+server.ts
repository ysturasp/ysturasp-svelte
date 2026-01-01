import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';

const ONLINE_KEY_PREFIX = 'online:';
const CACHE_KEY = 'online:count:cache';
const CACHE_TTL = 2;

export const GET: RequestHandler = async ({ setHeaders }) => {
	try {
		const redis = getRedisClient();

		const cached = await redis.get(CACHE_KEY);
		if (cached) {
			try {
				const cachedData = JSON.parse(cached);
				setHeaders({
					'Cache-Control': 'public, max-age=2'
				});
				return json(cachedData);
			} catch (e) {}
		}

		const keys = await redis.keys(`${ONLINE_KEY_PREFIX}*`);

		if (keys.length === 0) {
			const result = { count: 0, users: {}, groupStats: {} };
			await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
			setHeaders({
				'Cache-Control': 'public, max-age=2'
			});
			return json(result);
		}

		const userKeys = keys.filter((key) => !key.startsWith('online:challenge:'));

		if (userKeys.length === 0) {
			const result = { count: 0, users: {}, groupStats: {} };
			await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));
			setHeaders({
				'Cache-Control': 'public, max-age=2'
			});
			return json(result);
		}

		const users: Record<string, any> = {};
		const groupStats: Record<string, number> = {};

		const values = await redis.mget(...userKeys);

		values.forEach((value, index) => {
			if (value) {
				try {
					const userData = JSON.parse(value);
					const userId = userKeys[index].replace(ONLINE_KEY_PREFIX, '');

					if (userData && (userData.userId || userId)) {
						users[userId] = userData;

						const group = userData.group || 'Гость';
						groupStats[group] = (groupStats[group] || 0) + 1;
					}
				} catch (e) {
					console.error('Error parsing user data:', e);
				}
			}
		});

		const result = {
			count: Object.keys(users).length,
			users,
			groupStats
		};

		await redis.setex(CACHE_KEY, CACHE_TTL, JSON.stringify(result));

		setHeaders({
			'Cache-Control': 'public, max-age=2'
		});

		return json(result);
	} catch (error) {
		console.error('Error getting online count:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
