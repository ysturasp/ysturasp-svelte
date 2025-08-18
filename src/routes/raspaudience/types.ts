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
