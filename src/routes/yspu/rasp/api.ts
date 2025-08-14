import type { Direction, ScheduleData } from '$lib/types/schedule';
import type { SemesterInfo } from '$lib/utils/semester';

const API_URL = '/api/vk';

export interface DirectionsResponse {
	schedules: Array<{
		folderId: string;
		timestamp: number | null;
		semester: string | null;
		year: number | null;
		directions: Direction[];
	}>;
	semesters: SemesterInfo[];
}

export async function getDirections(): Promise<DirectionsResponse> {
	try {
		const response = await fetch(API_URL);
		const data = await response.json();
		return data as DirectionsResponse;
	} catch (error) {
		console.error('Error fetching directions:', error);
		throw error;
	}
}

export async function getSchedule(directionId: string, semesterId?: string): Promise<ScheduleData> {
	try {
		const params = new URLSearchParams();
		if (semesterId) {
			params.append('semester', semesterId);
		}
		const response = await fetch(
			`${API_URL}/schedule/${directionId}${params.toString() ? `?${params}` : ''}`
		);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching schedule:', error);
		throw error;
	}
}
