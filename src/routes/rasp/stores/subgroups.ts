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

	const mainKey = `${lesson.lessonName}_${lesson.teacherName}`;
	const additionalKey = lesson.additionalTeacherName
		? `${lesson.lessonName}_${lesson.additionalTeacherName}`
		: null;
	const candidateKeys = [mainKey, additionalKey].filter(Boolean) as string[];

	const setting = settings[lesson.lessonName];
	const allow = setting === true ? true : setting === false ? false : Boolean(lesson.isDivision);
	if (!allow) return '';

	const formattedDate = new Date(dayDate).toLocaleDateString('ru-RU');

	const baseTimeFormats = [
		lesson.timeRange,
		`${lesson.startAt}-${lesson.endAt}`,
		`${formatTime(lesson.startAt)}-${formatTime(lesson.endAt)}`
	].filter(Boolean);

	const timeFormats = Array.from(
		new Set(
			baseTimeFormats.flatMap((tf: string) => [
				tf,
				tf.replace(/\s*-\s*/g, '-'),
				tf.replace(/-/g, ' - ')
			])
		)
	);

	for (const key of candidateKeys) {
		const dates = teacherData[key]?.dates;
		if (!dates) continue;

		for (const tf of timeFormats) {
			const dateTimeKey = `${formattedDate}_${tf}`;
			const subgroupInfo = dates[dateTimeKey];
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

	const subjectLessons = new Map<
		string,
		Array<{
			teacher: string;
			date: string;
			timeRange: string;
			isVUC: boolean;
		}>
	>();

	scheduleData.items.forEach((weekItem: any) => {
		weekItem.days.forEach((day: any) => {
			if (!isDateInCurrentSemester(day.info.date, semester)) return;

			day.lessons?.forEach((lesson: any) => {
				if (lesson.type === 8) {
					const teacherName = lesson.teacherName || lesson.additionalTeacherName;
					if (!teacherName) return;
					const subjectKey = `${lesson.lessonName}`;
					if (!subjectLessons.has(subjectKey)) subjectLessons.set(subjectKey, []);
					subjectLessons.get(subjectKey)!.push({
						teacher: teacherName,
						date: day.info.date,
						timeRange: lesson.timeRange || `${lesson.startAt}-${lesson.endAt}`,
						isVUC: vucDays.has(day.info.date)
					});
				}
			});
		});
	});

	subjectLessons.forEach((entries, subject) => {
		entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const teachers = Array.from(new Set(entries.map((e) => e.teacher)));
		const teacherToDates = new Map<string, typeof entries>();
		teachers.forEach((t) =>
			teacherToDates.set(
				t,
				entries.filter((e) => e.teacher === t)
			)
		);

		const hasAnyVUC = entries.some((e) => e.isVUC);

		const perTeacherDates: Record<string, Record<string, SubgroupInfo>> = {};

		function assignAllForTeacher(teacher: string, subgroup: 1 | 2) {
			const arr = teacherToDates.get(teacher) || [];
			arr.forEach((e) => {
				const formattedDate = new Date(e.date).toLocaleDateString('ru-RU');
				const dateTimeKey = `${formattedDate}_${e.timeRange}`;
				if (!perTeacherDates[teacher]) perTeacherDates[teacher] = {};
				perTeacherDates[teacher][dateTimeKey] = { subgroup, isVUC: e.isVUC };
			});
		}

		if (teachers.length === 2 && !hasAnyVUC) {
			const [t1, t2] = teachers;
			const t1Dates = teacherToDates.get(t1) || [];
			const t2Dates = teacherToDates.get(t2) || [];

			if (t1Dates.length === t2Dates.length) {
				assignAllForTeacher(t1, 1);
				assignAllForTeacher(t2, 2);
			} else {
				regularDistribute();
			}
		} else {
			regularDistribute();
		}

		function regularDistribute() {
			const vuc = entries.filter((e) => e.isVUC);
			const nonVuc = entries.filter((e) => !e.isVUC);

			const totalDays = entries.length;
			const maxDiff = Math.ceil(totalDays * 0.3);

			let subgroup1Count = 0;
			let subgroup2Count = 0;

			let group1VUC: typeof entries = [];
			let group2VUC: typeof entries = [];
			let group1NonVUC: typeof entries = [];
			let group2NonVUC: typeof entries = [];

			for (const e of vuc) {
				const currentDiff = subgroup2Count - subgroup1Count;
				if (currentDiff >= maxDiff) {
					group1VUC.push(e);
					subgroup1Count++;
				} else {
					group2VUC.push(e);
					subgroup2Count++;
				}
			}

			for (const e of nonVuc) {
				const assigned = subgroup1Count <= subgroup2Count ? 1 : 2;
				if (assigned === 1) {
					group1NonVUC.push(e);
					subgroup1Count++;
				} else {
					group2NonVUC.push(e);
					subgroup2Count++;
				}
			}

			for (let i = 0; i < group1VUC.length; i++) {
				if (group2NonVUC.length > 0) {
					const vucDate = group1VUC[i];
					const nonVucDate = group2NonVUC[0];
					group2VUC.push(vucDate);
					group1NonVUC.push(nonVucDate);
					group1VUC.splice(i, 1);
					group2NonVUC.splice(0, 1);
					i--;
				}
			}

			function add(
				entry: { teacher: string; date: string; timeRange: string; isVUC: boolean },
				subgroup: 1 | 2
			) {
				const formattedDate = new Date(entry.date).toLocaleDateString('ru-RU');
				const dateTimeKey = `${formattedDate}_${entry.timeRange}`;
				if (!perTeacherDates[entry.teacher]) perTeacherDates[entry.teacher] = {};
				perTeacherDates[entry.teacher][dateTimeKey] = { subgroup, isVUC: entry.isVUC };
			}

			group1VUC.forEach((e) => add(e, 1));
			group2VUC.forEach((e) => add(e, 2));
			group1NonVUC.forEach((e) => add(e, 1));
			group2NonVUC.forEach((e) => add(e, 2));
		}

		Object.entries(perTeacherDates).forEach(([teacher, dates]) => {
			const key = `${subject}_${teacher}`;
			teacherSubgroups[key] = { dates, teacher };
		});
	});

	return teacherSubgroups;
}

function isDateInCurrentSemester(dateString: string, semester: SemesterInfo): boolean {
	const date = new Date(dateString);
	return date >= semester.range.start && date <= semester.range.end;
}
