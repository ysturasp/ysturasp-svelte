import { json } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET() {
	try {
		const cacheKey = 'schedule:institutes';
		const redis = getRedisClient();

		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				return json(JSON.parse(cached));
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		const response = await fetch(`${API_BASE}/actual_groups`);
		if (!response.ok) {
			return json(
				{ error: `HTTP error! status: ${response.status}` },
				{ status: response.status }
			);
		}

		const data = await response.json();

		try {
			await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
		} catch (redisError) {
			console.error('Redis error (writing cache):', redisError);
		}

		return json(data);
	} catch (error) {
		console.error('Error fetching institutes:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
