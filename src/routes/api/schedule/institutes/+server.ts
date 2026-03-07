import { json } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getInstitutesListKey } from '$lib/utils/redis-keys';
import { fetchWithTimeout } from '$lib/server/fetchWithTimeout';

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET() {
	try {
		const cacheKey = getInstitutesListKey();
		const redis = getRedisClient();

		let cachedData: any | null = null;

		try {
			const cachedRaw = await redis.get(cacheKey);
			if (cachedRaw) {
				const parsed = JSON.parse(cachedRaw);
				cachedData = parsed;
				const { timestamp: _t, ...data } = parsed;
				return json(data);
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		try {
			const response = await fetchWithTimeout(fetch, `${API_BASE}/actual_groups`);
			if (!response.ok) {
				if (cachedData) {
					const { timestamp: _t, ...data } = cachedData;
					console.warn(
						`Institutes (groups) API error ${response.status}, using stale cache`
					);
					return json(data);
				}
				return json(
					{ error: `HTTP error! status: ${response.status}` },
					{ status: response.status }
				);
			}

			const data = await response.json();
			const cachePayload = { ...data, timestamp: Date.now() };

			try {
				await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cachePayload));
			} catch (redisError) {
				console.error('Redis error (writing cache):', redisError);
			}

			return json(data);
		} catch (error) {
			if (cachedData) {
				const { timestamp: _t, ...data } = cachedData;
				console.warn('Institutes (groups) API unavailable, using stale cache');
				return json(data);
			}
			return json(
				{
					error: 'Internal server error',
					details: error instanceof Error ? error.message : String(error)
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.warn('Institutes route:', error instanceof Error ? error.message : String(error));
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
