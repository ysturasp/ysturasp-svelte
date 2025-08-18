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

export interface TimeInfo {
	customStartTime: string | null;
	customEndTime: string | null;
}

export interface TimeSlot {
	number: number;
	startAt: string;
	endAt: string;
	timeRange: string;
	originalTimeTitle: string;
}

export interface YSTULesson {
	number: number;
	lessonName: string;
	type: number;
	timeRange: string;
	startAt: string;
	endAt: string;
	teacherName: string;
	teacherId: number;
	auditoryName: string;
	additionalTeacherName?: string;
	additionalTeacherId?: number;
	isDistant?: boolean;
	isDivision?: boolean;
	groups?: string;
	originalTimeTitle?: string;
	uniqueIndex?: number;
	originalText?: string;
	timeInfo?: TimeInfo;
	additionalSlots?: TimeSlot[];
}

export const LessonTypes: Record<number, string> = {
	0: 'none',
	2: 'Лекция',
	4: 'Практика',
	8: 'Лабораторная работа',
	1: 'Курсовой проект',
	5: 'Консультация',
	6: 'Лекция + Практика',
	7: 'Дифференцированный зачет',
	3: 'Экзамен',
	9: 'Библиотека',
	10: 'Лекция + Лабораторная работа',
	11: 'Организационное собрание',
	12: 'Не поддерживается'
};
