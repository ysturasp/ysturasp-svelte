import type { TeacherScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';
import { browser } from '$app/environment';
import {
	storeTeachersData,
	getCachedTeachersData,
	storeScheduleData,
	getCachedScheduleData,
	cleanupCorruptedData
} from '$lib/utils/offline-storage';

const API_URL = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

async function getFromServiceWorkerCache(url: string): Promise<any | null> {
	if (!browser || !('caches' in window)) {
		console.log('Service worker cache not available');
		return null;
	}

	try {
		const cacheNames = await caches.keys();
		console.log('Available caches:', cacheNames);

		const apiCacheName = cacheNames.find(
			(name) => name.includes('ysturasp') && name.includes('api')
		);
		if (!apiCacheName) {
			console.log('No API cache found');
			return null;
		}

		console.log('Using cache:', apiCacheName);
		const cache = await caches.open(apiCacheName);
		const response = await cache.match(url);

		if (response) {
			console.log('Found cached response for:', url);
			return await response.json();
		} else {
			console.log('No cached response found for:', url);
		}
	} catch (error) {
		console.error('Error getting from service worker cache:', error);
	}

	return null;
}

async function getFromServiceWorkerViaFetch(url: string): Promise<any | null> {
	if (!browser) return null;

	try {
		const response = await fetch(url, {
			cache: 'force-cache',
			mode: 'cors'
		});

		if (response.ok) {
			console.log('Got response from service worker via fetch for:', url);
			return await response.json();
		}
	} catch (error) {
		console.log('Service worker fetch failed for:', url, error);
	}

	return null;
}

export interface Teacher {
	id: number;
	name: string;
}

export async function getTeachers(): Promise<Teacher[]> {
	cleanupCorruptedData();
	const cached = getCachedTeachersData<{ items: Teacher[] }>();

	try {
		const response = await fetch(`${API_URL}/actual_teachers`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeTeachersData(data);

		return data.items || [];
	} catch (error) {
		console.error('Error fetching teachers:', error);

		if (cached?.items) {
			console.log('Using cached teachers data');
			return cached.items;
		}

		const swCached = await getFromServiceWorkerCache(`${API_URL}/actual_teachers`);
		if (swCached?.items) {
			console.log('Using service worker cached teachers data');
			return swCached.items;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(`${API_URL}/actual_teachers`);
		if (swFetchCached?.items) {
			console.log('Using service worker fetch cached teachers data');
			return swFetchCached.items;
		}

		console.error('No cached data available for teachers');
		throw error;
	}
}

export async function getTeacherSchedule(teacherId: number): Promise<TeacherScheduleData> {
	cleanupCorruptedData();
	const cached = getCachedScheduleData<TeacherScheduleData>(`teacher_${teacherId}`);

	try {
		const response = await fetch(`${API_URL}/teacher/${teacherId}`);
		if (!response.ok) {
			if (response.status === 429) {
				throw new Response('Too Many Requests', { status: 429 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeScheduleData(`teacher_${teacherId}`, data);

		try {
			reachGoal('ystu_schedule_loaded_teacher', { teacherId });
			reachGoal('ystu_schedule_loaded');
		} catch {}

		return data;
	} catch (error) {
		console.error('Error fetching teacher schedule:', error);

		if (cached) {
			console.log('Using cached teacher schedule data for teacher:', teacherId);
			return { ...cached, isSWCache: true } as TeacherScheduleData;
		}

		const swCached = await getFromServiceWorkerCache(`${API_URL}/teacher/${teacherId}`);
		if (swCached) {
			console.log(
				'Using service worker cached teacher schedule data for teacher:',
				teacherId
			);
			return { ...swCached, isSWCache: true } as TeacherScheduleData;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(`${API_URL}/teacher/${teacherId}`);
		if (swFetchCached) {
			console.log(
				'Using service worker fetch cached teacher schedule data for teacher:',
				teacherId
			);
			return { ...swFetchCached, isSWCache: true } as TeacherScheduleData;
		}

		console.error('No cached data available for teacher schedule:', teacherId);
		throw error;
	}
}
