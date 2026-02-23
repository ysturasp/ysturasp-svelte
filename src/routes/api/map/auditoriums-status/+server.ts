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
	const currentTime = now.getHours() * 60 + now.getMinutes();
	const currentDay = now.getDay();

	if (currentDay === 0 || currentDay === 6) {
		return false;
	}

	for (const lesson of lessons) {
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

		const lessonStart = startHour * 60 + startMin;
		const lessonEnd = endHour * 60 + endMin;

		if (currentTime >= lessonStart && currentTime <= lessonEnd) {
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

		const now = new Date();
		const todayISO = now.toISOString().split('T')[0];
		const day = String(now.getDate()).padStart(2, '0');
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const year = now.getFullYear();
		const todayDot = `${day}.${month}.${year}`;

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
				const todaysLessons: AudienceLesson[] = [];

				for (const week of schedule.items ?? []) {
					for (const dayInfo of week.days ?? []) {
						const date = dayInfo.info?.date;
						if (!date) continue;

						if (date === todayISO || date === todayDot) {
							for (const lesson of dayInfo.lessons ?? []) {
								todaysLessons.push(lesson);
							}
						}
					}
				}

				const occupied = isAuditoriumOccupiedNow(todaysLessons);
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
