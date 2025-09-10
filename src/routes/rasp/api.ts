import type { Institute, ScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';

const API_BASE = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

export async function getInstitutes(): Promise<Institute[]> {
	try {
		const response = await fetch(`${API_BASE}/actual_groups`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		return data.items || [];
	} catch (error) {
		console.error('Error fetching institutes:', error);
		throw error;
	}
}

export async function getSchedule(group: string): Promise<ScheduleData> {
	try {
		const response = await fetch(`${API_BASE}/group/${group}`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();
		try {
			reachGoal('ystu_schedule_loaded_group', { group });
			reachGoal('ystu_schedule_loaded');
		} catch {}
		return data;
	} catch (error) {
		console.error('Error fetching schedule:', error);
		throw error;
	}
}
