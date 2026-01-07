import type { AudienceScheduleData } from './types';
import { reachGoal } from '$lib/utils/metrika';
import { browser } from '$app/environment';
import {
	storeAudiencesData,
	getCachedAudiencesData,
	storeScheduleData,
	getCachedScheduleData,
	cleanupCorruptedData
} from '$lib/utils/offline-storage';

const API_URL = '/api/schedule';

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

export interface Audience {
	id: string;
	name: string;
}

export async function getAudiences(): Promise<Audience[]> {
	cleanupCorruptedData();
	const cached = getCachedAudiencesData<{ items: Audience[] }>();

	try {
		const response = await fetch(`${API_URL}/audiences`);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeAudiencesData(data);

		return data.items || [];
	} catch (error) {
		console.error('Error fetching audiences:', error);

		if (cached?.items) {
			console.log('Using cached audiences data');
			return cached.items;
		}

		const swCached = await getFromServiceWorkerCache(`${API_URL}/audiences`);
		if (swCached?.items) {
			console.log('Using service worker cached audiences data');
			return swCached.items;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(`${API_URL}/audiences`);
		if (swFetchCached?.items) {
			console.log('Using service worker fetch cached audiences data');
			return swFetchCached.items;
		}

		console.error('No cached data available for audiences');
		throw error;
	}
}

export async function getAudienceSchedule(audienceId: string): Promise<AudienceScheduleData> {
	cleanupCorruptedData();
	const cached = getCachedScheduleData<AudienceScheduleData>(`audience_${audienceId}`);

	try {
		const response = await fetch(`${API_URL}/audience/${audienceId}`);
		if (!response.ok) {
			if (response.status === 429) {
				throw new Response('Too Many Requests', { status: 429 });
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data = await response.json();

		storeScheduleData(`audience_${audienceId}`, data);

		try {
			reachGoal('ystu_schedule_loaded_audience', { audienceId });
			reachGoal('ystu_schedule_loaded');
		} catch {}

		return data;
	} catch (error) {
		console.error('Error fetching audience schedule:', error);

		if (cached) {
			console.log('Using cached audience schedule data for audience:', audienceId);
			return { ...cached, isSWCache: true } as AudienceScheduleData;
		}

		const swCached = await getFromServiceWorkerCache(`${API_URL}/audience/${audienceId}`);
		if (swCached) {
			console.log(
				'Using service worker cached audience schedule data for audience:',
				audienceId
			);
			return { ...swCached, isSWCache: true } as AudienceScheduleData;
		}

		const swFetchCached = await getFromServiceWorkerViaFetch(
			`${API_URL}/audience/${audienceId}`
		);
		if (swFetchCached) {
			console.log(
				'Using service worker fetch cached audience schedule data for audience:',
				audienceId
			);
			return { ...swFetchCached, isSWCache: true } as AudienceScheduleData;
		}

		console.error('No cached data available for audience schedule:', audienceId);
		throw error;
	}
}
