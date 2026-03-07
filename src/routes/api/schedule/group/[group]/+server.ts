import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getGroupScheduleKey } from '$lib/utils/redis-keys';
import { trackEventAuto } from '$lib/server/analyticsContext';
import { fetchWithTimeout } from '$lib/server/fetchWithTimeout';
import { env } from '$env/dynamic/private';

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';

const CACHE_TTL = Number(env.CACHE_TTL || '604800');
const CACHE_FRESH_MINUTES = Number(env.CACHE_FRESH_MINUTES || '20');

export async function GET(event: RequestEvent) {
	try {
		const { params, locals, fetch } = event;
		const group = params.group as string;
		if (!group) {
			return json({ error: 'Group parameter is required' }, { status: 400 });
		}

		const cacheKey = getGroupScheduleKey(group);
		const redis = getRedisClient();

		let cachedData: any | null = null;
		let cachedTimestamp = 0;

		try {
			const cachedRaw = await redis.get(cacheKey);
			if (cachedRaw) {
				try {
					const cached = JSON.parse(cachedRaw);
					cachedData = cached;
					cachedTimestamp = cached.timestamp || 0;

					const ageMinutes = (Date.now() - cachedTimestamp) / 1000 / 60;

					if (ageMinutes < CACHE_FRESH_MINUTES && cachedTimestamp > 0) {
						const { timestamp, ...data } = cached;

						trackEventAuto(event, locals.user?.id, null, 'schedule:view', {
							group,
							type: 'group',
							cached: true,
							fresh: true
						}).catch((err) => console.warn('[Analytics] Track failed:', err));

						return json(data);
					}
				} catch (e) {
					console.warn('Failed to parse schedule cache for group', group, e);
				}
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		try {
			const url = `${API_BASE}/group/${encodeURIComponent(group)}`;
			const response = await fetchWithTimeout(fetch, url);

			if (!response.ok) {
				if (cachedData) {
					const { timestamp, ...data } = cachedData;

					console.warn(
						`Schedule API error ${response.status} for ${group}, using stale cache`
					);

					trackEventAuto(event, locals.user?.id, null, 'schedule:view', {
						group,
						type: 'group',
						cached: true,
						fresh: false
					}).catch((err) => console.warn('[Analytics] Track failed:', err));

					return json(data);
				}

				return json(
					{ error: `HTTP error! status: ${response.status}` },
					{ status: response.status }
				);
			}

			const data = await response.json();

			const cachePayload = {
				...data,
				timestamp: Date.now()
			};

			try {
				await redis.set(cacheKey, JSON.stringify(cachePayload), 'EX', CACHE_TTL);
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
			if (cachedData) {
				const { timestamp, ...data } = cachedData;

				trackEventAuto(event, locals.user?.id, null, 'schedule:view', {
					group,
					type: 'group',
					cached: true,
					fresh: false
				}).catch((err) => console.warn('[Analytics] Track failed:', err));

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
		console.warn('Schedule route:', error instanceof Error ? error.message : String(error));
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
