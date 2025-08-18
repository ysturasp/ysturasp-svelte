export interface Course {
	name: string;
	number: string;
	course: number;
	startDate: string | null;
}

export interface Direction {
	id: string;
	name: string;
	courses: Record<string, Course>;
}

export interface DayInfo {
	type: number;
	weekNumber: number;
	date: string;
}

export interface TimeSlot {
	number: number;
	endAt: string;
}

export interface TimeInfo {
	customStartTime: string | null;
	customEndTime: string | null;
}

export interface Lesson {
	number: number;
	startAt: string;
	endAt: string;
	timeRange: string;
	originalTimeTitle: string;
	additionalSlots: TimeSlot[];
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
	timeInfo?: TimeInfo;
}

export interface ScheduleDay {
	info: DayInfo;
	lessons: Lesson[];
}

export interface ScheduleItem {
	number: number;
	courseInfo: Course;
	days: ScheduleDay[];
}

export interface ScheduleData {
	isCache: boolean;
	items: ScheduleItem[];
}

export interface TeacherScheduleData {
	items: TeacherScheduleItem[];
}

export interface TeacherScheduleItem {
	courseInfo: {
		name: string;
		number: string;
	};
	days: TeacherScheduleDay[];
}

export interface TeacherScheduleDay {
	info: {
		type: number;
	};
	lessons: TeacherLesson[];
}

export interface TeacherLesson {
	number: number;
	lessonName: string;
	type: 'lecture' | 'practice' | 'other';
	timeRange: string;
	startAt: string;
	endAt: string;
	auditoryName: string;
	isDistant: boolean;
	isStream: boolean;
	isDivision: boolean;
	groups: string;
	direction: string;
	additionalSlots?: {
		startAt: string;
		endAt: string;
	}[];
	originalTimeTitle?: string;
}

export interface AudienceScheduleData {
	items: AudienceScheduleItem[];
}

export interface AudienceScheduleItem {
	courseInfo: {
		name: string;
		number: string;
	};
	days: AudienceScheduleDay[];
}

export interface AudienceScheduleDay {
	info: {
		type: number;
	};
	lessons: AudienceLesson[];
}

export interface AudienceLesson {
	number: number;
	lessonName: string;
	type: 'lecture' | 'practice' | 'other';
	timeRange: string;
	startAt: string;
	endAt: string;
	teacherName: string;
	isDistant: boolean;
	isStream: boolean;
	isDivision: boolean;
	groups: string;
	direction: string;
	additionalSlots?: {
		startAt: string;
		endAt: string;
	}[];
	originalTimeTitle?: string;
}
