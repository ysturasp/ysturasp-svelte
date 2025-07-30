export interface SemesterRange {
	start: Date;
	end: Date;
}

export const SPRING_SEMESTER_START_MONTH = 1;
export const SPRING_SEMESTER_END_MONTH = 6;
export const AUTUMN_SEMESTER_START_MONTH = 7;
export const AUTUMN_SEMESTER_END_MONTH = 0;
export const SEMESTER_WEEKS_COUNT = 18;

function getCurrentDate(): Date {
	return new Date();
}

function getFirstMondayOfMonth(year: number, month: number): Date {
	const date = new Date(year, month, 1);
	const day = date.getDay();
	const diff = day === 0 ? 6 : day - 1;

	if (month >= 8) {
		date.setDate(date.getDate() + (diff === 0 ? 1 : 8 - diff));
	} else {
		date.setDate(date.getDate() + (diff === 0 ? 0 : 7 - diff));
	}
	return date;
}

export function getCurrentSemesterRange(): SemesterRange {
	const currentDate = getCurrentDate();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	if (currentMonth >= AUTUMN_SEMESTER_END_MONTH && currentMonth <= SPRING_SEMESTER_END_MONTH) {
		const start = getFirstMondayOfMonth(currentYear, SPRING_SEMESTER_START_MONTH);
		const end = new Date(start);
		end.setDate(start.getDate() + (SEMESTER_WEEKS_COUNT - 1) * 7 + 6);
		return { start, end };
	} else {
		const start = getFirstMondayOfMonth(currentYear, AUTUMN_SEMESTER_START_MONTH);
		const end = new Date(start);
		end.setDate(start.getDate() + (SEMESTER_WEEKS_COUNT - 1) * 7 + 6);
		return { start, end };
	}
}

export function getCurrentWeek(): number {
	const currentDate = getCurrentDate();
	const currentMonth = currentDate.getMonth();
	const currentYear = currentDate.getFullYear();

	let semesterStartDate: Date;

	if (currentMonth >= AUTUMN_SEMESTER_END_MONTH && currentMonth <= SPRING_SEMESTER_END_MONTH) {
		semesterStartDate = getFirstMondayOfMonth(currentYear, SPRING_SEMESTER_START_MONTH);
	} else {
		semesterStartDate = getFirstMondayOfMonth(currentYear, AUTUMN_SEMESTER_START_MONTH);
	}

	const weeksSinceStart = Math.floor(
		(currentDate.getTime() - semesterStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
	);

	return Math.max(1, Math.min(SEMESTER_WEEKS_COUNT, weeksSinceStart + 1));
}

export function isDateInCurrentSemester(dateString: string): boolean {
	const date = new Date(dateString);
	const { start, end } = getCurrentSemesterRange();
	return date >= start && date <= end;
}

export function groupLessonsByDay(week: any): { [key: number]: { date: string; lessons: any[] } } {
	const lessonsByDay: { [key: number]: { date: string; lessons: any[] } } = {};

	week.days
		.filter((day: any) => isDateInCurrentSemester(day.info.date))
		.forEach((day: any) => {
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
