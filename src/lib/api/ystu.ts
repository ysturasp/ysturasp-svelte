export interface YSTUTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface YSTUUserInfo {
	auth_info: {
		auth: number;
		userId: number;
		user: {
			id: number;
			firstName: string;
			lastName: string;
			patronymic: string;
			fullName: string;
			initials: string;
			photoUrl: string;
			birthday: string;
			login: string;
			email: string;
			groupName: string;
		};
	};
}

export interface YSTUMark {
	inDiplom: number;
	markName: string | null;
	mark: number;
	semester: number;
	controlTypeName: string;
	years: string;
	course: number;
	lessonName: string;
	creditUnit: number;
	hasDebt: number;
}

export interface YSTUDetailedUserInfo {
	id: number;
	manId: number;
	man: {
		id: number;
		lastname: string;
		firstname: string;
		patronymic: string;
		gender: string;
		birthDate: string;
		email: string;
		telephone: string;
		login: string;
	};
	podrazdelenieId: number;
	napravlenijeId: number;
	facultyId: number;
	razdelId: number;
	kontingentId: number;
	groupId: number;
	recordBook: string;
	admissionYearId: number;
	admissionDate: string;
	educationFormId: number;
	course: number;
	isQuota: boolean;
	isContract: boolean;
	isBudget: boolean;
	sourceFinancingStr: string;
}

import { env } from '$env/dynamic/private';

const OAUTH_BASE = 'https://oauth.ystuty.ru';
const API_BASE = 'https://gg-api.ystuty.ru/s';

function getClientId(): string {
	const clientId = env.YSTU_OAUTH_CLIENT_ID;
	if (!clientId) {
		throw new Error('YSTU_OAUTH_CLIENT_ID не задан');
	}
	return clientId;
}

function getClientSecret(): string {
	const clientSecret = env.YSTU_OAUTH_CLIENT_SECRET;
	if (!clientSecret) {
		throw new Error('YSTU_OAUTH_CLIENT_SECRET не задан');
	}
	return clientSecret;
}

export async function login(
	username: string,
	password: string,
	clientId = 'x-id'
): Promise<YSTUTokens> {
	const url = new URL('/access_token', OAUTH_BASE);
	url.searchParams.set('client_id', clientId);
	url.searchParams.set('grant_type', 'password');
	url.searchParams.set('scope', 'general:user:personal,general:mark:personal');

	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ username, password })
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error_description || errorData.message || 'Ошибка входа в систему ЯГТУ'
		);
	}

	return response.json();
}

export async function refresh(refreshToken: string): Promise<YSTUTokens> {
	const clientId = getClientId();
	const clientSecret = getClientSecret();

	const url = new URL('/access_token', OAUTH_BASE);

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	});

	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	if (!response.ok) {
		throw new Error('Ошибка обновления токена ЯГТУ');
	}

	return response.json();
}

export async function check(accessToken: string): Promise<YSTUUserInfo> {
	const response = await fetch(`${OAUTH_BASE}/check`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Сессия ЯГТУ недействительна');
	}

	return response.json();
}

export async function getMarks(accessToken: string): Promise<YSTUMark[]> {
	const response = await fetch(`${API_BASE}/general/v1/mark/my`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: '*/*'
		}
	});

	if (!response.ok) {
		throw new Error('Ошибка при получении оценок ЯГТУ');
	}

	return response.json();
}

export async function logout(accessToken: string): Promise<{ logout: number }> {
	const response = await fetch(`${OAUTH_BASE}/logout`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!response.ok) {
		throw new Error('Ошибка выхода из системы ЯГТУ');
	}

	return response.json();
}

import { getActualGroupsKey } from '$lib/utils/redis-keys';

export async function getActualGroups(): Promise<{
	items: Array<{ name: string; groups: string[] }>;
}> {
	const cacheKey = getActualGroupsKey();
	try {
		const { getRedisClient } = await import('$lib/config/redis');
		const redis = getRedisClient();
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}

		const response = await fetch(`${API_BASE}/schedule/v1/schedule/actual_groups`);
		if (!response.ok) {
			throw new Error('Ошибка при получении списка групп');
		}
		const data = await response.json();

		await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
		return data;
	} catch (error) {
		console.error('Redis error or fetch error in getActualGroups:', error);
		const response = await fetch(`${API_BASE}/schedule/v1/schedule/actual_groups`);
		if (!response.ok) {
			throw new Error('Ошибка при получении списка групп');
		}
		return response.json();
	}
}

export async function getDetailedUserInfo(accessToken: string): Promise<YSTUDetailedUserInfo> {
	const response = await fetch(`${API_BASE}/general/v1/user/my`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: '*/*'
		}
	});

	if (!response.ok) {
		throw new Error('Ошибка при получении данных пользователя ЯГТУ');
	}

	return response.json();
}
