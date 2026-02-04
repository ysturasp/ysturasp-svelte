import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSubjectStats } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';
import { getRedisClient } from '$lib/config/redis';
import { getStatisticsSubjectKey } from '$lib/utils/redis-keys';
import { trackEventAuto } from '$lib/server/analyticsContext';

const CACHE_TTL = 1296000;

export const GET: RequestHandler = async (event) => {
	const { url, locals } = event;
	const institute = url.searchParams.get('institute') as InstituteId | null;
	const discipline = url.searchParams.get('discipline');

	if (!institute || !discipline) {
		return json({ error: 'Не указаны институт или дисциплина' }, { status: 400 });
	}

	const cacheKey = getStatisticsSubjectKey(institute, discipline);
	const redis = getRedisClient();

	try {
		const cached = await redis.get(cacheKey);
		if (cached) {
			try {
				const cachedData = JSON.parse(cached);
				if (cachedData && cachedData.totalCount > 0) {
					return json(cachedData);
				}
			} catch (e) {
				console.error('Ошибка при парсинге кэша статистики:', e);
			}
		}

		const stats = await getSubjectStats(institute, discipline);

		if (stats && stats.totalCount > 0) {
			try {
				await redis.set(cacheKey, JSON.stringify(stats), 'EX', CACHE_TTL);
			} catch (e) {
				console.error('Ошибка при сохранении в Redis:', e);
			}
		}

		if (locals.user?.id) {
			trackEventAuto(event, locals.user.id, 'stat:view', {
				institute,
				discipline,
				type: 'subject'
			}).catch((err) => console.warn('[Analytics] Track failed:', err));
		}

		return json(stats);
	} catch (error) {
		console.error('Ошибка при получении статистики по предмету:', error);
		return json(
			{
				error: 'Ошибка при получении статистики',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
