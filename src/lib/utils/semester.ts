export interface SemesterRange {
	start: Date;
	end: Date;
}

export interface SemesterInfo {
	id: string;
	name: string;
	folderId: string;
	timestamp: number;
	year: number;
	type: 'spring' | 'autumn';
	range: SemesterRange;
}

export const SPRING_SEMESTER_START_MONTH = 1;
export const SPRING_SEMESTER_END_MONTH = 6;
export const AUTUMN_SEMESTER_START_MONTH = 8;
export const AUTUMN_SEMESTER_END_MONTH = 0;
export const SEMESTER_WEEKS_COUNT = 18;

function getCurrentDate(): Date {
	return new Date();
}

function getFirstMondayOfMonth(year: number, month: number): Date {
	const date = new Date(year, month, 1);
	const day = date.getDay();
	const diff = day === 0 ? 6 : day - 1;

	date.setDate(date.getDate() + (diff === 0 ? 0 : 7 - diff));
	return date;
}

export function getSemesterRange(year: number, type: 'spring' | 'autumn'): SemesterRange {
	const startMonth =
		type === 'spring' ? SPRING_SEMESTER_START_MONTH : AUTUMN_SEMESTER_START_MONTH;
	const start = getFirstMondayOfMonth(year, startMonth);
	const end = new Date(start);
	end.setDate(start.getDate() + (SEMESTER_WEEKS_COUNT - 1) * 7 + 6);
	return { start, end };
}

export function getCurrentSemesterRange(): SemesterRange {
	const currentDate = getCurrentDate();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	if (currentMonth >= AUTUMN_SEMESTER_END_MONTH && currentMonth <= SPRING_SEMESTER_END_MONTH) {
		return getSemesterRange(currentYear, 'spring');
	} else {
		return getSemesterRange(currentYear, 'autumn');
	}
}

export function getCurrentSemester(): SemesterInfo {
	const currentDate = getCurrentDate();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	if (currentMonth >= AUTUMN_SEMESTER_END_MONTH && currentMonth <= SPRING_SEMESTER_END_MONTH) {
		const range = getSemesterRange(currentYear, 'spring');
		return {
			id: `spring-${currentYear}`,
			name: `Весенний ${currentYear}`,
			year: currentYear,
			type: 'spring',
			range,
			folderId: '',
			timestamp: 0
		};
	} else {
		const range = getSemesterRange(currentYear, 'autumn');
		return {
			id: `autumn-${currentYear}`,
			name: `Осенний ${currentYear}`,
			year: currentYear,
			type: 'autumn',
			range,
			folderId: '',
			timestamp: 0
		};
	}
}

export function getPreviousSemesters(count: number = 4): SemesterInfo[] {
	const currentSemester = getCurrentSemester();
	const semesters: SemesterInfo[] = [currentSemester];

	let year = currentSemester.year;
	let type: 'spring' | 'autumn' = currentSemester.type;

	for (let i = 0; i < count; i++) {
		if (type === 'spring') {
			type = 'autumn';
			year -= 1;
		} else {
			type = 'spring';
		}

		const range = getSemesterRange(year, type);
		semesters.push({
			id: `${type}-${year}`,
			name: type === 'spring' ? `Весенний ${year}` : `Осенний ${year}`,
			year,
			type,
			range,
			folderId: '',
			timestamp: 0
		});
	}

	return semesters;
}

export function detectAvailableSemesters(scheduleData: any): SemesterInfo[] {
	if (!scheduleData?.items) return [];

	const availableSemesters = new Set<string>();
	const allSemesters = getPreviousSemesters(6);

	scheduleData.items.forEach((week: any) => {
		week.days?.forEach((day: any) => {
			if (day.info?.date && day.lessons?.length > 0) {
				const date = new Date(day.info.date);
				allSemesters.forEach((semester) => {
					if (date >= semester.range.start && date <= semester.range.end) {
						availableSemesters.add(semester.id);
					}
				});
			}
		});
	});

	return allSemesters.filter((semester) => availableSemesters.has(semester.id));
}

export function getWeekNumberByDate(date: Date, semester: SemesterInfo): number {
	const weeksSinceStart = Math.floor(
		(date.getTime() - semester.range.start.getTime()) / (7 * 24 * 60 * 60 * 1000)
	);
	return Math.max(1, Math.min(SEMESTER_WEEKS_COUNT, weeksSinceStart + 1));
}

export function getCurrentWeek(): number {
	const currentDate = getCurrentDate();
	const currentSemester = getCurrentSemester();
	return getWeekNumberByDate(currentDate, currentSemester);
}

export function isDateInCurrentSemester(dateString: string): boolean {
	const date = new Date(dateString);
	const { start, end } = getCurrentSemesterRange();
	return date >= start && date <= end;
}

export function isDateInSemester(dateString: string, semester: SemesterInfo): boolean {
	const date = new Date(dateString);
	return date >= semester.range.start && date <= semester.range.end;
}

export function groupLessonsByDay(
	week: any,
	semester?: SemesterInfo
): { [key: number]: { date: string; lessons: any[] } } {
	const lessonsByDay: { [key: number]: { date: string; lessons: any[] } } = {};
	const filterFn = semester
		? (day: any) => isDateInSemester(day.info.date, semester)
		: (day: any) => isDateInCurrentSemester(day.info.date);

	week.days.filter(filterFn).forEach((day: any) => {
		const dayDate = new Date(day.info.date);
		const dayOfWeek = (dayDate.getDay() + 6) % 7;

		if (!lessonsByDay[dayOfWeek]) {
			lessonsByDay[dayOfWeek] = {
				date: day.info.date,
				lessons: []
			};
		}

		lessonsByDay[dayOfWeek].lessons.push(...day.lessons);
	});

	return lessonsByDay;
}

export function getWeekStartDate(weekNumber: number, semester?: SemesterInfo): Date {
	const semesterInfo = semester || getCurrentSemester();
	const weekStartDate = new Date(semesterInfo.range.start);
	weekStartDate.setDate(weekStartDate.getDate() + (weekNumber - 1) * 7);
	return weekStartDate;
}

export function formatWeekStartDate(weekNumber: number, semester?: SemesterInfo): string {
	const startDate = getWeekStartDate(weekNumber, semester);
	const day = startDate.getDate();
	const monthNames = [
		'января',
		'февраля',
		'марта',
		'апреля',
		'мая',
		'июня',
		'июля',
		'августа',
		'сентября',
		'октября',
		'ноября',
		'декабря'
	];
	return `${day} ${monthNames[startDate.getMonth()]}`;
}

export function getCurrentWeekMessage(): string {
	const today = getCurrentDate();
	const { start, end } = getCurrentSemesterRange();

	const day = today.getDate();
	const monthNames = [
		'января',
		'февраля',
		'марта',
		'апреля',
		'мая',
		'июня',
		'июля',
		'августа',
		'сентября',
		'октября',
		'ноября',
		'декабря'
	];
	const currentDate = `${day} ${monthNames[today.getMonth()]}`;

	if (today >= start && today <= end) {
		const currentWeek = getCurrentWeek();
		return `Сегодня ${currentDate}, ${currentWeek} неделя`;
	} else {
		return `Сегодня ${currentDate}, каникулы!`;
	}
}
