import { env } from '$env/dynamic/private';
import { createHmac } from 'crypto';

export interface TelegramUserInfo {
	id: string;
	first_name: string;
	last_name?: string;
	username?: string;
	photo_url?: string;
	language_code?: string;
}

interface ParsedInitData {
	user?: string;
	auth_date?: string;
	hash?: string;
	[key: string]: string | undefined;
}

function parseInitData(initData: string): ParsedInitData {
	const params = new URLSearchParams(initData);
	const result: ParsedInitData = {};

	for (const [key, value] of params.entries()) {
		result[key] = value;
	}

	return result;
}

function verifyInitData(initData: string): boolean {
	const botToken = env.TELEGRAM_BOT_TOKEN;
	if (!botToken) {
		console.error('TELEGRAM_BOT_TOKEN не задан');
		return false;
	}

	const params = parseInitData(initData);
	const hash = params.hash;
	if (!hash) {
		return false;
	}

	delete params.hash;

	const dataCheckString = Object.keys(params)
		.sort()
		.map((key) => `${key}=${params[key]}`)
		.join('\n');

	const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();

	const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

	if (calculatedHash.length !== hash.length) {
		return false;
	}

	let result = 0;
	for (let i = 0; i < calculatedHash.length; i++) {
		result |= calculatedHash.charCodeAt(i) ^ hash.charCodeAt(i);
	}

	return result === 0;
}

export function extractTelegramUser(initData: string): TelegramUserInfo | null {
	if (!verifyInitData(initData)) {
		console.error('Неверная подпись initData');
		return null;
	}

	const params = parseInitData(initData);
	const userParam = params.user;

	if (!userParam) {
		return null;
	}

	try {
		const user = JSON.parse(decodeURIComponent(userParam));
		return {
			id: String(user.id),
			first_name: user.first_name || '',
			last_name: user.last_name,
			username: user.username,
			photo_url: user.photo_url,
			language_code: user.language_code
		};
	} catch (error) {
		console.error('Ошибка парсинга user из initData:', error);
		return null;
	}
}

export function isInitDataValid(initData: string): boolean {
	if (!verifyInitData(initData)) {
		return false;
	}

	const params = parseInitData(initData);
	const authDate = params.auth_date;

	if (!authDate) {
		return false;
	}

	const authTimestamp = parseInt(authDate, 10);
	if (isNaN(authTimestamp)) {
		return false;
	}

	const now = Math.floor(Date.now() / 1000);
	const maxAge = 24 * 60 * 60;

	return now - authTimestamp < maxAge;
}
