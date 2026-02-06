import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getGroupScheduleKey } from '$lib/utils/redis-keys';
import { trackEventAuto } from '$lib/server/analyticsContext';

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET(event: RequestEvent) {
	try {
		const { params, locals } = event;
		const group = params.group as string;
		if (!group) {
			return json({ error: 'Group parameter is required' }, { status: 400 });
		}

		const cacheKey = getGroupScheduleKey(group);
		const redis = getRedisClient();

		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				trackEventAuto(event, locals.user?.id, null, 'schedule:view', {
					group,
					type: 'group',
					cached: true
				}).catch((err) => console.warn('[Analytics] Track failed:', err));

				return json(JSON.parse(cached));
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		const response = await fetch(`${API_BASE}/group/${group}`);
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

		trackEventAuto(event, locals.user?.id, null, 'schedule:view', {
			group,
			type: 'group',
			cached: false
		}).catch((err) => console.warn('[Analytics] Track failed:', err));

		return json(data);
	} catch (error) {
		console.error('Error fetching schedule:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
