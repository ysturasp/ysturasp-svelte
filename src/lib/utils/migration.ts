import { browser } from '$app/environment';

const EXCLUDED_KEYS = ['migration_completed', 'cookieAccepted-1'];

export function collectAllUserData(): Record<string, string> {
	if (!browser) return {};

	const data: Record<string, string> = {};

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key && !EXCLUDED_KEYS.includes(key)) {
			const value = localStorage.getItem(key);
			if (value !== null) {
				data[key] = value;
			}
		}
	}

	return data;
}

export function restoreUserData(data: Record<string, string>): void {
	if (!browser) return;

	let restoredCount = 0;
	Object.entries(data).forEach(([key, value]) => {
		try {
			localStorage.setItem(key, value);
			restoredCount++;
		} catch (e) {
			console.error(`Ошибка при восстановлении ${key}:`, e);
		}
	});
	console.log(`Восстановлено ${restoredCount} записей из ${Object.keys(data).length}`);
}

async function compressData(data: string): Promise<string> {
	if (!browser || !('CompressionStream' in window)) {
		return btoa(encodeURIComponent(data));
	}

	try {
		const stream = new CompressionStream('gzip');
		const blob = new Blob([data]);
		const compressedStream = blob.stream().pipeThrough(stream);
		const compressedBlob = await new Response(compressedStream).blob();
		const arrayBuffer = await compressedBlob.arrayBuffer();
		const uint8Array = new Uint8Array(arrayBuffer);
		const binaryString = String.fromCharCode(...uint8Array);
		return btoa(binaryString);
	} catch (e) {
		console.warn('Сжатие не удалось, используем обычное кодирование:', e);
		return btoa(encodeURIComponent(data));
	}
}

async function decompressData(compressed: string): Promise<string> {
	if (!browser || !('DecompressionStream' in window)) {
		return decodeURIComponent(atob(compressed));
	}

	try {
		const binaryString = atob(compressed);
		const uint8Array = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			uint8Array[i] = binaryString.charCodeAt(i);
		}
		const stream = new DecompressionStream('gzip');
		const blob = new Blob([uint8Array]);
		const decompressedStream = blob.stream().pipeThrough(stream);
		const decompressedBlob = await new Response(decompressedStream).blob();
		return await decompressedBlob.text();
	} catch (e) {
		console.warn('Распаковка не удалась, используем обычное декодирование:', e);
		return decodeURIComponent(atob(compressed));
	}
}

export async function encodeMigrationData(data: Record<string, string>): Promise<string> {
	try {
		const json = JSON.stringify(data);
		const compressed = await compressData(json);
		return compressed;
	} catch (e) {
		console.error('Ошибка при кодировании данных:', e);
		return '';
	}
}

export async function decodeMigrationData(encoded: string): Promise<Record<string, string> | null> {
	try {
		const json = await decompressData(encoded);
		return JSON.parse(json);
	} catch (e) {
		console.error('Ошибка при декодировании данных:', e);
		return null;
	}
}

export function isNetlifyDomain(): boolean {
	if (!browser) return false;
	const hostname = window.location.hostname;
	const port = window.location.port;
	if (hostname.includes('ysturasp.netlify.app')) return true;
	// if (hostname === 'localhost' && port === '5173') return true;
	return false;
}

export function getNewDomainUrl(path: string, migrationData?: string): string {
	const newDomain = 'https://ysturasp.ru';
	// const newDomain = 'http://localhost:5174';
	const url = new URL(path, newDomain);
	if (migrationData) {
		url.hash = `#migration=${migrationData}`;
	}
	return url.toString();
}
