import type { Institute, ScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';
import {
	storeInstitutesData,
	getCachedInstitutesData,
	storeScheduleData,
	getCachedScheduleData,
	cleanupCorruptedData
} from '$lib/utils/offline-storage';
import { isOnline } from '$lib/stores/offline';
import { browser } from '$app/environment';

const API_BASE = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

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

export async function getInstitutes(): Promise<Institute[]> {
	cleanupCorruptedData();
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

		const swCached = await getFromServiceWorkerCache(`${API_BASE}/actual_groups`);
		if (swCached?.items) {
			console.log('Using service worker cached institutes data');
			return swCached.items;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(`${API_BASE}/actual_groups`);
		if (swFetchCached?.items) {
			console.log('Using service worker fetch cached institutes data');
			return swFetchCached.items;
		}

		console.error('No cached data available for institutes');
		throw error;
	}
}

export async function getSchedule(group: string): Promise<ScheduleData> {
	cleanupCorruptedData();
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

		const swCached = await getFromServiceWorkerCache(`${API_BASE}/group/${group}`);
		if (swCached) {
			console.log('Using service worker cached schedule data for group:', group);
			return { ...swCached, isSWCache: true } as ScheduleData;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(`${API_BASE}/group/${group}`);
		if (swFetchCached) {
			console.log('Using service worker fetch cached schedule data for group:', group);
			return { ...swFetchCached, isSWCache: true } as ScheduleData;
		}

		console.error('No cached data available for schedule group:', group);
		throw error;
	}
}
