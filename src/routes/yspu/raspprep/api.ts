import type { TeacherScheduleData } from './types';

const API_URL = '/api/yspu';

export interface Teacher {
	id: string;
	name: string;
}

export async function getTeachers(): Promise<Teacher[]> {
	try {
		const response = await fetch(`${API_URL}/teachers`);
		const data = await response.json();
		return data.items || [];
	} catch (error) {
		console.error('Error fetching teachers:', error);
		throw error;
	}
}

export async function getTeacherSchedule(teacherId: string): Promise<TeacherScheduleData> {
	try {
		const response = await fetch(`${API_URL}/teacher/${encodeURIComponent(teacherId)}`);
		const data = await response.json();
		return data as TeacherScheduleData;
	} catch (error) {
		console.error('Error fetching teacher schedule:', error);
		throw error;
	}
}
