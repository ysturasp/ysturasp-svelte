import type { YspuScheduleResponse } from '../rasp/api';

export interface Audience {
	id: string;
	number: string;
}

const API_URL = '/api/yspu';

export async function getAudiences(): Promise<Audience[]> {
	try {
		const response = await fetch(`${API_URL}/audiences`);
		const data = await response.json();
		return data.items || [];
	} catch (error) {
		console.error('Error fetching audiences:', error);
		throw error;
	}
}

export async function getAudienceSchedule(
	audienceId: string,
	folderId: string,
	semesterName?: string
): Promise<YspuScheduleResponse> {
	const params = new URLSearchParams({ semester: folderId });
	if (semesterName) params.append('semesterName', semesterName);
	const response = await fetch(`/api/yspu/audience/${encodeURIComponent(audienceId)}?${params}`);
	return (await response.json()) as YspuScheduleResponse;
}
