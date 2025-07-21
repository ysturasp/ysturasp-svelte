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