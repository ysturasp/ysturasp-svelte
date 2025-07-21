export interface Direction {
    id: string;
    name: string;
    courses: Record<string, Course>;
}

export interface Course {
    name: string;
    groups: string[];
}

export interface ScheduleData {
    items: ScheduleItem[];
}

export interface ScheduleItem {
    courseInfo: {
        name: string;
        number: string;
        startDate?: string;
    };
    days: ScheduleDay[];
}

export interface ScheduleDay {
    info: {
        type: number;
    };
    lessons: Lesson[];
}

export interface Lesson {
    number: number;
    lessonName: string;
    type: 'lecture' | 'practice' | 'other';
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
    startDate?: string;
    endDate?: string;
    additionalSlots?: {
        number: number;
        startAt?: string;
        endAt: string;
    }[];
    originalTimeTitle?: string;
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