import type { Direction, ScheduleData } from '$lib/types/schedule';
import type { SemesterInfo } from '$lib/utils/semester';
import {
	storeInstitutesData,
	getCachedInstitutesData,
	storeScheduleData,
	getCachedScheduleData
} from '$lib/utils/offline-storage';

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
	const cached = getCachedInstitutesData<DirectionsResponse>();

	try {
		const response = await fetch(API_URL);
		const data = await response.json();

		storeInstitutesData(data);

		return data as DirectionsResponse;
	} catch (error) {
		console.error('Error fetching directions:', error);

		if (cached) {
			console.log('Using cached directions data');
			return cached;
		}

		throw error;
	}
}

export async function getSchedule(directionId: string, semesterId?: string): Promise<ScheduleData> {
	const cacheKey = semesterId ? `${directionId}_${semesterId}` : directionId;
	const cached = getCachedScheduleData<ScheduleData>(cacheKey);

	try {
		const params = new URLSearchParams();
		if (semesterId) {
			params.append('semester', semesterId);
		}
		const response = await fetch(
			`${API_URL}/schedule/${directionId}${params.toString() ? `?${params}` : ''}`
		);
		const data = await response.json();

		storeScheduleData(cacheKey, data);

		return data;
	} catch (error) {
		console.error('Error fetching schedule:', error);

		if (cached) {
			console.log('Using cached schedule data for direction:', directionId);
			return { ...cached, isCache: true };
		}

		throw error;
	}
}
