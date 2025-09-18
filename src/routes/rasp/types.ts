export interface Institute {
	name: string;
	groups: string[];
}

export interface ScheduleData {
	items: YSTUScheduleWeek[];
	isSWCache?: boolean;
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
