export interface Direction {
  id: string;
  name: string;
  courses: Record<string, Course>;
}

export interface Course {
  name: string;
}

export interface ScheduleData {
  items: ScheduleItem[];
}

export interface ScheduleItem {
  courseInfo: {
    number: string;
    startDate?: string;
  };
  days: Day[];
}

export interface Day {
  info: {
    date: string;
    type: number;
  };
  lessons: Lesson[];
}

export interface Lesson {
  number: number;
  lessonName: string;
  type: 'lecture' | 'practice' | 'other';
  teacherName?: string;
  auditoryName?: string;
  startAt: string;
  endAt: string;
  isDistant?: boolean;
  startDate?: string;
  endDate?: string;
  timeInfo?: {
    customStartTime?: string;
    customEndTime?: string;
  };
  additionalSlots?: AdditionalSlot[];
}

export interface AdditionalSlot {
  number: number;
  endAt: string;
} 