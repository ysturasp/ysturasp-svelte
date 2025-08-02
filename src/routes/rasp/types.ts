export interface Institute {
	name: string;
	groups: string[];
}

export interface ScheduleData {
	items: YSTUScheduleWeek[];
}

export interface YSTUScheduleWeek {
	number: number;
	days: YSTUScheduleDay[];
}

export interface YSTUScheduleDay {
	info: {
		date: string;
	};
	lessons: YSTULesson[];
}

export interface YSTULesson {
	number: number;
	lessonName: string;
	type: number;
	timeRange: string;
	startAt: string;
	endAt: string;
	teacherName: string;
	auditoryName: string;
	isDistant: boolean;
	isStream: boolean;
	isDivision: boolean;
	groups: string;
	direction: string;
	additionalSlots?: {
		number: number;
		startAt?: string;
		endAt: string;
	}[];
	originalTimeTitle?: string;
}

export const LessonTypes: Record<number, string> = {
	0: 'none',
	2: 'Лекция',
	4: 'Практика',
	8: 'Лабораторная работа',
	1: 'Семинар',
	5: 'Консультация',
	6: 'Зачет',
	7: 'Экзамен',
	3: 'Курсовая',
	9: 'Другое'
};
