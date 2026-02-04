import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getTeacherScheduleKey } from '$lib/utils/redis-keys';
import { trackEventAuto } from '$lib/server/analyticsContext';

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET(event: RequestEvent) {
	const { params, locals } = event;
	try {
		const teacherId = params.teacherId as string;
		if (!teacherId) {
			return json({ error: 'Teacher ID parameter is required' }, { status: 400 });
		}

		const cacheKey = getTeacherScheduleKey(teacherId);
		const redis = getRedisClient();

		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				if (locals.user?.id) {
					trackEventAuto(event, locals.user.id, 'schedule:view', {
						teacherId,
						type: 'teacher',
						cached: true
					}).catch((err) => console.warn('[Analytics] Track failed:', err));
				}
				return json(JSON.parse(cached));
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		const response = await fetch(`${API_BASE}/teacher/${teacherId}`);
		if (!response.ok) {
			if (response.status === 429) {
				return json({ error: 'Too Many Requests' }, { status: 429 });
			}
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

		if (locals.user?.id) {
			trackEventAuto(event, locals.user.id, 'schedule:view', {
				teacherId,
				type: 'teacher',
				cached: false
			}).catch((err) => console.warn('[Analytics] Track failed:', err));
		}

		return json(data);
	} catch (error) {
		console.error('Error fetching teacher schedule:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
