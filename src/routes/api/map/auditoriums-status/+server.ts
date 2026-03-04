import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getAudiencesListKey, getAudienceScheduleKey } from '$lib/utils/redis-keys';
import type { AudienceScheduleData, AudienceLesson } from '../../../raspaudience/types';

interface AudienceInfo {
	id: string | number;
	name: string;
}

function normalizeAuditoriumName(name: string): string {
	return name.replace(/^Г-/, '').replace(/\s+/g, '').trim();
}

function getDayString(date: Date | null | string): string | null {
	if (!date) return null;
	const d = new Date(date);
	if (Number.isNaN(d.getTime())) return null;
	const shifted = new Date(d.getTime() + 3 * 60 * 60 * 1000);
	return shifted.toISOString().split('T')[0];
}

function getLessonAtTime(schedule: AudienceScheduleData, targetDate: Date): AudienceLesson | null {
	const targetTs = targetDate.getTime();
	const targetDayStr = getDayString(targetDate);
	const targetMinutes = (targetDate.getUTCHours() + 3) * 60 + targetDate.getUTCMinutes();

	const debugInfo: any[] = [];

	for (const week of schedule.items ?? []) {
		for (const dayInfo of week.days ?? []) {
			const dayStr = getDayString(dayInfo.info?.date);
			const isSameDay = dayStr === targetDayStr;

			for (const lesson of dayInfo.lessons ?? []) {
				const anyLesson = lesson as any;

				if (anyLesson.startAt && anyLesson.endAt) {
					const startTs = new Date(anyLesson.startAt).getTime();
					const endTs = new Date(anyLesson.endAt).getTime();

					if (targetTs >= startTs && targetTs <= endTs) {
						return lesson;
					}
				}

				if (!isSameDay || !lesson.timeRange) continue;

				const [startStr, endStr] = lesson.timeRange.split('-').map((s) => s.trim());
				if (!startStr || !endStr) continue;

				const [startHour, startMin] = startStr.split(':').map(Number);
				const [endHour, endMin] = endStr.split(':').map(Number);

				const lessonStart = startHour * 60 + startMin;
				const lessonEnd = endHour * 60 + endMin;

				const normalizedMinutes = targetMinutes % (24 * 60);

				if (normalizedMinutes >= lessonStart && normalizedMinutes <= lessonEnd) {
					return lesson;
				}
			}
		}
	}

	return null;
}

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET(event: RequestEvent) {
	try {
		const redis = getRedisClient();
		const statuses: Record<
			string,
			{
				isFree: boolean;
				lessonName?: string;
				teacherName?: string;
				groups?: string[];
				timeRange?: string;
			}
		> = {};

		const timeParam = event.url.searchParams.get('time');
		const targetDate = timeParam ? new Date(timeParam) : new Date();

		if (Number.isNaN(targetDate.getTime())) {
			return json({ error: 'Invalid time parameter' }, { status: 400 });
		}

		const listKey = getAudiencesListKey();
		let cachedList = await redis.get(listKey);

		if (!cachedList) {
			try {
				const response = await fetch(`${API_BASE}/actual_audiences`);
				if (response.ok) {
					const data = await response.json();
					cachedList = JSON.stringify(data);
					await redis.setex(listKey, CACHE_TTL, cachedList);
				} else {
					console.error('Failed to fetch audiences list from API:', response.status);
				}
			} catch (e) {
				console.error('Error fetching audiences list from API:', e);
			}
		}

		if (!cachedList) {
			console.warn('[MapStatus] No cached audiences list found');
			return json(statuses);
		}

		const parsed = JSON.parse(cachedList) as { items?: AudienceInfo[] } | AudienceInfo[];
		const audiences: AudienceInfo[] = Array.isArray(parsed)
			? parsed
			: Array.isArray(parsed.items)
				? parsed.items
				: [];

		if (!audiences.length) {
			console.warn('[MapStatus] Audiences list is empty');
			return json(statuses);
		}

		let processedCount = 0;
		let busyCount = 0;

		for (const aud of audiences) {
			const originalName = aud.name;

			try {
				const scheduleKey = getAudienceScheduleKey(String(aud.id));
				const cachedSchedule = await redis.get(scheduleKey);

				if (!cachedSchedule) {
					statuses[originalName] = { isFree: true };
					continue;
				}

				const schedule: AudienceScheduleData = JSON.parse(cachedSchedule);
				const currentLesson = getLessonAtTime(schedule, targetDate);
				const anyLesson = currentLesson as any;

				statuses[originalName] = {
					isFree: !currentLesson,
					lessonName: currentLesson?.lessonName,
					teacherName: currentLesson?.teacherName,
					groups: currentLesson?.groups ?? [],
					timeRange:
						anyLesson?.timeRange ??
						(anyLesson?.startAt && anyLesson?.endAt
							? `${new Date(anyLesson.startAt).toLocaleTimeString('ru-RU', {
									hour: '2-digit',
									minute: '2-digit'
								})}-${new Date(anyLesson.endAt).toLocaleTimeString('ru-RU', {
									hour: '2-digit',
									minute: '2-digit'
								})}`
							: undefined)
				};

				processedCount++;
				if (currentLesson) busyCount++;
			} catch (err) {
				console.error(`Error processing audience ${aud.id} (${aud.name}):`, err);
				statuses[originalName] = { isFree: true };
			}
		}

		return json(statuses);
	} catch (error) {
		console.error('Error fetching auditoriums status:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
