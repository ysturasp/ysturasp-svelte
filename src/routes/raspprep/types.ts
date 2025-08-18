export interface TeacherScheduleData {
	items: TeacherScheduleWeek[];
}

export interface TeacherScheduleWeek {
	number: number;
	days: TeacherScheduleDay[];
}

export interface TeacherScheduleDay {
	info: {
		date: string;
	};
	lessons: TeacherLesson[];
}

export interface TeacherLesson {
	lessonName: string;
	type: number;
	timeRange: string;
	auditoryName: string;
	teacherName: string;
	isDistant: boolean;
	groups: string[];
}
