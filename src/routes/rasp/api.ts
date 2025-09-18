import type { Institute, ScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';
import {
	storeInstitutesData,
	getCachedInstitutesData,
	storeScheduleData,
	getCachedScheduleData
} from '$lib/utils/offline-storage';
import { isOnline } from '$lib/stores/offline';

const API_BASE = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

export async function getInstitutes(): Promise<Institute[]> {
	const cached = getCachedInstitutesData<{ items: Institute[] }>();

	try {
		const response = await fetch(`${API_BASE}/actual_groups`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeInstitutesData(data);

		return data.items || [];
	} catch (error) {
		console.error('Error fetching institutes:', error);

		if (cached?.items) {
			console.log('Using cached institutes data');
			return cached.items;
		}

		throw error;
	}
}

export async function getSchedule(group: string): Promise<ScheduleData> {
	const cached = getCachedScheduleData<ScheduleData>(group);

	try {
		const response = await fetch(`${API_BASE}/group/${group}`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeScheduleData(group, data);

		try {
			reachGoal('ystu_schedule_loaded_group', { group });
			reachGoal('ystu_schedule_loaded');
		} catch {}

		return data;
	} catch (error) {
		console.error('Error fetching schedule:', error);

		if (cached) {
			console.log('Using cached schedule data for group:', group);
			return { ...cached, isSWCache: true } as ScheduleData;
		}

		throw error;
	}
}
