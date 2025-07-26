export function downloadCache() {
	const cache: Record<string, string> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key) {
			cache[key] = localStorage.getItem(key) || '';
		}
	}

	const jsonStr = JSON.stringify(cache, null, 2);
	const blob = new Blob([jsonStr], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.style.display = 'none';
	a.href = url;
	a.download = 'cache.json';
	document.body.appendChild(a);
	a.click();
	window.URL.revokeObjectURL(url);
	return true;
}

export function importCache(file: File): Promise<boolean> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = function (e) {
			try {
				const cache = JSON.parse(e.target?.result as string);
				for (const key in cache) {
					localStorage.setItem(key, cache[key]);
				}
				resolve(true);
			} catch (error) {
				reject(error);
			}
		};
		reader.onerror = () => reject(new Error('Failed to read file'));
		reader.readAsText(file);
	});
}

export interface CacheItem {
	key: string;
	displayText: string;
	checked: boolean;
}

export function getCacheItems(): CacheItem[] {
	const items: CacheItem[] = [];
	const keys = Object.keys(localStorage);

	for (const key of keys) {
		if (key.includes('ym')) continue;

		let displayText = '';
		try {
			const value = JSON.parse(localStorage.getItem(key) || '');
			if (value && value.average !== undefined) {
				displayText = `${key}: Средний балл ${value.average.toFixed(2)}`;
			} else {
				displayText = `${key}: ${value}`;
			}
		} catch {
			displayText = `${key}: ${localStorage.getItem(key)}`;
		}

		items.push({
			key,
			displayText,
			checked: false
		});
	}

	return items;
}

export function clearSelectedCache(items: CacheItem[]): void {
	items.forEach((item) => {
		if (item.checked) {
			localStorage.removeItem(item.key);
		}
	});
}
