import type { AudienceScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';

const API_URL = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

export interface Audience {
	id: string;
	name: string;
}

export async function getAudiences(): Promise<Audience[]> {
	try {
		const response = await fetch(`${API_URL}/actual_audiences`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data.items || [];
	} catch (error) {
		console.error('Error fetching audiences:', error);
		throw error;
	}
}

export async function getAudienceSchedule(audienceId: string): Promise<AudienceScheduleData> {
	try {
		const response = await fetch(`${API_URL}/audience/${audienceId}`);
		if (!response.ok) {
			if (response.status === 429) {
				throw new Response('Too Many Requests', { status: 429 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		try {
			reachGoal('ystu_schedule_loaded_audience', { audienceId });
			reachGoal('ystu_schedule_loaded');
		} catch {}
		return data;
	} catch (error) {
		console.error('Error fetching audience schedule:', error);
		throw error;
	}
}
