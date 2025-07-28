import type { TeacherScheduleData } from './types';

const API_URL = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

export interface Teacher {
	id: string;
	name: string;
}

export async function getTeachers(): Promise<Teacher[]> {
	try {
		const response = await fetch(`${API_URL}/actual_teachers`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data.items || [];
	} catch (error) {
		console.error('Error fetching teachers:', error);
		throw error;
	}
}

export async function getTeacherSchedule(teacherId: string): Promise<TeacherScheduleData> {
	try {
		const response = await fetch(`${API_URL}/teacher/${teacherId}`);
		if (!response.ok) {
			if (response.status === 429) {
				throw new Response('Too Many Requests', { status: 429 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching teacher schedule:', error);
		throw error;
	}
}
