import type { Direction, ScheduleData } from '$lib/types/schedule';
import type { SemesterInfo } from '$lib/utils/semester';
import {
	storeInstitutesData,
	getCachedInstitutesData,
	storeScheduleData,
	getCachedScheduleData,
	cleanupCorruptedData
} from '$lib/utils/offline-storage';
import { browser } from '$app/environment';

const API_URL = '/api/vk';
export type YspuScheduleResponse = {
	items: Array<any>;
};

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
	cleanupCorruptedData();
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

		const swCached = await getFromServiceWorkerCache(API_URL);
		if (swCached) {
			console.log('Using service worker cached directions data');
			return swCached as DirectionsResponse;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(API_URL);
		if (swFetchCached) {
			console.log('Using service worker fetch cached directions data');
			return swFetchCached as DirectionsResponse;
		}

		console.error('No cached data available for directions');
		throw error;
	}
}

export async function getSchedule(
	directionId: string,
	semesterId?: string,
	group?: string,
	directionName?: string
): Promise<ScheduleData> {
	cleanupCorruptedData();
	const cacheKey = semesterId ? `${directionId}_${semesterId}` : directionId;
	const cached = getCachedScheduleData<ScheduleData>(cacheKey);

	try {
		const params = new URLSearchParams();
		if (semesterId) {
			params.append('semester', semesterId);
		}
		if (group) {
			params.append('group', group);
		}
		if (directionName) {
			params.append('directionName', directionName);
		}
		const url = `${API_URL}/schedule/${directionId}${params.toString() ? `?${params}` : ''}`;
		const response = await fetch(url);
		const data = await response.json();

		storeScheduleData(cacheKey, data);

		return data;
	} catch (error) {
		console.error('Error fetching schedule:', error);

		if (cached) {
			console.log('Using cached schedule data for direction:', directionId);
			return { ...cached, isSWCache: true } as ScheduleData;
		}

		const params = new URLSearchParams();
		if (semesterId) {
			params.append('semester', semesterId);
		}
		const url = `${API_URL}/schedule/${directionId}${params.toString() ? `?${params}` : ''}`;

		const swCached = await getFromServiceWorkerCache(url);
		if (swCached) {
			console.log('Using service worker cached schedule data for direction:', directionId);
			return { ...swCached, isSWCache: true } as ScheduleData;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(url);
		if (swFetchCached) {
			console.log(
				'Using service worker fetch cached schedule data for direction:',
				directionId
			);
			return { ...swFetchCached, isSWCache: true } as ScheduleData;
		}

		console.error('No cached data available for schedule direction:', directionId);
		throw error;
	}
}
