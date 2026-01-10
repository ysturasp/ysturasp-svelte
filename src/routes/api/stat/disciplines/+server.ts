import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDisciplines } from '$lib/db/statGrades';
import type { InstituteId } from '../../../stat/types';
import { getRedisClient } from '$lib/config/redis';
import { getStatisticsDisciplinesKey } from '$lib/utils/redis-keys';

const CACHE_TTL = 3600;

export const GET: RequestHandler = async ({ url }) => {
	const institute = url.searchParams.get('institute') as InstituteId | null;

	if (!institute) {
		return json({ error: 'Не указан институт' }, { status: 400 });
	}

	const cacheKey = getStatisticsDisciplinesKey(institute);
	const redis = getRedisClient();

	try {
		const cached = await redis.get(cacheKey);
		if (cached) {
			try {
				const cachedData = JSON.parse(cached) as string[];
				if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
					return json(cachedData);
				}
			} catch (e) {
				console.error('Ошибка при парсинге кэша дисциплин:', e);
			}
		}

		const disciplines = await getDisciplines(institute);

		if (disciplines && disciplines.length > 0) {
			try {
				await redis.set(cacheKey, JSON.stringify(disciplines), 'EX', CACHE_TTL);
			} catch (e) {
				console.error('Ошибка при сохранении в Redis:', e);
			}
		}

		return json(disciplines);
	} catch (error) {
		console.error('Ошибка при получении списка дисциплин:', error);
		return json(
			{
				error: 'Ошибка при получении списка дисциплин',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
};
