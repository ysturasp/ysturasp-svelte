import { json } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import type { RequestEvent } from '@sveltejs/kit';
import { getRedisClient } from '$lib/config/redis';
import { getYspuScheduleKey } from '$lib/utils/redis-keys';

interface TimeSlot {
	start: string;
	end: string;
}

interface TimeSlots {
	[key: number]: TimeSlot;
}

type CourseKey = 'first' | 'second' | 'third' | 'fourth';

interface ParsedSubject {
	lessonName: string;
	type: 'lecture' | 'practice' | 'other';
	teacherName: string;
	auditoryName: string | null;
	isDistant: boolean;
	isStream: boolean;
	isDivision: boolean;
	startDate: string | null;
	endDate: string | null;
	duration: number;
	durationMinutes: number;
	isShort: boolean;
	isLecture: boolean;
	originalText: string;
	lessonNumber: number | null;
	defaultTime: string;
	timeInfo: { customStartTime: string | null; customEndTime: string | null };
	unparsedText: string;
	isPartOfComposite?: boolean;
	weekType: 'numerator' | 'denominator' | null;
}

const API_URL = 'https://drive.google.com/uc';

async function getFileContent(fileId: string): Promise<ArrayBuffer | null> {
	try {
		const response = await fetch(`${API_URL}?id=${fileId}&export=download`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'
			}
		});
		if (!response.ok) {
			console.error(`Ошибка загрузки файла ${fileId}:`, response.status, response.statusText);
			return null;
		}
		return response.arrayBuffer();
	} catch (error) {
		console.error(`Ошибка при загрузке файла ${fileId}:`, error);
		return null;
	}
}

function parseTime(timeStr: string, customTimeInfo: any = null) {
	if (!timeStr) {
		return {
			number: 1,
			startAt: '08:30',
			endAt: '10:05',
			timeRange: '08:30-10:05',
			originalTimeTitle: '1. 08.30-10.05',
			additionalSlots: []
		};
	}

	const timeSlots: TimeSlots = {
		1: { start: '08:30', end: '10:05' },
		2: { start: '10:15', end: '11:50' },
		3: { start: '12:15', end: '13:50' },
		4: { start: '14:00', end: '15:35' },
		5: { start: '15:45', end: '17:20' },
		6: { start: '17:30', end: '19:05' },
		7: { start: '19:15', end: '20:50' }
	};

	const slots = timeStr.split(',').map((s) => s.trim());

	if (slots.length > 1) {
		const parsedSlots = slots
			.map((slot) => {
				const numberMatch = slot.match(/^(\d+)\./);
				if (numberMatch) {
					const number = parseInt(numberMatch[1]);
					const timeSlot = timeSlots[number];
					if (timeSlot) {
						return {
							number: number,
							startAt: timeSlot.start,
							endAt: timeSlot.end,
							timeRange: `${timeSlot.start}-${timeSlot.end}`,
							originalTimeTitle: `${number}. ${timeSlot.start.replace(':', '.')}-${timeSlot.end.replace(':', '.')}`
						};
					}
				}
				return null;
			})
			.filter(Boolean) as any[];

		if (parsedSlots.length > 0) {
			const mainSlot = parsedSlots[0];
			return {
				...mainSlot,
				originalTimeTitle: timeStr,
				additionalSlots: parsedSlots.slice(1)
			};
		}
	}

	const numberOnlyMatch = timeStr.match(/^(\d+)$/);
	if (numberOnlyMatch) {
		const number = parseInt(numberOnlyMatch[1]);
		const slot = timeSlots[number] || timeSlots[1];
		return {
			number: number,
			startAt: slot.start,
			endAt: slot.end,
			timeRange: `${slot.start}-${slot.end}`,
			originalTimeTitle: timeStr,
			additionalSlots: []
		};
	}

	const parenNumberMatch = timeStr.match(/\((\d+)\s*пара\)/);
	if (parenNumberMatch) {
		const number = parseInt(parenNumberMatch[1]);
		const slot = timeSlots[number] || timeSlots[1];
		return {
			number: number,
			startAt: slot.start,
			endAt: slot.end,
			timeRange: `${slot.start}-${slot.end}`,
			originalTimeTitle: timeStr,
			additionalSlots: []
		};
	}

	const dotNumberMatch = timeStr.match(/^(\d+)\./);
	if (dotNumberMatch) {
		const number = parseInt(dotNumberMatch[1]);
		const slot = timeSlots[number] || timeSlots[1];

		const timeMatch = timeStr.match(/(\d{2})\.(\d{2})-(\d{2})\.(\d{2})/);
		if (timeMatch) {
			const [_, startHour, startMin, endHour, endMin] = timeMatch;
			return {
				number: number,
				startAt: `${startHour}:${startMin}`,
				endAt: `${endHour}:${endMin}`,
				timeRange: `${startHour}:${startMin}-${endHour}:${endMin}`,
				originalTimeTitle: timeStr,
				additionalSlots: []
			};
		}

		return {
			number: number,
			startAt: slot.start,
			endAt: slot.end,
			timeRange: `${slot.start}-${slot.end}`,
			originalTimeTitle: timeStr,
			additionalSlots: []
		};
	}

	return {
		number: 1,
		startAt: '08:30',
		endAt: '10:05',
		timeRange: '08:30-10:05',
		originalTimeTitle: timeStr,
		additionalSlots: []
	};
}

function parseSubject(
	subjectStr: string,
	defaultTime: string = ''
): ParsedSubject | ParsedSubject[] | null {
	if (!subjectStr) return null;

	const languagePattern =
		/([А-ЯЁ][а-яё]+(?:\s+[а-яё]+)*\s+язык),\s*(?:доц\.|проф\.|ст\.преп\.|асс\.|преп\.)/g;
	const languageMatches = [...subjectStr.matchAll(languagePattern)];

	if (languageMatches.length > 1) {
		const subjects: ParsedSubject[] = [];
		let lastIndex = 0;
		let currentText = '';

		for (const match of languageMatches) {
			if (match.index > lastIndex) {
				if (currentText) {
					const parsed = parseSubject(currentText, defaultTime);
					if (parsed) {
						if (Array.isArray(parsed)) {
							parsed.forEach((p) => {
								p.isPartOfComposite = true;
								subjects.push(p);
							});
						} else {
							parsed.isPartOfComposite = true;
							subjects.push(parsed);
						}
					}
				}
			}

			const nextMatch = languageMatches.find(
				(m) => (m.index as number) > (match.index as number)
			);
			const endIndex = nextMatch ? (nextMatch.index as number) : subjectStr.length;
			currentText = subjectStr.substring(match.index as number, endIndex);
			lastIndex = match.index as number;
		}

		if (currentText) {
			const parsed = parseSubject(currentText, defaultTime);
			if (parsed) {
				if (Array.isArray(parsed)) {
					parsed.forEach((p) => {
						p.isPartOfComposite = true;
						subjects.push(p);
					});
				} else {
					parsed.isPartOfComposite = true;
					subjects.push(parsed);
				}
			}
		}

		if (subjects.length > 0) {
			return subjects;
		}
	}

	const subjectsSplit = subjectStr.split(/\n\s*\n/).filter(Boolean);
	if (subjectsSplit.length > 1) {
		return subjectsSplit
			.map((s) => {
				const parsed = parseSubject(s, defaultTime);
				if (parsed && !Array.isArray(parsed)) {
					parsed.isPartOfComposite = true;
				}
				return parsed as ParsedSubject;
			})
			.filter(Boolean) as ParsedSubject[];
	}

	const lowerSubject = subjectStr.toLowerCase();
	const parts = subjectStr.split(',').map((p) => p.trim());
	let name = parts[0].trim();

	let customStartTime: string | null = null;
	let customEndTime: string | null = null;
	let unparsedText = new Set<string>();
	let remainingText = subjectStr;

	const startTimeMatch = subjectStr.match(/с\s*(\d{2}):(\d{2})/);
	if (startTimeMatch) {
		customStartTime = `${startTimeMatch[1]}:${startTimeMatch[2]}`;
		remainingText = remainingText.replace(startTimeMatch[0], '');
	}

	const endTimeMatch = subjectStr.match(/до\s*(\d{2}):(\d{2})/);
	if (endTimeMatch) {
		customEndTime = `${endTimeMatch[1]}:${endTimeMatch[2]}`;
		remainingText = remainingText.replace(endTimeMatch[0], '');
	}

	const isDistant =
		lowerSubject.includes('дистант') ||
		lowerSubject.includes('онлайн') ||
		lowerSubject.includes('он-лайн') ||
		parts.some((part) => part.trim().toLowerCase() === 'онлайн') ||
		parts.some((part) => part.trim().toLowerCase() === 'он-лайн');

	const isStream = lowerSubject.includes('поток');
	const isDivision = lowerSubject.includes('подгруппа');

	let weekType: 'numerator' | 'denominator' | null = null;
	if (lowerSubject.includes('числитель')) {
		weekType = 'numerator';
		remainingText = remainingText.replace(/\s*\(числитель\)/gi, '');
	} else if (lowerSubject.includes('знаменатель')) {
		weekType = 'denominator';
		remainingText = remainingText.replace(/\s*\(знаменатель\)/gi, '');
	}

	const isPhysicalEducation =
		name.toLowerCase().includes('физ') ||
		name.toLowerCase().includes('фк') ||
		name.toLowerCase().includes('физическ') ||
		name.toLowerCase().includes('элективные дисциплины по фк');

	let type: 'lecture' | 'practice' | 'other' = 'other';
	if (isPhysicalEducation) {
		type = 'practice';
	} else {
		type = lowerSubject.includes('лек')
			? 'lecture'
			: lowerSubject.includes('практ')
				? 'practice'
				: 'other';
	}

	let teachers: string[] = [];
	const teacherRegexPatterns = [
		/(?:доц\.|проф\.|ст\.преп\.|асс\.|преп\.)?\s*([А-ЯЁ][а-яё]+)\s*([А-ЯЁ])\s*\.\s*([А-ЯЁ])\s*\./,
		/(?:доц\.|проф\.|ст\.преп\.|асс\.|преп\.)?\s*([А-ЯЁ])\s*\.\s*([А-ЯЁ])\s*\.\s*([А-ЯЁ][а-яё]+)/,
		/(?:доц\.|проф\.|ст\.преп\.|асс\.|преп\.)?\s*([А-ЯЁ])\s*\.\s*([А-ЯЁ])\s*\.\s*([А-ЯЁ][а-яё]+)/,
		/(?:доц\.|проф\.|ст\.преп\.|асс\.|преп\.)?\s*([А-ЯЁ])\s+([А-ЯЁ])\s+([А-ЯЁ][а-яё]+)/
	];

	for (const pattern of teacherRegexPatterns) {
		const matches = [...remainingText.matchAll(new RegExp(pattern, 'g'))];
		for (const match of matches) {
			let teacher;
			if ((match[1] as string).length > 1) {
				teacher = `${match[1]} ${match[2]}.${match[3]}.`;
			} else {
				teacher = `${match[3]} ${match[1]}.${match[2]}.`;
			}

			teacher = teacher
				.replace(/\s*\([^)]*\)/g, '')
				.replace(/\s+с\s+\d{2}:\d{2}/g, '')
				.replace(/\s+до\s+\d{2}\.\d{2}\.\d{4}/g, '')
				.replace(/\s+кроме\s+\d{2}\.\d{2}\.\d{4}/g, '')
				.trim();

			if (!teachers.includes(teacher)) {
				teachers.push(teacher);
			}
			remainingText = remainingText.replace(match[0], '');
		}
	}

	let subjectWithoutDates = remainingText.replace(/(?:с|по|до)\s*\d{2}\.\d{2}\.\d{4}/g, '');

	const buildingMatch = subjectWithoutDates.match(
		/(\d+)(?:-[её]|е|ое)?\s*(?:уч\.?|учебное)?\s*зд(?:ание)?\.?/i
	);
	const building = buildingMatch ? buildingMatch[1] : null;
	if (buildingMatch) {
		remainingText = remainingText.replace(buildingMatch[0], '');
	}

	let room: string | null = null;
	const roomMatch = subjectWithoutDates.match(
		/,\s*(?:ауд\.)?\s*(\d+[МАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ]?)\s*(?:\(|$|,|\s+|ЕГФ|гл\.з\.)/
	);
	const sportHallMatch = subjectWithoutDates.match(
		/(?:спорт\.?\s*зал|спортзал|спортивный\s*зал)/i
	);

	if (roomMatch) {
		room = roomMatch[1];
		remainingText = remainingText.replace(roomMatch[0], '');
	} else if (sportHallMatch) {
		room = 'спортзал';
		remainingText = remainingText.replace(sportHallMatch[0], '');
	}

	if (building && room) {
		room = `${building}-${room}`;
	}

	const startDateMatch = subjectStr.match(/с\s*(\d{2}\.\d{2}\.\d{4})/);
	const endDateMatch = subjectStr.match(/(?:по|до)\s*(\д{2}\.\д{2}\.\д{4})/);
	const startDate = startDateMatch ? startDateMatch[1] : null;
	const endDate = endDateMatch ? endDateMatch[1] : null;

	if (startDateMatch) remainingText = remainingText.replace(startDateMatch[0], '');
	if (endDateMatch) remainingText = remainingText.replace(endDateMatch[0], '');

	const lessonNumberMatch = subjectStr.match(/\((\d+)\s*пара\)/);
	const lessonNumber = lessonNumberMatch ? parseInt(lessonNumberMatch[1]) : null;

	if (lessonNumberMatch) remainingText = remainingText.replace(lessonNumberMatch[0], '');

	let cleanName = name;

	cleanName = cleanName
		.replace(/\s*\(лекции\)/i, '')
		.replace(/\s*лек\./i, '')
		.replace(/\s*практ\./i, '')
		.replace(/\s*\(\d+\s*пара\)/, '')
		.replace(/\s*с\s*\d{2}:\d{2}/, '')
		.replace(/\s*до\s*\d{2}:\d{2}/, '')
		.replace(/\s*с\s*\d{2}\.\d{2}\.\d{4}/, '')
		.replace(/\s*по\s*\d{2}\.\d{2}\.\d{4}/, '')
		.trim();

	remainingText = remainingText
		.replace(/,+/g, ',')
		.replace(/\s+/g, ' ')
		.replace(/^\s*,\s*/, '')
		.replace(/\s*,\s*$/, '')
		.replace(/лекция/gi, '')
		.replace(/практика/gi, '')
		.replace(/онлайн/gi, '')
		.replace(/дистант/gi, '')
		.replace(/поток/gi, '')
		.replace(/подгруппа/gi, '')
		.trim();

	if (remainingText) {
		unparsedText.add(remainingText);
	}

	const timeInfo = {
		customStartTime,
		customEndTime
	};

	return {
		lessonName: cleanName,
		type: type,
		teacherName: teachers.join(', '),
		auditoryName: room,
		isDistant: isDistant,
		isStream: isStream,
		isDivision: isDivision,
		startDate: startDate,
		endDate: endDate,
		duration: 2,
		durationMinutes: 90,
		isShort: false,
		isLecture: type === 'lecture',
		originalText: subjectStr.trim(),
		lessonNumber: lessonNumber,
		defaultTime: defaultTime,
		timeInfo: timeInfo,
		unparsedText: Array.from(unparsedText).join('; '),
		weekType
	};
}

async function parseSchedule(fileId: string) {
	try {
		const buffer = await getFileContent(fileId);
		if (!buffer) {
			throw new Error('Не удалось получить содержимое файла');
		}

		const workbook = XLSX.read(buffer, { type: 'array' });
		const worksheet = workbook.Sheets['Table 1'];

		if (!worksheet) {
			throw new Error('Лист "Table 1" не найден');
		}

		const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null }) as any[][];
		const merges = (worksheet['!merges'] || []) as Array<{
			s: { r: number; c: number };
			e: { r: number; c: number };
		}>;

		function getMergedCellValue(row: number, col: number): string | null {
			for (const merge of merges) {
				if (row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c) {
					const colLetter = XLSX.utils.encode_col(merge.s.c);
					const cellRef = `${colLetter}${merge.s.r + 1}`;
					return (worksheet as any)[cellRef]?.v || null;
				}
			}
			return null;
		}

		function isCellMerged(row: number, col: number): boolean {
			return merges.some(
				(merge) =>
					row >= merge.s.r && row <= merge.e.r && col >= merge.s.c && col <= merge.e.c
			);
		}

		const schedule: { isCache: boolean; items: any[] } = {
			isCache: false,
			items: []
		};

		let groupHeaderRowIndex = 3;
		let firstGroupColIndex = 2;
		const groupPattern = /(\d+)\s*\((\d+)\s*курс/;

		for (let i = 0; i < Math.min(10, rawData.length); i++) {
			const row = rawData[i];
			if (!Array.isArray(row)) continue;

			const colIndex = row.findIndex(
				(cell) => typeof cell === 'string' && groupPattern.test(cell)
			);

			if (colIndex !== -1) {
				groupHeaderRowIndex = i;
				firstGroupColIndex = colIndex;
				break;
			}
		}

		const groups: Record<CourseKey, any> = {
			first: rawData[groupHeaderRowIndex][firstGroupColIndex],
			second: rawData[groupHeaderRowIndex][firstGroupColIndex + 1],
			third: rawData[groupHeaderRowIndex][firstGroupColIndex + 2],
			fourth: rawData[groupHeaderRowIndex][firstGroupColIndex + 3]
		};

		const directionHeaders: Record<CourseKey, string> = {
			first: rawData[groupHeaderRowIndex - 1]?.[firstGroupColIndex] || '',
			second: rawData[groupHeaderRowIndex - 1]?.[firstGroupColIndex + 1] || '',
			third: rawData[groupHeaderRowIndex - 1]?.[firstGroupColIndex + 2] || '',
			fourth: rawData[groupHeaderRowIndex - 1]?.[firstGroupColIndex + 3] || ''
		};

		const courseInfo: Partial<
			Record<CourseKey, { number: string; course: number | null; startDate: string | null }>
		> = {};
		Object.entries(groups).forEach(([courseKey, groupName]) => {
			const course = courseKey as CourseKey;
			if (groupName) {
				let startDate: string | null = null;
				let groupNumber: string | null = null;
				let courseNumber: number | null = null;

				const fullMatch = (groupName as string).match(
					/(\d+)\s*\((\d+)\s*курс\)\s*с\s*(\d{2}\.\d{2}\.\d{4})/
				);
				if (fullMatch) {
					groupNumber = fullMatch[1];
					courseNumber = parseInt(fullMatch[2]);
					startDate = fullMatch[3];
				} else {
					const simpleMatch = (groupName as string).match(/(\d+)\s*\((\d+)\s*курс\)/);
					if (simpleMatch) {
						groupNumber = simpleMatch[1];
						courseNumber = parseInt(simpleMatch[2]);
					} else {
						const numberMatch = (groupName as string).match(/^(\d{4,5})/);
						if (numberMatch) {
							groupNumber = numberMatch[1];
							courseNumber = 1;
						}
					}
				}

				if (!startDate && groupNumber && groupNumber.match(/^9[34]/)) {
					const headerDateMatch =
						directionHeaders[course].match(/с\s*(\d{2}\.\d{2}\.\д{4})/);
					if (headerDateMatch) {
						startDate = headerDateMatch[1];
					}
				}

				if (groupNumber) {
					courseInfo[course] = {
						number: groupNumber,
						course: courseNumber,
						startDate: startDate
					};
				}
			}
		});

		let currentDay: string | null = null;
		let currentDaySchedule: Record<CourseKey, Array<{ time: string; subject: string }>> = {
			first: [],
			second: [],
			third: [],
			fourth: []
		};

		const courseColumns: Record<CourseKey, number> = {
			first: firstGroupColIndex,
			second: firstGroupColIndex + 1,
			third: firstGroupColIndex + 2,
			fourth: firstGroupColIndex + 3
		};

		const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

		const dayColIndex = Math.max(0, firstGroupColIndex - 2);
		const timeColIndex = Math.max(0, firstGroupColIndex - 1);

		for (let i = groupHeaderRowIndex + 1; i < rawData.length; i++) {
			const row: any[] = rawData[i];
			if (!row) continue;

			let dayName: string | null = row[dayColIndex];
			if (typeof dayName === 'string') dayName = dayName.trim();

			if ((!dayName || !dayNames.includes(dayName)) && dayColIndex > 0) {
				const altDay = row[0];
				if (typeof altDay === 'string' && dayNames.includes(altDay.trim())) {
					dayName = altDay.trim();
				}
			}

			const excelRowIdx = i + 1;

			if (typeof dayName === 'string' && dayNames.includes(dayName)) {
				if (currentDay) {
					Object.entries(currentDaySchedule).forEach(([courseKey, lessons]) => {
						const course = courseKey as CourseKey;
						if (lessons.length > 0 && courseInfo[course]) {
							const processedLessons: any[] = [];

							lessons.forEach((lesson) => {
								const parsedSubjects = parseSubject(lesson.subject, lesson.time);
								if (Array.isArray(parsedSubjects)) {
									parsedSubjects.forEach((parsedSubject) => {
										const timeInfo = parsedSubject.lessonNumber
											? parseTime(
													`${parsedSubject.lessonNumber}`,
													parsedSubject.timeInfo
												)
											: parseTime(
													parsedSubject.defaultTime,
													parsedSubject.timeInfo
												);
										if (timeInfo) {
											processedLessons.push({
												...timeInfo,
												...parsedSubject
											});
										}
									});
								} else if (parsedSubjects) {
									const timeInfo = parseTime(
										lesson.time,
										parsedSubjects.timeInfo
									);
									if (timeInfo) {
										processedLessons.push({
											...timeInfo,
											...parsedSubjects
										});
									}
								}
							});

							processedLessons.sort((a, b) => {
								if (a.number === b.number) {
									if (a.type === 'lecture' && b.type !== 'lecture') return -1;
									if (a.type !== 'lecture' && b.type === 'lecture') return 1;
									return 0;
								}
								return a.number - b.number;
							});

							schedule.items.push({
								number:
									course === 'first'
										? 1
										: course === 'second'
											? 2
											: course === 'third'
												? 3
												: 4,
								courseInfo: courseInfo[course],
								days: [
									{
										info: {
											type: dayNames.indexOf(currentDay as string),
											weekNumber: 1,
											date: new Date().toISOString()
										},
										lessons: processedLessons
									}
								]
							});
						}
					});
				}
				currentDay = dayName;
				currentDaySchedule = {
					first: [],
					second: [],
					third: [],
					fourth: []
				};
			}

			if (currentDay) {
				const time: string = row[timeColIndex];
				const subjects: Record<CourseKey, any> = {
					first: row[courseColumns.first],
					second: row[courseColumns.second],
					third: row[courseColumns.third],
					fourth: row[courseColumns.fourth]
				};

				Object.entries(subjects).forEach(([courseKey, subject]) => {
					const course = courseKey as CourseKey;
					const col = courseColumns[course];
					let actualSubject: string | null = subject as string | null;

					if (!actualSubject && isCellMerged(excelRowIdx, col)) {
						actualSubject = getMergedCellValue(excelRowIdx, col);
					}

					if (actualSubject) {
						const last =
							currentDaySchedule[course][currentDaySchedule[course].length - 1];

						if (last && last.subject === actualSubject) {
							last.time += ', ' + (time || '');
						} else {
							currentDaySchedule[course].push({
								time: time || '',
								subject: actualSubject
							});
						}
					} else if (
						currentDaySchedule[course].length > 0 &&
						isCellMerged(excelRowIdx, col)
					) {
						currentDaySchedule[course][currentDaySchedule[course].length - 1].time +=
							', ' + (time || '');
					}
				});
			}
		}

		if (currentDay) {
			Object.entries(currentDaySchedule).forEach(([courseKey, lessons]) => {
				const course = courseKey as CourseKey;
				if (lessons.length > 0 && courseInfo[course]) {
					const processedLessons: any[] = [];

					lessons.forEach((lesson) => {
						const parsedSubjects = parseSubject(lesson.subject, lesson.time);
						if (Array.isArray(parsedSubjects)) {
							parsedSubjects.forEach((parsedSubject) => {
								const timeInfo = parsedSubject.lessonNumber
									? parseTime(
											`${parsedSubject.lessonNumber}`,
											parsedSubject.timeInfo
										)
									: parseTime(parsedSubject.defaultTime, parsedSubject.timeInfo);
								if (timeInfo) {
									processedLessons.push({
										...timeInfo,
										...parsedSubject
									});
								}
							});
						} else if (parsedSubjects) {
							const timeInfo = parseTime(lesson.time, parsedSubjects.timeInfo);
							if (timeInfo) {
								processedLessons.push({
									...timeInfo,
									...parsedSubjects
								});
							}
						}
					});

					processedLessons.sort((a, b) => {
						if (a.number === b.number) {
							if (a.type === 'lecture' && b.type !== 'lecture') return -1;
							if (a.type !== 'lecture' && b.type === 'lecture') return 1;
							return 0;
						}
						return a.number - b.number;
					});

					schedule.items.push({
						number:
							course === 'first'
								? 1
								: course === 'second'
									? 2
									: course === 'third'
										? 3
										: 4,
						courseInfo: courseInfo[course],
						days: [
							{
								info: {
									type: dayNames.indexOf(currentDay as string),
									weekNumber: 1,
									date: new Date().toISOString()
								},
								lessons: processedLessons
							}
						]
					});
				}
			});
		}

		return schedule;
	} catch (error) {
		console.error('Ошибка при парсинге расписания:', error);
		return {
			isCache: false,
			items: []
		};
	}
}

export async function GET({ params }: RequestEvent) {
	try {
		const fileId = params.id as string;
		const cacheKey = getYspuScheduleKey(fileId);
		const redis = getRedisClient();
		const CACHE_TTL = 3600;

		try {
			const cached = await redis.get(cacheKey);
			if (cached) {
				return json(JSON.parse(cached));
			}
		} catch (redisError) {
			console.error('Redis error (reading cache):', redisError);
		}

		const schedule = await parseSchedule(fileId);

		try {
			await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(schedule));
		} catch (redisError) {
			console.error('Redis error (writing cache):', redisError);
		}

		return json(schedule);
	} catch (error) {
		console.error('Ошибка при обработке запроса:', error);
		return json(
			{
				error: 'Внутренняя ошибка сервера',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
