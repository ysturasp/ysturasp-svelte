import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getYspuTeacherScheduleKey } from '$lib/utils/redis-keys';
import { trackEventAuto } from '$lib/server/analyticsContext';

type VkDirectionsResponse = {
	schedules: Array<{
		folderId: string;
		directions: Array<{ id: string; name: string }>;
	}>;
};

type YspuScheduleResponse = {
	items: Array<{
		courseInfo: { number: string; startDate?: string | null };
		days: Array<{
			info: { type: number };
			lessons: Array<any>;
		}>;
	}>;
};

function splitTeachers(teacherName: string): string[] {
	return teacherName
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function GET(event: RequestEvent) {
	const { params, url, fetch, locals } = event;
	const rawTeacherId = params.id as string;
	const semesterFolderId = url.searchParams.get('semester');
	const semesterName = url.searchParams.get('semesterName');

	const teacherName = decodeURIComponent(rawTeacherId || '').trim();
	if (!teacherName) {
		return json({ error: 'Teacher id is required' }, { status: 400 });
	}

	try {
		const vkRes = await fetch('/api/yspu/groups');
		if (!vkRes.ok) {
			return json({ error: 'Failed to load YSPU semesters' }, { status: vkRes.status });
		}
		const vkData = (await vkRes.json()) as VkDirectionsResponse;

		const targetSchedule =
			(semesterFolderId
				? vkData.schedules.find((s) => s.folderId === semesterFolderId)
				: undefined) ?? vkData.schedules[0];

		if (!targetSchedule) {
			return json({ items: [] });
		}

		const folderId = targetSchedule.folderId;
		const cacheKey = getYspuTeacherScheduleKey(folderId, rawTeacherId);
		const redis = getRedisClient();
		const CACHE_TTL = 3600;

		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				trackEventAuto(event, locals?.user?.id, null, 'yspu:teacher:view', {
					teacherName: rawTeacherId,
					folderId,
					semesterName,
					cached: true
				}).catch((err) => console.warn('[Analytics] Track failed:', err));

				return json(JSON.parse(cached));
			}
		} catch (e) {
			console.error('Redis error (reading cache):', e);
		}

		const dayMap = new Map<
			number,
			Array<{
				number: number;
				lessonName: string;
				type: 'lecture' | 'practice' | 'other';
				timeRange: string;
				startAt: string;
				endAt: string;
				auditoryName: string | null;
				isDistant: boolean;
				isStream: boolean;
				isDivision: boolean;
				groups: string;
				direction: string;
				additionalSlots?: { startAt: string; endAt: string }[];
				originalTimeTitle?: string;
			}>
		>();

		const schedules = await Promise.allSettled(
			targetSchedule.directions.map(async (direction) => {
				const r = await fetch(`/api/yspu/group/${direction.id}?noAnalytics=1`);
				if (!r.ok) throw new Error(`Schedule HTTP ${r.status} for ${direction.id}`);
				const data = (await r.json()) as YspuScheduleResponse;
				return { directionName: direction.name, data };
			})
		);

		for (const res of schedules) {
			if (res.status !== 'fulfilled') continue;

			const directionName = res.value.directionName;
			for (const item of res.value.data.items ?? []) {
				const groupNumber = item.courseInfo?.number;
				if (!groupNumber) continue;

				for (const day of item.days ?? []) {
					const dayType = day.info?.type;
					if (typeof dayType !== 'number') continue;

					for (const lesson of day.lessons ?? []) {
						const teachers = splitTeachers(lesson.teacherName || '');
						if (!teachers.includes(teacherName)) continue;

						const entry = {
							number: lesson.number,
							lessonName: lesson.lessonName,
							type: lesson.type,
							timeRange: lesson.timeRange,
							startAt: lesson.startAt,
							endAt: lesson.endAt,
							auditoryName: lesson.auditoryName,
							isDistant: !!lesson.isDistant,
							isStream: !!lesson.isStream,
							isDivision: !!lesson.isDivision,
							groups: groupNumber,
							direction: directionName,
							additionalSlots: lesson.additionalSlots,
							originalTimeTitle: lesson.originalTimeTitle
						};

						const arr = dayMap.get(dayType) ?? [];
						arr.push(entry);
						dayMap.set(dayType, arr);
					}
				}
			}
		}

		const days = Array.from(dayMap.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([type, lessons]) => {
				lessons.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
				return { info: { type }, lessons };
			});

		const response = {
			items: [
				{
					courseInfo: { name: teacherName, number: rawTeacherId },
					days
				}
			],
			meta: { folderId }
		};

		try {
			await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
		} catch (e) {
			console.error('Redis error (writing cache):', e);
		}

		trackEventAuto(event, locals?.user?.id, null, 'yspu:teacher:view', {
			teacherName: rawTeacherId,
			folderId,
			semesterName,
			cached: false
		}).catch((err) => console.warn('[Analytics] Track failed:', err));

		return json(response);
	} catch (error) {
		console.error('Error building YSPU teacher schedule:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
