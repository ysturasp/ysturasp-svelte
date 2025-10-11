import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { SemesterInfo } from '$lib/utils/semester';
import { getWeekNumberByDate } from '$lib/utils/semester';

export interface SubgroupInfo {
	subgroup: 1 | 2;
	isVUC: boolean;
	lessonIndex: number;
	type?: number;
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
		type: number;
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
					originalName,
					type: lesson.type
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
					lessonIndex,
					type: e.type
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
			const byWeekday = new Map<number, Entry[]>();
			items.forEach((e) => {
				const date = new Date(e.date);
				const weekday = date.getDay();
				if (!byWeekday.has(weekday)) byWeekday.set(weekday, []);
				byWeekday.get(weekday)!.push(e);
			});

			const weekdays = Array.from(byWeekday.entries());
			if (weekdays.length === 2 && weekdays[0][1].length === weekdays[1][1].length) {
				let [group1, group2] = weekdays.map((w) => w[1]);

				const firstDate1 = Math.min(...group1.map((e) => new Date(e.date).getTime()));
				const firstDate2 = Math.min(...group2.map((e) => new Date(e.date).getTime()));

				if (firstDate1 > firstDate2) {
					[group1, group2] = [group2, group1];
				}

				function addByWeekday(entries: Entry[], subgroup: 1 | 2) {
					entries.forEach((e) => {
						const formattedDate = new Date(e.date).toLocaleDateString('ru-RU');
						const dateTimeKey = `${formattedDate}_${e.timeRange}`;
						if (!perTeacherDates[e.teacher]) perTeacherDates[e.teacher] = {};
						const lessonIndex = findLessonIndex(
							e.date,
							e.timeRange,
							`${subjectName}_${e.teacher}`
						);
						perTeacherDates[e.teacher][dateTimeKey] = {
							subgroup,
							isVUC: e.isVUC,
							lessonIndex,
							type: e.type
						};
					});
				}

				addByWeekday(group1, 1);
				addByWeekday(group2, 2);
			} else {
				regularDistribute();
			}
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
					lessonIndex,
					type: entry.type
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
			type?: number;
		}>
	>();

	function findLessonIndex(date: string, timeRange: string, groupKey: string): number {
		for (const weekItem of scheduleData.items) {
			for (const day of weekItem.days) {
				if (day.info.date === date) {
					const lessons = day.lessons || [];
					const sameDayLessons = lessons.filter((l: any) => {
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
				lessonIndex,
				type: info.type
			});
		});
	});

	const parallelGroups = new Map<string, Set<string>>();
	slotMap.forEach((entries, canonical) => {
		if (entries.length >= 2) {
			const allSubgroupTypes = entries.every((e) => isSubgroupType(e.type || 0));
			if (allSubgroupTypes) {
				const groupKeys = entries.map((e) => e.groupKey);
				groupKeys.forEach((gk) => {
					if (!parallelGroups.has(gk)) parallelGroups.set(gk, new Set());
					groupKeys.forEach((otherGk) => {
						if (gk !== otherGk) parallelGroups.get(gk)!.add(otherGk);
					});
				});
			}
		}
	});

	slotMap.forEach((entries) => {
		if (entries.length < 2) return;
		const allSubgroupTypes = entries.every((e) => isSubgroupType(e.type || 0));
		if (!allSubgroupTypes) return;
		entries.sort((a, b) => a.lessonIndex - b.lessonIndex);
		const used = new Set<number>();

		const firstEntry = entries[0];
		const originalFirstSubgroup = firstEntry.subgroup;
		const invertedFirstSubgroup: 1 | 2 = originalFirstSubgroup === 1 ? 2 : 1;

		const firstCounts = groupCounts.get(firstEntry.groupKey);
		if (firstCounts) {
			teacherSubgroups[firstEntry.groupKey].dates[firstEntry.dateTimeKey].subgroup =
				invertedFirstSubgroup;
			if (invertedFirstSubgroup === 1) {
				firstCounts.s1++;
				firstCounts.s2--;
			} else {
				firstCounts.s2++;
				firstCounts.s1--;
			}
			firstEntry.subgroup = invertedFirstSubgroup;
		}

		used.add(invertedFirstSubgroup);

		function tryCompensate(
			groupKey: string,
			current: 1 | 2,
			desired: 1 | 2,
			currentWeek: number,
			currentDtKey: string
		): boolean {
			const dates = teacherSubgroups[groupKey]?.dates || {};
			const sortedDates = Object.entries(dates)
				.map(([dtKey, info]) => {
					const { dateObj } = canonicalizeDateTimeKey(dtKey);
					const week = dateObj ? getWeekNumberByDate(dateObj, semester) : 0;
					return { dtKey, info, week, dateObj };
				})
				.filter((d) => d.dateObj && d.dtKey !== currentDtKey)
				.sort((a, b) => b.week - a.week);

			for (const d of sortedDates) {
				if (d.info.subgroup !== desired) continue;
				const { canonical } = canonicalizeDateTimeKey(d.dtKey);
				const entries = slotMap.get(canonical) || [];
				const subgroupEntries = entries.filter((e) => {
					const info = teacherSubgroups[e.groupKey]?.dates?.[e.dateTimeKey];
					return info && isSubgroupType(info.type || 0);
				});
				let has1 = false;
				let has2 = false;
				for (const ent of subgroupEntries) {
					let sg = teacherSubgroups[ent.groupKey]?.dates?.[ent.dateTimeKey]?.subgroup;
					if (ent.groupKey === groupKey && ent.dateTimeKey === d.dtKey) sg = current;
					if (sg === 1) has1 = true;
					if (sg === 2) has2 = true;
				}
				if (subgroupEntries.length >= 2 && !(has1 && has2)) continue;
				const cnt = groupCounts.get(groupKey)!;
				if (desired === 1) {
					cnt.s1--;
					cnt.s2++;
				} else {
					cnt.s2--;
					cnt.s1++;
				}
				teacherSubgroups[groupKey].dates[d.dtKey].subgroup = current;
				return true;
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

	parallelGroups.forEach((parallelWith, groupKey) => {
		const dates = teacherSubgroups[groupKey]?.dates;
		if (!dates) return;
		const sortedDates = Object.entries(dates)
			.map(([dtKey, info]) => {
				const { dateObj } = canonicalizeDateTimeKey(dtKey);
				return { dtKey, info, dateObj, date: dateObj?.getTime() || 0 };
			})
			.filter((d) => d.dateObj)
			.sort((a, b) => a.date - b.date);

		sortedDates.forEach((current, idx) => {
			const { canonical } = canonicalizeDateTimeKey(current.dtKey);
			const slotEntries = slotMap.get(canonical) || [];
			if (slotEntries.length < 2) return;
			const parallelEntry = slotEntries.find((e) => e.groupKey !== groupKey);
			if (!parallelEntry) return;
			const parallelSubgroup =
				teacherSubgroups[parallelEntry.groupKey]?.dates?.[parallelEntry.dateTimeKey]
					?.subgroup;
			if (!parallelSubgroup) return;
			const expectedSubgroup: 1 | 2 = parallelSubgroup === 1 ? 2 : 1;
			if (current.info.subgroup === expectedSubgroup) return;
			if (idx === 0) return;
			const prev = sortedDates[idx - 1];
			const prevSubgroup = prev.info.subgroup;
			if (prevSubgroup === expectedSubgroup) {
				if (canFlipWithoutSlotConflict(groupKey, current.dtKey, expectedSubgroup)) {
					const cnt = groupCounts.get(groupKey);
					if (cnt) {
						if (expectedSubgroup === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
					}
					teacherSubgroups[groupKey].dates[current.dtKey].subgroup = expectedSubgroup;
				}
			}
		});
	});

	const processedSlots = new Set<string>();
	const groupPatterns = new Map<string, { startWith: 1 | 2; partnerKeys: Set<string> }>();
	slotMap.forEach((entries, canonical) => {
		if (entries.length < 2 || processedSlots.has(canonical)) return;
		const allSubgroupTypes = entries.every((e) => isSubgroupType(e.type || 0));
		if (!allSubgroupTypes) return;
		processedSlots.add(canonical);
		const groups = entries.map((e) => e.groupKey);
		if (groups.length !== 2) return;
		const [group1Key, group2Key] = groups;
		if (!groupPatterns.has(group1Key)) {
			groupPatterns.set(group1Key, { startWith: 2, partnerKeys: new Set() });
		}
		if (!groupPatterns.has(group2Key)) {
			groupPatterns.set(group2Key, { startWith: 1, partnerKeys: new Set() });
		}
		groupPatterns.get(group1Key)!.partnerKeys.add(group2Key);
		groupPatterns.get(group2Key)!.partnerKeys.add(group1Key);
		const dates1 = teacherSubgroups[group1Key]?.dates;
		const dates2 = teacherSubgroups[group2Key]?.dates;
		if (!dates1 || !dates2) return;
		const sorted1 = Object.entries(dates1)
			.map(([dtKey, info]) => {
				const { dateObj, canonical } = canonicalizeDateTimeKey(dtKey);
				return { dtKey, info, dateObj, date: dateObj?.getTime() || 0, canonical };
			})
			.filter((d) => d.dateObj)
			.sort((a, b) => a.date - b.date);
		const sorted2 = Object.entries(dates2)
			.map(([dtKey, info]) => {
				const { dateObj, canonical } = canonicalizeDateTimeKey(dtKey);
				return { dtKey, info, dateObj, date: dateObj?.getTime() || 0, canonical };
			})
			.filter((d) => d.dateObj)
			.sort((a, b) => a.date - b.date);
		const parallelDates = sorted1
			.map((d1) => {
				const d2 = sorted2.find((d) => d.canonical === d1.canonical);
				return d2 ? { d1, d2, date: d1.date, canonical: d1.canonical } : null;
			})
			.filter((p) => p !== null)
			.sort((a, b) => a!.date - b!.date);
		let expectedPattern: Array<[1 | 2, 1 | 2]> = [];
		if (parallelDates.length > 0) {
			const first = parallelDates[0]!;
			const firstSubgroup1 = first.d1.info.subgroup;
			const firstSubgroup2 = first.d2.info.subgroup;
			groupPatterns.get(group1Key)!.startWith = firstSubgroup1;
			groupPatterns.get(group2Key)!.startWith = firstSubgroup2;
			for (let i = 0; i < parallelDates.length; i++) {
				if (i % 2 === 0) {
					expectedPattern.push([firstSubgroup1, firstSubgroup2]);
				} else {
					expectedPattern.push([
						firstSubgroup1 === 1 ? 2 : 1,
						firstSubgroup2 === 1 ? 2 : 1
					]);
				}
			}
		}
		parallelDates.forEach((pair, idx) => {
			if (!pair) return;
			const [expected1, expected2] = expectedPattern[idx];
			const current1 = pair.d1.info.subgroup;
			const current2 = pair.d2.info.subgroup;
			if (current1 !== current2) return;
			if (current1 === expected1) {
				if (canFlipWithoutSlotConflict(group2Key, pair.d2.dtKey, expected2)) {
					const cnt = groupCounts.get(group2Key);
					if (cnt) {
						if (expected2 === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
					}
					teacherSubgroups[group2Key].dates[pair.d2.dtKey].subgroup = expected2;
				}
			} else if (current2 === expected2) {
				if (canFlipWithoutSlotConflict(group1Key, pair.d1.dtKey, expected1)) {
					const cnt = groupCounts.get(group1Key);
					if (cnt) {
						if (expected1 === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
					}
					teacherSubgroups[group1Key].dates[pair.d1.dtKey].subgroup = expected1;
				}
			} else {
				if (canFlipWithoutSlotConflict(group1Key, pair.d1.dtKey, expected1)) {
					const cnt = groupCounts.get(group1Key);
					if (cnt) {
						if (expected1 === 1) {
							cnt.s1++;
							cnt.s2--;
						} else {
							cnt.s2++;
							cnt.s1--;
						}
					}
					teacherSubgroups[group1Key].dates[pair.d1.dtKey].subgroup = expected1;
				}
			}
		});
	});

	groupPatterns.forEach((pattern, groupKey) => {
		const dates = teacherSubgroups[groupKey]?.dates;
		if (!dates) return;
		const sorted = Object.entries(dates)
			.map(([dtKey, info]) => {
				const { dateObj } = canonicalizeDateTimeKey(dtKey);
				return { dtKey, info, dateObj, date: dateObj?.getTime() || 0 };
			})
			.filter((d) => d.dateObj)
			.sort((a, b) => a.date - b.date);
		sorted.forEach((current, idx) => {
			const expected: 1 | 2 =
				idx % 2 === 0 ? pattern.startWith : pattern.startWith === 1 ? 2 : 1;
			if (current.info.subgroup === expected) return;
			const { canonical } = canonicalizeDateTimeKey(current.dtKey);
			const slotEntries = slotMap.get(canonical) || [];
			const subgroupSlotEntries = slotEntries.filter((e) => {
				const info = teacherSubgroups[e.groupKey]?.dates?.[e.dateTimeKey];
				return info && isSubgroupType(info.type || 0);
			});
			if (subgroupSlotEntries.length >= 2) {
				const hasConflict = subgroupSlotEntries.some((e) => {
					if (e.groupKey === groupKey) return false;
					const sg = teacherSubgroups[e.groupKey]?.dates?.[e.dateTimeKey]?.subgroup;
					return sg === expected;
				});
				if (hasConflict) return;
			}
			if (canFlipWithoutSlotConflict(groupKey, current.dtKey, expected)) {
				const cnt = groupCounts.get(groupKey);
				if (cnt) {
					const newS1 =
						cnt.s1 + (expected === 1 ? 1 : 0) - (current.info.subgroup === 1 ? 1 : 0);
					const newS2 =
						cnt.s2 + (expected === 2 ? 1 : 0) - (current.info.subgroup === 2 ? 1 : 0);
					const newDiff = Math.abs(newS1 - newS2);
					if (newDiff > 1) return;
					if (expected === 1) {
						cnt.s1++;
						cnt.s2--;
					} else {
						cnt.s2++;
						cnt.s1--;
					}
				}
				teacherSubgroups[groupKey].dates[current.dtKey].subgroup = expected;
			}
		});
	});

	function canFlipWithoutSlotConflict(
		groupKey: string,
		dtKey: string,
		newSubgroup: 1 | 2
	): boolean {
		const currentInfo = teacherSubgroups[groupKey]?.dates?.[dtKey];
		if (!currentInfo || !isSubgroupType(currentInfo.type || 0)) return true;
		const { canonical } = canonicalizeDateTimeKey(dtKey);
		const entries = slotMap.get(canonical) || [];
		const subgroupEntries = entries.filter((e) => {
			const info = teacherSubgroups[e.groupKey]?.dates?.[e.dateTimeKey];
			return info && isSubgroupType(info.type || 0);
		});
		if (subgroupEntries.length < 2) return true;
		let has1 = false;
		let has2 = false;
		for (const ent of subgroupEntries) {
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
				const allSubgroupTypes = keys
					.map((k) => teacherSubgroups[gKey].dates[k]?.type)
					.every((t) => isSubgroupType(t || 0));
				if (!allSubgroupTypes) return;
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

	const byDisplayName = new Map<string, string[]>();
	Object.entries(teacherSubgroups).forEach(([gKey, data]) => {
		const name = data.displayName;
		if (!byDisplayName.has(name)) byDisplayName.set(name, []);
		byDisplayName.get(name)!.push(gKey);
	});

	byDisplayName.forEach((groupKeys) => {
		const allDates: Array<{ gKey: string; dtKey: string; info: SubgroupInfo }> = [];
		groupKeys.forEach((gKey) => {
			const dates = teacherSubgroups[gKey].dates;
			Object.entries(dates).forEach(([dtKey, info]) => {
				allDates.push({ gKey, dtKey, info });
			});
		});

		const counts = { s1: 0, s2: 0 };
		allDates.forEach(({ info }) => {
			if (info.subgroup === 1) counts.s1++;
			else if (info.subgroup === 2) counts.s2++;
		});

		if (counts.s1 === 0 || counts.s2 === 0) {
			const targetSubgroup: 1 | 2 = counts.s1 === 0 ? 1 : 2;
			const half = Math.floor(allDates.length / 2);
			const sortedDates = allDates
				.map((item) => ({
					...item,
					dateObj: (() => {
						const { dateObj } = canonicalizeDateTimeKey(item.dtKey);
						return dateObj;
					})()
				}))
				.filter((d) => d.dateObj)
				.sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());

			sortedDates.forEach((d, idx) => {
				if (idx < half) {
					teacherSubgroups[d.gKey].dates[d.dtKey].subgroup = targetSubgroup;
					d.info.subgroup = targetSubgroup;
				}
			});

			counts.s1 = targetSubgroup === 1 ? half : allDates.length - half;
			counts.s2 = targetSubgroup === 2 ? half : allDates.length - half;
		}

		const sortedByDate = allDates
			.map((item) => ({
				...item,
				dateObj: (() => {
					const { dateObj } = canonicalizeDateTimeKey(item.dtKey);
					return dateObj;
				})()
			}))
			.filter((d) => d.dateObj)
			.sort((a, b) => a.dateObj!.getTime() - b.dateObj!.getTime());

		for (let i = 1; i < sortedByDate.length; i++) {
			const prev = sortedByDate[i - 1];
			const curr = sortedByDate[i];
			if (prev.info.subgroup === curr.info.subgroup) {
				const flipTo: 1 | 2 = curr.info.subgroup === 1 ? 2 : 1;
				if (canFlipWithoutSlotConflict(curr.gKey, curr.dtKey, flipTo)) {
					const newS1 = counts.s1 + (flipTo === 1 ? 1 : -1);
					const newS2 = counts.s2 + (flipTo === 2 ? 1 : -1);
					if (Math.abs(newS1 - newS2) <= 1) {
						teacherSubgroups[curr.gKey].dates[curr.dtKey].subgroup = flipTo;
						curr.info.subgroup = flipTo;
						counts.s1 = newS1;
						counts.s2 = newS2;
					}
				}
			}
		}

		while (Math.abs(counts.s1 - counts.s2) > 1) {
			const flipFrom: 1 | 2 = counts.s1 > counts.s2 ? 1 : 2;
			const flipTo: 1 | 2 = flipFrom === 1 ? 2 : 1;
			let flipped = false;

			const sortedDates = allDates
				.filter(({ info }) => info.subgroup === flipFrom)
				.map((item) => ({
					...item,
					week: (() => {
						const { dateObj } = canonicalizeDateTimeKey(item.dtKey);
						return dateObj ? getWeekNumberByDate(dateObj, semester) : 0;
					})()
				}))
				.sort((a, b) => b.week - a.week);

			for (const d of sortedDates) {
				if (!canFlipWithoutSlotConflict(d.gKey, d.dtKey, flipTo)) continue;
				teacherSubgroups[d.gKey].dates[d.dtKey].subgroup = flipTo;
				d.info.subgroup = flipTo;
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
