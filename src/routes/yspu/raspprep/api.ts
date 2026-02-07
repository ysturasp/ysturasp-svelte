import type { YspuScheduleResponse } from '../rasp/api';

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

export async function getTeacherSchedule(
	teacherName: string,
	folderId: string,
	semesterName?: string
): Promise<YspuScheduleResponse> {
	const params = new URLSearchParams({ semester: folderId });
	if (semesterName) params.append('semesterName', semesterName);
	const response = await fetch(`/api/yspu/teacher/${encodeURIComponent(teacherName)}?${params}`);
	return (await response.json()) as YspuScheduleResponse;
}
