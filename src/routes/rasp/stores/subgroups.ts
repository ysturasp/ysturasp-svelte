import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SemesterInfo } from '$lib/utils/semester';
import { getWeekNumberByDate } from '$lib/utils/semester';

export interface SubgroupInfo {
	subgroup: 1 | 2;
	isVUC: boolean;
	lessonIndex: number;
}

export interface TeacherSubgroupData {
	dates: Record<string, SubgroupInfo>;
	teacher: string;
	isDivision: boolean;
	displayName: string;
}

export interface SubgroupSettings {
	[lessonName: string]: boolean;
}

export interface TeacherSubgroups {
	[key: string]: TeacherSubgroupData;
}

export const subgroupSettings = writable<SubgroupSettings>({});
export const teacherSubgroups = writable<TeacherSubgroups>({});

const SUBGROUP_TYPES = new Set<number>([8, 4]);
function isSubgroupType(type: number): boolean {
	return SUBGROUP_TYPES.has(type);
}

export function loadSubgroupSettings(): SubgroupSettings {
	if (!browser) return {};
	const stored = localStorage.getItem('subgroupSettings');
	const settings = stored ? JSON.parse(stored) : {};

	const cleanedSettings = cleanupSubgroupSettings(settings);

	if (JSON.stringify(settings) !== JSON.stringify(cleanedSettings)) {
		localStorage.setItem('subgroupSettings', JSON.stringify(cleanedSettings));
	}

	return cleanedSettings;
}

export function saveSubgroupSettings(settings: SubgroupSettings) {
	if (!browser) return;

	const cleanedSettings = cleanupSubgroupSettings(settings);

	localStorage.setItem('subgroupSettings', JSON.stringify(cleanedSettings));
	subgroupSettings.set(cleanedSettings);
}

function cleanupSubgroupSettings(settings: SubgroupSettings): SubgroupSettings {
	const cleaned: SubgroupSettings = {};

	for (const [key, value] of Object.entries(settings)) {
		if (key.startsWith('null (преп.') && key.includes('_')) {
			const parts = key.split('_');
			if (parts.length >= 2) {
				const teacher = parts[parts.length - 1];
				const newKey = `null_${teacher}`;
				cleaned[newKey] = value;
			}
		} else {
			cleaned[key] = value;
		}
	}

	return cleaned;
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
	if (!isSubgroupType(lesson.type)) return true;

	const lessonName = lesson.lessonName || 'null';
	const teacherName = lesson.teacherName || lesson.additionalTeacherName;
	const baseNullKey = `null (преп. ${teacherName})_${teacherName}`;
	const teacherKeys = Object.keys(teacherData).filter((k) => k.endsWith(`_${teacherName}`));
	const mergedKey = teacherKeys.find((k) => !k.startsWith(`null (преп.`));
	const mergedDisplay = mergedKey ? teacherData[mergedKey].displayName : null;

	let settingKey = lessonName === 'null' ? `null_${teacherName}` : lessonName;
	if (lessonName === 'null' && mergedDisplay && settings[mergedDisplay] !== undefined) {
		settingKey = mergedDisplay;
	}

	if (!settings[settingKey]) return true;

	if (lessonName === 'null') {
		if (mergedKey && teacherData[mergedKey]) return true;
		return teacherData[baseNullKey] !== undefined;
	}

	const teacherKey = `${lessonName}_${teacherName}`;
	return teacherData[teacherKey] !== undefined;
}

export function getSubgroupIndicator(
	lesson: any,
	dayDate: string,
	settings: SubgroupSettings,
	teacherData: TeacherSubgroups
): string {
	if (!isSubgroupType(lesson.type)) return '';

	const lessonName = lesson.lessonName || 'null';

	function keysForTeacher(name: string | undefined | null): string[] {
		if (!name) return [];
		const baseNull = `null (преп. ${name})_${name}`;
		const keys = Object.keys(teacherData).filter((k) => k.endsWith(`_${name}`));
		const merged = keys.filter((k) => !k.startsWith('null (преп. '));
		if (lessonName === 'null') {
			return [baseNull, ...merged];
		}
		return [`${lessonName}_${name}`];
	}

	const candidateKeys = [
		...keysForTeacher(lesson.teacherName),
		...keysForTeacher(lesson.additionalTeacherName)
	];

	const settingKey = lessonName === 'null' ? `null_${lesson.teacherName}` : lessonName;
	const setting = settings[settingKey];
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
export function cleanSubjectName(name: string | null): string {
	if (!name) return 'null';
	return name.replace(/\s*\([^)]*\)/g, '').trim();
}

export function generateSubgroupDistribution(scheduleData: any, semester: SemesterInfo) {
	const teacherSubgroups: TeacherSubgroups = {};
	const vucDays = new Set<string>();

	const teacherSubjectCounts = new Map<
		string,
		{ namedSubjects: Map<string, number>; nullCount: number }
	>();

	scheduleData.items.forEach((weekItem: any) => {
		weekItem.days.forEach((day: any) => {
			if (!isDateInCurrentSemester(day.info.date, semester)) return;
			day.lessons?.forEach((lesson: any) => {
				if (!isSubgroupType(lesson.type)) return;
				const teacherName = lesson.teacherName || lesson.additionalTeacherName;
				if (!teacherName) return;
				const originalName = lesson.lessonName || 'null';
				if (!teacherSubjectCounts.has(teacherName)) {
					teacherSubjectCounts.set(teacherName, {
						namedSubjects: new Map<string, number>(),
						nullCount: 0
					});
				}
				const info = teacherSubjectCounts.get(teacherName)!;
				if (originalName === 'null') {
					info.nullCount++;
				} else {
					info.namedSubjects.set(
						originalName,
						(info.namedSubjects.get(originalName) || 0) + 1
					);
				}
			});
		});
	});

	const teacherMergeTarget = new Map<string, string>();
	for (const [teacher, info] of teacherSubjectCounts.entries()) {
		if (info.namedSubjects.size === 1) {
			const [[onlyName, onlyCount]] = Array.from(info.namedSubjects.entries());
			const nullCount = info.nullCount;
			if (onlyCount <= 8 && nullCount > 0 && nullCount <= 8) {
				teacherMergeTarget.set(teacher, onlyName);
			}
		}
	}

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

	type Entry = {
		teacher: string;
		date: string;
		timeRange: string;
		isVUC: boolean;
		originalName: string;
	};
	const groups = new Map<
		string,
		{ subject: string; originalNames: Set<string>; items: Entry[] }
	>();

	scheduleData.items.forEach((weekItem: any) => {
		weekItem.days.forEach((day: any) => {
			if (!isDateInCurrentSemester(day.info.date, semester)) return;

			day.lessons?.forEach((lesson: any) => {
				if (!isSubgroupType(lesson.type)) return;
				const teacherName = lesson.teacherName || lesson.additionalTeacherName;
				if (!teacherName) return;

				const originalName = lesson.lessonName || 'null';
				let subjectName: string;
				if (originalName === 'null') {
					const merged = teacherMergeTarget.get(teacherName);
					subjectName = merged ? merged : `null (преп. ${teacherName})`;
				} else {
					subjectName = originalName;
				}
				const baseKey = `${subjectName}_${teacherName}`;

				if (!groups.has(baseKey)) {
					groups.set(baseKey, {
						subject: subjectName,
						originalNames: new Set([originalName]),
						items: []
					});
				}

				const group = groups.get(baseKey)!;
				group.originalNames.add(originalName);
				group.items.push({
					teacher: teacherName,
					date: day.info.date,
					timeRange: lesson.timeRange || `${lesson.startAt}-${lesson.endAt}`,
					isVUC: vucDays.has(day.info.date),
					originalName
				});
			});
		});
	});

	groups.forEach(({ subject: subjectName, items, originalNames }, groupKey) => {
		items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

		const teachers = Array.from(new Set(items.map((e) => e.teacher)));
		const teacherToDates = new Map<string, Entry[]>();
		teachers.forEach((t) =>
			teacherToDates.set(
				t,
				items.filter((e) => e.teacher === t)
			)
		);
		const hasAnyVUC = items.some((e) => e.isVUC);

		const perTeacherDates: Record<string, Record<string, SubgroupInfo>> = {};

		function assignAllForTeacher(teacher: string, subgroup: 1 | 2) {
			const arr = teacherToDates.get(teacher) || [];
			arr.forEach((e) => {
				const formattedDate = new Date(e.date).toLocaleDateString('ru-RU');
				const dateTimeKey = `${formattedDate}_${e.timeRange}`;
				if (!perTeacherDates[teacher]) perTeacherDates[teacher] = {};
				const lessonIndex = findLessonIndex(
					e.date,
					e.timeRange,
					`${subjectName}_${teacher}`
				);
				perTeacherDates[teacher][dateTimeKey] = {
					subgroup,
					isVUC: e.isVUC,
					lessonIndex
				};
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
			const vuc = items.filter((e) => e.isVUC);
			const nonVuc = items.filter((e) => !e.isVUC);

			const totalDays = items.length;
			const maxDiff = Math.ceil(totalDays * 0.3);

			let subgroup1Count = 0;
			let subgroup2Count = 0;

			let group1VUC: Entry[] = [];
			let group2VUC: Entry[] = [];
			let group1NonVUC: Entry[] = [];
			let group2NonVUC: Entry[] = [];

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

			function add(entry: Entry, subgroup: 1 | 2) {
				const formattedDate = new Date(entry.date).toLocaleDateString('ru-RU');
				const dateTimeKey = `${formattedDate}_${entry.timeRange}`;
				if (!perTeacherDates[entry.teacher]) perTeacherDates[entry.teacher] = {};
				const lessonIndex = findLessonIndex(
					entry.date,
					entry.timeRange,
					`${subjectName}_${entry.teacher}`
				);
				perTeacherDates[entry.teacher][dateTimeKey] = {
					subgroup,
					isVUC: entry.isVUC,
					lessonIndex
				};
			}

			group1VUC.forEach((e) => add(e, 1));
			group2VUC.forEach((e) => add(e, 2));
			group1NonVUC.forEach((e) => add(e, 1));
			group2NonVUC.forEach((e) => add(e, 2));
		}

		Object.entries(perTeacherDates).forEach(([teacher, dates]) => {
			const key = `${subjectName}_${teacher}`;

			let isDivision = false;
			let found = false;
			for (const item of items) {
				if (item.teacher === teacher) {
					for (const weekItem of scheduleData.items) {
						for (const day of weekItem.days) {
							const lesson = day.lessons?.find((l: any) => {
								if (!isSubgroupType(l.type)) return false;
								const lessonName = l.lessonName || 'null';
								return (
									lessonName === item.originalName && l.teacherName === teacher
								);
							});
							if (lesson) {
								isDivision = lesson.isDivision;
								found = true;
								break;
							}
						}
						if (found) break;
					}
					break;
				}
			}

			teacherSubgroups[key] = {
				dates,
				teacher,
				isDivision,
				displayName: subjectName
			};
		});
	});

	function parseDateFromRU(dateStr: string): Date | null {
		const m = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
		if (!m) return null;
		const dd = parseInt(m[1]);
		const mm = parseInt(m[2]);
		const yyyy = parseInt(m[3]);
		return new Date(yyyy, mm - 1, dd);
	}

	function canonicalizeDateTimeKey(key: string): {
		dateKey: string;
		timeKey: string;
		canonical: string;
		dateObj: Date | null;
	} {
		const idx = key.indexOf('_');
		if (idx === -1) return { dateKey: key, timeKey: '', canonical: key, dateObj: null };
		const dateKey = key.slice(0, idx);
		const timeKeyRaw = key.slice(idx + 1);
		const normalizedDash = timeKeyRaw.replace(/[\u2010-\u2015\u2212\-]/g, '-');
		const timeKey = normalizedDash.replace(/\s+/g, '');
		const canonical = `${dateKey}_${timeKey}`;
		const dateObj = parseDateFromRU(dateKey);
		return { dateKey, timeKey, canonical, dateObj };
	}

	const groupCounts = new Map<string, { s1: number; s2: number }>();
	Object.entries(teacherSubgroups).forEach(([gKey, data]) => {
		let s1 = 0;
		let s2 = 0;
		Object.values(data.dates).forEach((info) => {
			if (info.subgroup === 1) s1++;
			else if (info.subgroup === 2) s2++;
		});
		groupCounts.set(gKey, { s1, s2 });
	});

	const slotMap = new Map<
		string,
		Array<{
			groupKey: string;
			dateTimeKey: string;
			subgroup: 1 | 2;
			week: number;
			lessonIndex: number;
		}>
	>();

	function findLessonIndex(date: string, timeRange: string, groupKey: string): number {
		for (const weekItem of scheduleData.items) {
			for (const day of weekItem.days) {
				if (day.info.date === date) {
					const lessons = day.lessons || [];
					const sameDayLessons = lessons.filter((l) => {
						if (!isSubgroupType(l.type)) return false;
						const lessonTimeRange = l.timeRange || `${l.startAt}-${l.endAt}`;
						const normalizedTimeRange = lessonTimeRange.replace(/\s+/g, '');
						const normalizedInputTimeRange = timeRange.replace(/\s+/g, '');
						return normalizedTimeRange === normalizedInputTimeRange;
					});

					const sortedLessons = [...sameDayLessons].sort((a, b) => {
						const aIndex = lessons.indexOf(a);
						const bIndex = lessons.indexOf(b);
						return aIndex - bIndex;
					});

					for (let i = 0; i < sortedLessons.length; i++) {
						const lesson = sortedLessons[i];
						const teacherName = lesson.teacherName || lesson.additionalTeacherName;
						const lessonName = lesson.lessonName || 'null';
						const currentKey = `${lessonName}_${teacherName}`;
						if (currentKey === groupKey) {
							return sortedLessons.length >= 2 ? i : 0;
						}
					}
				}
			}
		}
		return 0;
	}

	Object.entries(teacherSubgroups).forEach(([gKey, data]) => {
		Object.entries(data.dates).forEach(([dtKey, info]) => {
			const { canonical, dateObj, dateKey, timeKey } = canonicalizeDateTimeKey(dtKey);
			if (!dateObj) return;
			const week = getWeekNumberByDate(dateObj, semester);
			const lessonIndex = findLessonIndex(
				dateKey.split('.').reverse().join('-'),
				timeKey,
				gKey
			);
			if (!slotMap.has(canonical)) slotMap.set(canonical, []);
			slotMap.get(canonical)!.push({
				groupKey: gKey,
				dateTimeKey: dtKey,
				subgroup: info.subgroup,
				week,
				lessonIndex
			});
		});
	});

	slotMap.forEach((entries) => {
		if (entries.length < 2) return;
		entries.sort((a, b) => a.lessonIndex - b.lessonIndex);
		const used = new Set<number>();
		used.add(entries[0].subgroup);

		function tryCompensate(
			groupKey: string,
			current: 1 | 2,
			desired: 1 | 2,
			currentWeek: number,
			currentDtKey: string
		): boolean {
			const dates = teacherSubgroups[groupKey]?.dates || {};
			for (const [dtKey, info] of Object.entries(dates)) {
				const { dateObj, canonical } = canonicalizeDateTimeKey(dtKey);
				if (!dateObj) continue;
				const week = getWeekNumberByDate(dateObj, semester);
				if (dtKey === currentDtKey) continue;
				if (week > currentWeek && info.subgroup === desired) {
					const entries = slotMap.get(canonical) || [];
					let has1 = false;
					let has2 = false;
					for (const ent of entries) {
						let sg = teacherSubgroups[ent.groupKey]?.dates?.[ent.dateTimeKey]?.subgroup;
						if (ent.groupKey === groupKey && ent.dateTimeKey === dtKey) sg = current;
						if (sg === 1) has1 = true;
						if (sg === 2) has2 = true;
					}
					if (entries.length >= 2 && !(has1 && has2)) continue;
					const cnt = groupCounts.get(groupKey)!;
					if (desired === 1) {
						cnt.s1--;
						cnt.s2++;
					} else {
						cnt.s2--;
						cnt.s1++;
					}
					teacherSubgroups[groupKey].dates[dtKey].subgroup = current;
					return true;
				}
			}
			for (const [dtKey, info] of Object.entries(dates)) {
				if (dtKey === currentDtKey) continue;
				if (info.subgroup === desired) {
					const { canonical } = canonicalizeDateTimeKey(dtKey);
					const entries = slotMap.get(canonical) || [];
					let has1 = false;
					let has2 = false;
					for (const ent of entries) {
						let sg = teacherSubgroups[ent.groupKey]?.dates?.[ent.dateTimeKey]?.subgroup;
						if (ent.groupKey === groupKey && ent.dateTimeKey === dtKey) sg = current;
						if (sg === 1) has1 = true;
						if (sg === 2) has2 = true;
					}
					if (entries.length >= 2 && !(has1 && has2)) continue;
					const cnt = groupCounts.get(groupKey)!;
					if (desired === 1) {
						cnt.s1--;
						cnt.s2++;
					} else {
						cnt.s2--;
						cnt.s1++;
					}
					teacherSubgroups[groupKey].dates[dtKey].subgroup = current;
					return true;
				}
			}
			return false;
		}
		for (let i = 1; i < entries.length; i++) {
			const e = entries[i];
			const desired: 1 | 2 =
				used.has(1) && !used.has(2)
					? 2
					: used.has(2) && !used.has(1)
						? 1
						: e.subgroup === 1
							? 2
							: 1;
			if (e.subgroup !== desired) {
				const counts = groupCounts.get(e.groupKey)!;
				const afterS1 = counts.s1 + (desired === 1 ? 1 : 0) - (e.subgroup === 1 ? 1 : 0);
				const afterS2 = counts.s2 + (desired === 2 ? 1 : 0) - (e.subgroup === 2 ? 1 : 0);
				if (Math.abs(afterS1 - afterS2) <= 1) {
					teacherSubgroups[e.groupKey].dates[e.dateTimeKey].subgroup = desired;
					counts.s1 = afterS1;
					counts.s2 = afterS2;
					e.subgroup = desired;
				} else {
					if (tryCompensate(e.groupKey, e.subgroup, desired, e.week, e.dateTimeKey)) {
						teacherSubgroups[e.groupKey].dates[e.dateTimeKey].subgroup = desired;
						const cnt = groupCounts.get(e.groupKey)!;
						if (desired === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
						e.subgroup = desired;
					}
				}
			}
			used.add(e.subgroup);
		}
	});

	function canFlipWithoutSlotConflict(
		groupKey: string,
		dtKey: string,
		newSubgroup: 1 | 2
	): boolean {
		const { canonical } = canonicalizeDateTimeKey(dtKey);
		const entries = slotMap.get(canonical) || [];
		if (entries.length < 2) return true;
		let has1 = false;
		let has2 = false;
		for (const ent of entries) {
			let sg = teacherSubgroups[ent.groupKey]?.dates?.[ent.dateTimeKey]?.subgroup;
			if (ent.groupKey === groupKey && ent.dateTimeKey === dtKey) sg = newSubgroup;
			if (sg === 1) has1 = true;
			if (sg === 2) has2 = true;
		}
		if (!(has1 && has2)) return false;
		return hasBothSubgroupsAfterFlip(groupKey, dtKey, newSubgroup);
	}

	function hasBothSubgroupsAfterFlip(
		groupKey: string,
		dtKey: string,
		newSubgroup: 1 | 2
	): boolean {
		const dates = teacherSubgroups[groupKey]?.dates || {};
		const { dateKey } = canonicalizeDateTimeKey(dtKey);
		const subgroups: Array<1 | 2> = [];
		Object.entries(dates).forEach(([k, info]) => {
			const dk = canonicalizeDateTimeKey(k).dateKey;
			if (dk !== dateKey) return;
			const sg = k === dtKey ? newSubgroup : info.subgroup;
			if (sg === 1 || sg === 2) subgroups.push(sg);
		});
		if (subgroups.length < 2) return true;
		const set = new Set(subgroups);
		return set.has(1) && set.has(2);
	}

	function enforcePerDayBothSubgroups() {
		Object.keys(teacherSubgroups).forEach((gKey) => {
			const dates = teacherSubgroups[gKey].dates;
			const byDate = new Map<string, string[]>();
			Object.keys(dates).forEach((dtKey) => {
				const { dateKey } = canonicalizeDateTimeKey(dtKey);
				if (!byDate.has(dateKey)) byDate.set(dateKey, []);
				byDate.get(dateKey)!.push(dtKey);
			});
			byDate.forEach((arr) => {
				if (arr.length < 2) return;
				arr.sort();
				const keys = arr.map((k) => k);
				const subs = keys.map((k) => teacherSubgroups[gKey].dates[k]?.subgroup);
				const set = new Set(subs.filter((x) => x === 1 || x === 2));
				if (set.size >= 2) return;
				const current = subs[0] === 1 ? 1 : 2;
				const target: 1 | 2 = current === 1 ? 2 : 1;
				for (let i = keys.length - 1; i >= 0; i--) {
					const keyToFlip = keys[i];
					if (!teacherSubgroups[gKey].dates[keyToFlip]) continue;
					if (teacherSubgroups[gKey].dates[keyToFlip].subgroup === target) return;
					if (!canFlipWithoutSlotConflict(gKey, keyToFlip, target)) continue;
					teacherSubgroups[gKey].dates[keyToFlip].subgroup = target;
					const cnt = groupCounts.get(gKey);
					if (cnt) {
						if (target === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
					}
					break;
				}
			});
		});
	}

	enforcePerDayBothSubgroups();

	Object.keys(teacherSubgroups).forEach((gKey) => {
		const dates = teacherSubgroups[gKey].dates;
		const counts = { s1: 0, s2: 0 };
		Object.values(dates).forEach((info) => {
			if (info.subgroup === 1) counts.s1++;
			else if (info.subgroup === 2) counts.s2++;
		});
		while (Math.abs(counts.s1 - counts.s2) > 1) {
			const flipFrom: 1 | 2 = counts.s1 > counts.s2 ? 1 : 2;
			const flipTo: 1 | 2 = flipFrom === 1 ? 2 : 1;
			let flipped = false;
			const dateEntries = Object.keys(dates)
				.map((k) => ({
					k,
					week: (() => {
						const { dateObj } = canonicalizeDateTimeKey(k);
						return dateObj ? getWeekNumberByDate(dateObj, semester) : 0;
					})()
				}))
				.sort((a, b) => b.week - a.week);
			for (const d of dateEntries) {
				const info = dates[d.k];
				if (!info || info.subgroup !== flipFrom) continue;
				if (!canFlipWithoutSlotConflict(gKey, d.k, flipTo)) continue;
				dates[d.k].subgroup = flipTo;
				if (flipFrom === 1) {
					counts.s1--;
					counts.s2++;
				} else {
					counts.s2--;
					counts.s1++;
				}
				flipped = true;
				break;
			}
			if (!flipped) break;
		}
	});

	return teacherSubgroups;
}

function isDateInCurrentSemester(dateString: string, semester: SemesterInfo): boolean {
	const date = new Date(dateString);
	return date >= semester.range.start && date <= semester.range.end;
}
