import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getYspuTeachersListKey } from '$lib/utils/redis-keys';

type VkDirectionsResponse = {
	schedules: Array<{
		folderId: string;
		timestamp: number | null;
		semester: string | null;
		year: number | null;
		directions: Array<{ id: string; name: string }>;
	}>;
};

type YspuScheduleResponse = {
	items: Array<{
		courseInfo: { number: string };
		days: Array<{
			lessons: Array<{
				teacherName: string;
			}>;
		}>;
	}>;
};

function splitTeachers(teacherName: string): string[] {
	return teacherName
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function GET({ url, fetch }: RequestEvent) {
	const semesterFolderId = url.searchParams.get('semester');

	try {
		const vkRes = await fetch('/api/vk');
		if (!vkRes.ok) {
			return json({ error: 'Failed to load YSPU semesters' }, { status: vkRes.status });
		}
		const vkData = (await vkRes.json()) as VkDirectionsResponse;

		const targetSchedule =
			(semesterFolderId
				? vkData.schedules.find((s) => s.folderId === semesterFolderId)
				: undefined) ?? vkData.schedules[0];

		if (!targetSchedule) {
			return json({ items: [], meta: { folderId: null } });
		}

		const folderId = targetSchedule.folderId;
		const redis = getRedisClient();
		const cacheKey = getYspuTeachersListKey(folderId);
		const CACHE_TTL = 3600;

		try {
			const cached = await redis.get(cacheKey);
			if (cached) return json(JSON.parse(cached));
		} catch (e) {
			console.error('Redis error (reading cache):', e);
		}

		const teacherSet = new Set<string>();

		const schedules = await Promise.allSettled(
			targetSchedule.directions.map(async (direction) => {
				const r = await fetch(`/api/vk/schedule/${direction.id}`);
				if (!r.ok) throw new Error(`Schedule HTTP ${r.status} for ${direction.id}`);
				return (await r.json()) as YspuScheduleResponse;
			})
		);

		for (const res of schedules) {
			if (res.status !== 'fulfilled') continue;
			for (const item of res.value.items ?? []) {
				for (const day of item.days ?? []) {
					for (const lesson of day.lessons ?? []) {
						for (const t of splitTeachers(lesson.teacherName || '')) {
							teacherSet.add(t);
						}
					}
				}
			}
		}

		const items = Array.from(teacherSet)
			.sort((a, b) => a.localeCompare(b, 'ru'))
			.map((name) => ({
				id: name,
				name
			}));

		const response = { items, meta: { folderId } };

		try {
			await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
		} catch (e) {
			console.error('Redis error (writing cache):', e);
		}

		return json(response);
	} catch (error) {
		console.error('Error building YSPU teachers list:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
