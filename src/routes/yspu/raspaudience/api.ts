import type { AudienceScheduleData } from '$lib/types/schedule';

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

export async function getSchedule(audience: string): Promise<AudienceScheduleData> {
	try {
		const response = await fetch(`${API_URL}/audience/${encodeURIComponent(audience)}`);
		const data = await response.json();
		return data;
	} catch (error) {
		console.error('Error fetching audience schedule:', error);
		throw error;
	}
}
