export interface AudienceScheduleData {
	items: AudienceScheduleWeek[];
}

export interface AudienceScheduleWeek {
	number: number;
	days: AudienceScheduleDay[];
}

export interface AudienceScheduleDay {
	info: {
		date: string;
	};
	lessons: AudienceLesson[];
}

export interface AudienceLesson {
	lessonName: string;
	type: number;
	timeRange: string;
	teacherName: string;
	teacherId: number;
	isDistant: boolean;
	groups: string[];
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
	12: 'Не поддерживается',
	256: 'Экзамен'
};
