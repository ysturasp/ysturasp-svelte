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

function isAuditoriumOccupiedNow(lessons: AudienceLesson[]): boolean {
	const now = new Date();
	const nowTs = now.getTime();

	for (const lesson of lessons) {
		const anyLesson = lesson as any;
		if (anyLesson.startAt && anyLesson.endAt) {
			const start = new Date(anyLesson.startAt);
			const end = new Date(anyLesson.endAt);
			const startTs = start.getTime();
			const endTs = end.getTime();
			if (!Number.isNaN(startTs) && !Number.isNaN(endTs) && nowTs >= startTs && nowTs <= endTs) {
				return true;
			}
			continue;
		}

		if (!lesson.timeRange) continue;
		const [startStr, endStr] = lesson.timeRange.split('-').map((s) => s.trim());
		if (!startStr || !endStr) continue;

		const [startHour, startMin] = startStr.split(':').map(Number);
		const [endHour, endMin] = endStr.split(':').map(Number);
		if (
			Number.isNaN(startHour) ||
			Number.isNaN(startMin) ||
			Number.isNaN(endHour) ||
			Number.isNaN(endMin)
		) {
			continue;
		}

		const currentMinutes = now.getHours() * 60 + now.getMinutes();
		const lessonStart = startHour * 60 + startMin;
		const lessonEnd = endHour * 60 + endMin;

		if (currentMinutes >= lessonStart && currentMinutes <= lessonEnd) {
			return true;
		}
	}

	return false;
}

const API_BASE = 'https://gg-api.ystuty.ru/s/schedule/v1/schedule';
const CACHE_TTL = 3600;

export async function GET(_event: RequestEvent) {
	try {
		const redis = getRedisClient();
		const statuses: Record<string, boolean> = {};

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
			return json(statuses);
		}

		const parsed = JSON.parse(cachedList) as { items?: AudienceInfo[] } | AudienceInfo[];
		const audiences: AudienceInfo[] = Array.isArray(parsed)
			? parsed
			: Array.isArray(parsed.items)
				? parsed.items
				: [];

		if (!audiences.length) {
			return json(statuses);
		}

		for (const aud of audiences) {
			const originalName = aud.name;
			const normalizedName = normalizeAuditoriumName(originalName);

			try {
				const scheduleKey = getAudienceScheduleKey(String(aud.id));
				const cachedSchedule = await redis.get(scheduleKey);

				if (!cachedSchedule) {
					statuses[originalName] = true;
					continue;
				}

				const schedule: AudienceScheduleData = JSON.parse(cachedSchedule);
				const allLessons: AudienceLesson[] = [];

				for (const week of schedule.items ?? []) {
					for (const dayInfo of week.days ?? []) {
						for (const lesson of dayInfo.lessons ?? []) {
							allLessons.push(lesson);
						}
					}
				}

				const occupied = isAuditoriumOccupiedNow(allLessons);
				statuses[originalName] = !occupied;
			} catch (err) {
				console.error(`Error processing audience ${aud.id} (${aud.name}):`, err);
				statuses[originalName] = true;
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
