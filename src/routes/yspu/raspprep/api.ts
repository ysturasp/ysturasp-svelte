import type { TeacherScheduleData } from './types';

const API_URL = 'https://script.google.com/macros/s/AKfycbxQmhIknsAvgkpP5nQOc8CWgH3KoiP_iWKumPKiitIdNatDmSHUce9erYIYU6hOVLA_/exec';

export interface Teacher {
  id: string;
  name: string;
}

export async function getTeachers(): Promise<Teacher[]> {
  try {
    const response = await fetch(`${API_URL}?action=teachers`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
}

export async function getTeacherSchedule(teacherId: string): Promise<TeacherScheduleData> {
  try {
    const response = await fetch(`${API_URL}?action=teacher&id=${teacherId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    throw error;
  }
} 