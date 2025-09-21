import { browser } from '$app/environment';

export interface OfflineData {
	data: any;
	timestamp: number;
	expiry?: number;
	version: string;
}

export interface OfflineStorageOptions {
	expiry?: number;
	version?: string;
	compress?: boolean;
}

const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'ysturasp_offline_';

export function storeOfflineData(
	key: string,
	data: any,
	options: OfflineStorageOptions = {}
): boolean {
	if (!browser) return false;

	try {
		const offlineData: OfflineData = {
			data,
			timestamp: Date.now(),
			expiry: options.expiry || DEFAULT_EXPIRY,
			version: options.version || '1.0'
		};

		let dataToStore = JSON.stringify(offlineData);

		if (options.compress && dataToStore.length > 1000) {
			dataToStore = compressString(dataToStore);
		}

		localStorage.setItem(STORAGE_PREFIX + key, dataToStore);
		return true;
	} catch (error) {
		console.error('Failed to store offline data:', error);
		return false;
	}
}

export function getOfflineData<T = any>(key: string): T | null {
	if (!browser) return null;

	try {
		const storedData = localStorage.getItem(STORAGE_PREFIX + key);
		if (!storedData) return null;

		let parsedData: OfflineData;

		try {
			parsedData = JSON.parse(storedData);
		} catch (parseError) {
			try {
				const decompressed = decompressString(storedData);
				parsedData = JSON.parse(decompressed);
			} catch (decompressError) {
				console.warn(`Corrupted data in localStorage for key: ${key}, removing...`);
				removeOfflineData(key);
				return null;
			}
		}

		if (!parsedData || typeof parsedData !== 'object') {
			console.warn(`Invalid data structure for key: ${key}, removing...`);
			removeOfflineData(key);
			return null;
		}

		if (parsedData.expiry && Date.now() - parsedData.timestamp > parsedData.expiry) {
			removeOfflineData(key);
			return null;
		}

		return parsedData.data as T;
	} catch (error) {
		console.warn(`Failed to retrieve offline data for key: ${key}:`, error);
		removeOfflineData(key);
		return null;
	}
}

export function hasOfflineData(key: string): boolean {
	return getOfflineData(key) !== null;
}

export function removeOfflineData(key: string): boolean {
	if (!browser) return false;

	try {
		localStorage.removeItem(STORAGE_PREFIX + key);
		return true;
	} catch (error) {
		console.error('Failed to remove offline data:', error);
		return false;
	}
}

export function clearAllOfflineData(): boolean {
	if (!browser) return false;

	try {
		const keys = Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX));

		keys.forEach((key) => localStorage.removeItem(key));
		return true;
	} catch (error) {
		console.error('Failed to clear offline data:', error);
		return false;
	}
}

export function getOfflineDataInfo(key: string): {
	exists: boolean;
	timestamp?: number;
	expiry?: number;
	version?: string;
	isExpired?: boolean;
	size?: number;
} {
	if (!browser) return { exists: false };

	try {
		const storedData = localStorage.getItem(STORAGE_PREFIX + key);
		if (!storedData) return { exists: false };

		let parsedData: OfflineData;
		try {
			parsedData = JSON.parse(storedData);
		} catch {
			const decompressed = decompressString(storedData);
			parsedData = JSON.parse(decompressed);
		}

		const isExpired = parsedData.expiry
			? Date.now() - parsedData.timestamp > parsedData.expiry
			: false;

		return {
			exists: true,
			timestamp: parsedData.timestamp,
			expiry: parsedData.expiry,
			version: parsedData.version,
			isExpired,
			size: new Blob([storedData]).size
		};
	} catch {
		return { exists: false };
	}
}

export function getAllOfflineDataKeys(): string[] {
	if (!browser) return [];

	return Object.keys(localStorage)
		.filter((key) => key.startsWith(STORAGE_PREFIX))
		.map((key) => key.replace(STORAGE_PREFIX, ''));
}

export function getOfflineStorageSize(): number {
	if (!browser) return 0;

	let totalSize = 0;

	Object.keys(localStorage)
		.filter((key) => key.startsWith(STORAGE_PREFIX))
		.forEach((key) => {
			const value = localStorage.getItem(key);
			if (value) {
				totalSize += new Blob([value]).size;
			}
		});

	return totalSize;
}

export function cleanupExpiredData(): number {
	if (!browser) return 0;

	let cleaned = 0;
	const keys = getAllOfflineDataKeys();

	keys.forEach((key) => {
		const info = getOfflineDataInfo(key);
		if (info.isExpired) {
			removeOfflineData(key);
			cleaned++;
		}
	});

	return cleaned;
}

export function cleanupCorruptedData(): number {
	if (!browser) return 0;

	let cleaned = 0;
	const keys = getAllOfflineDataKeys();

	keys.forEach((key) => {
		try {
			const data = getOfflineData(key);
			if (data === null) {
				cleaned++;
			}
		} catch (error) {
			console.warn(`Removing corrupted data for key: ${key}`);
			removeOfflineData(key);
			cleaned++;
		}
	});

	return cleaned;
}

function compressString(str: string): string {
	let compressed = '';
	let count = 1;
	let current = str[0];

	for (let i = 1; i < str.length; i++) {
		if (str[i] === current && count < 9) {
			count++;
		} else {
			compressed += count > 1 ? `${count}${current}` : current;
			current = str[i];
			count = 1;
		}
	}

	compressed += count > 1 ? `${count}${current}` : current;
	return 'COMPRESSED:' + compressed;
}

function decompressString(str: string): string {
	if (!str.startsWith('COMPRESSED:')) return str;

	const compressed = str.slice(11);
	let decompressed = '';

	for (let i = 0; i < compressed.length; i++) {
		const char = compressed[i];
		if (char >= '2' && char <= '9' && i + 1 < compressed.length) {
			const count = parseInt(char);
			const repeatedChar = compressed[i + 1];
			decompressed += repeatedChar.repeat(count);
			i++;
		} else {
			decompressed += char;
		}
	}

	return decompressed;
}

export function storeScheduleData(groupOrDirection: string, data: any): boolean {
	return storeOfflineData(`schedule_${groupOrDirection}`, data, {
		expiry: 7 * 24 * 60 * 60 * 1000,
		version: '1.0',
		compress: true
	});
}

export function getCachedScheduleData<T = any>(groupOrDirection: string): T | null {
	try {
		return getOfflineData<T>(`schedule_${groupOrDirection}`);
	} catch (error) {
		console.warn(`Failed to get cached schedule data for ${groupOrDirection}:`, error);
		return null;
	}
}

export function storeInstitutesData(data: any): boolean {
	return storeOfflineData('institutes', data, {
		expiry: 24 * 60 * 60 * 1000,
		version: '1.0'
	});
}

export function getCachedInstitutesData<T = any>(): T | null {
	try {
		return getOfflineData<T>('institutes');
	} catch (error) {
		console.warn('Failed to get cached institutes data:', error);
		return null;
	}
}

export function storeTeachersData(data: any): boolean {
	return storeOfflineData('teachers', data, {
		expiry: 24 * 60 * 60 * 1000,
		version: '1.0'
	});
}

export function getCachedTeachersData<T = any>(): T | null {
	return getOfflineData<T>('teachers');
}

export function storeAudiencesData(data: any): boolean {
	return storeOfflineData('audiences', data, {
		expiry: 24 * 60 * 60 * 1000,
		version: '1.0'
	});
}

export function getCachedAudiencesData<T = any>(): T | null {
	return getOfflineData<T>('audiences');
}
