import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SemesterInfo } from '$lib/utils/semester';

export interface SubgroupInfo {
	subgroup: 1 | 2;
	isVUC: boolean;
}

export interface TeacherSubgroupData {
	dates: Record<string, SubgroupInfo>;
	teacher: string;
}

export interface SubgroupSettings {
	[lessonName: string]: boolean;
}

export interface TeacherSubgroups {
	[key: string]: TeacherSubgroupData;
}

export const subgroupSettings = writable<SubgroupSettings>({});
export const teacherSubgroups = writable<TeacherSubgroups>({});

export function loadSubgroupSettings(): SubgroupSettings {
	if (!browser) return {};
	const stored = localStorage.getItem('subgroupSettings');
	return stored ? JSON.parse(stored) : {};
}

export function saveSubgroupSettings(settings: SubgroupSettings) {
	if (!browser) return;
	localStorage.setItem('subgroupSettings', JSON.stringify(settings));
	subgroupSettings.set(settings);
}

export function loadTeacherSubgroups(): TeacherSubgroups {
	if (!browser) return {};
	const stored = localStorage.getItem('teacherSubgroups');
	return stored ? JSON.parse(stored) : {};
}

export function saveTeacherSubgroups(data: TeacherSubgroups) {
	if (!browser) return;
	localStorage.setItem('teacherSubgroups', JSON.stringify(data));
	teacherSubgroups.set(data);
}

export function shouldShowLabWork(
	lesson: any,
	settings: SubgroupSettings,
	teacherData: TeacherSubgroups
): boolean {
	if (lesson.type !== 8) return true;

	const key = `${lesson.lessonName}_${lesson.teacherName}`;

	if (!settings[lesson.lessonName]) return true;

	return teacherData[key] !== undefined;
}

export function getSubgroupIndicator(
	lesson: any,
	dayDate: string,
	settings: SubgroupSettings,
	teacherData: TeacherSubgroups
): string {
	if (lesson.type !== 8) return '';

	const key = `${lesson.lessonName}_${lesson.teacherName}`;
	const isEnabled = settings[lesson.lessonName];

	if (isEnabled && teacherData[key] && teacherData[key].dates) {
		const formattedDate = new Date(dayDate).toLocaleDateString('ru-RU');

		const timeFormats = [
			lesson.timeRange,
			`${lesson.startAt}-${lesson.endAt}`,
			`${formatTime(lesson.startAt)}-${formatTime(lesson.endAt)}`
		].filter(Boolean);

		for (const timeFormat of timeFormats) {
			const dateTimeKey = `${formattedDate}_${timeFormat}`;
			const subgroupInfo = teacherData[key].dates[dateTimeKey];

			if (subgroupInfo) {
				return `Подгруппа ${subgroupInfo.subgroup}`;
			}
		}
	}

	return '';
}

function formatTime(timeString: string): string {
	try {
		const date = new Date(timeString);
		return date.toLocaleTimeString('ru-RU', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Europe/Moscow'
		});
	} catch {
		return timeString;
	}
}

export function generateSubgroupDistribution(scheduleData: any, semester: SemesterInfo) {
	const teacherSubgroups: TeacherSubgroups = {};
	const vucDays = new Set<string>();

	scheduleData.items.forEach((weekItem: any) => {
		weekItem.days.forEach((day: any) => {
			if (!isDateInCurrentSemester(day.info.date, semester)) return;

			const hasVUC = day.lessons?.some(
				(lesson: any) =>
					lesson.lessonName?.toLowerCase().includes('вуц') ||
					lesson.teacherName?.toLowerCase().includes('вуц')
			);

			if (hasVUC) {
				vucDays.add(day.info.date);
			}
		});
	});

	const labWorks = new Map<string, any[]>();

	scheduleData.items.forEach((weekItem: any) => {
		weekItem.days.forEach((day: any) => {
			if (!isDateInCurrentSemester(day.info.date, semester)) return;

			day.lessons?.forEach((lesson: any) => {
				if (lesson.type === 8) {
					const key = `${lesson.lessonName}_${lesson.teacherName}`;
					if (!labWorks.has(key)) {
						labWorks.set(key, []);
					}
					labWorks.get(key)!.push({
						...lesson,
						date: day.info.date,
						isVUC: vucDays.has(day.info.date)
					});
				}
			});
		});
	});

	labWorks.forEach((lessons, key) => {
		const [lessonName, teacherName] = key.split('_');

		lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const dates: Record<string, SubgroupInfo> = {};
		let currentSubgroup: 1 | 2 = 1;

		lessons.forEach((lesson, index) => {
			const formattedDate = new Date(lesson.date).toLocaleDateString('ru-RU');
			const timeRange = lesson.timeRange || `${lesson.startAt}-${lesson.endAt}`;
			const dateTimeKey = `${formattedDate}_${timeRange}`;

			dates[dateTimeKey] = {
				subgroup: currentSubgroup,
				isVUC: lesson.isVUC
			};

			currentSubgroup = currentSubgroup === 1 ? 2 : 1;
		});

		teacherSubgroups[key] = {
			dates,
			teacher: teacherName
		};
	});

	return teacherSubgroups;
}

function isDateInCurrentSemester(dateString: string, semester: SemesterInfo): boolean {
	const date = new Date(dateString);
	return date >= semester.range.start && date <= semester.range.end;
}
