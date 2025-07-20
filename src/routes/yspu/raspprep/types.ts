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