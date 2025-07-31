import type { ChangelogItem } from '$lib/types';

const EMOJI_MAP: Record<string, string> = {
	add: '✨',
	new: '✨',
	create: '✨',
	implement: '✨',
	fix: '🐛',
	bug: '🐛',
	error: '🐛',
	issue: '🐛',
	improve: '⚡️',
	enhance: '⚡️',
	optimize: '⚡️',
	update: '⚡️',
	refactor: '🔨',
	clean: '🔨',
	restructure: '🔨',
	security: '🔒',
	secure: '🔒',
	doc: '📝',
	document: '📝',
	readme: '📝',
	test: '🧪',
	testing: '🧪',
	ui: '🎨',
	ux: '🎨',
	design: '🎨',
	style: '🎨',
	performance: '🚀',
	speed: '🚀',
	dependency: '📦',
	package: '📦',
	config: '⚙️',
	settings: '⚙️',
	api: '🔌',
	endpoint: '🔌',
	database: '🗄️',
	db: '🗄️',
	mobile: '📱',
	app: '📱',
	analytics: '📊',
	statistics: '📊',
	stat: '📊',
	notification: '🔔',
	alert: '🔔',
	default: '📌'
};

export function getEmojiForChange(description: string): string {
	const lowerDesc = description.toLowerCase();

	for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
		if (lowerDesc.includes(keyword)) {
			return emoji;
		}
	}

	return EMOJI_MAP.default;
}

export function getFilesWord(count: number): string {
	count = Math.abs(parseInt(count.toString()));
	if (count % 10 === 1 && count % 100 !== 11) {
		return 'файл';
	} else if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
		return 'файла';
	} else {
		return 'файлов';
	}
}

export function parseChangelogLine(line: string): ChangelogItem | null {
	const match = line.match(
		/^- (.*?) \((.*?), (.*?)\)(?: \[(\d+) files? changed, (\d+) insertions?\(\+\), (\d+) deletions?\(\-\)\])?$/
	);

	if (!match) return null;

	const [, description, author, date, filesChanged, insertions, deletions] = match;

	return {
		description,
		author,
		date,
		filesChanged: filesChanged ? parseInt(filesChanged) : undefined,
		insertions: insertions ? parseInt(insertions) : undefined,
		deletions: deletions ? parseInt(deletions) : undefined,
		emoji: getEmojiForChange(description)
	};
}

export async function loadChangelog(): Promise<ChangelogItem[]> {
	try {
		const response = await fetch('/CHANGELOG.md');
		if (!response.ok) {
			throw new Error(`Failed to fetch changelog: ${response.status}`);
		}

		const text = await response.text();
		const lines = text.split('\n').filter((line) => line.trim());

		const items: ChangelogItem[] = [];
		for (const line of lines) {
			const item = parseChangelogLine(line);
			if (item) {
				items.push(item);
			}
		}

		return items;
	} catch (error) {
		console.error('Error loading changelog:', error);
		throw error;
	}
}

export async function translateTexts(texts: string[]): Promise<string[]> {
	try {
		const combinedText = texts.join(' ||| ');
		const response = await fetch(
			`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(combinedText)}`
		);

		if (!response.ok) {
			throw new Error(`Translation API error: ${response.status}`);
		}

		const data = await response.json();

		if (!data || !data[0]) {
			throw new Error('Invalid translation response');
		}

		return data[0]
			.map((item: any) => item[0])
			.join('')
			.split(' ||| ');
	} catch (error) {
		console.error('Ошибка при переводе:', error);
		return texts;
	}
}
