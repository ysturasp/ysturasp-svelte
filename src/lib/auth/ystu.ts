import { env } from '$env/dynamic/private';
import { createHmac } from 'crypto';

const OAUTH_BASE = 'https://oauth.ystuty.ru';

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

function getRedirectUri(): string {
	const redirectUri = env.YSTU_OAUTH_REDIRECT_URI;
	if (!redirectUri) {
		throw new Error('YSTU_OAUTH_REDIRECT_URI не задан');
	}
	return redirectUri;
}

export interface OAuthTokens {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
}

export interface OAuthUserInfo {
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
			email?: string;
			groupName?: string;
		};
	};
}

export function getOAuthAuthorizeUrl(state: string): string {
	const params = new URLSearchParams({
		client_id: getClientId(),
		response_type: 'code',
		redirect_uri: getRedirectUri(),
		state
	});

	return `${OAUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
	const clientId = getClientId();
	const clientSecret = getClientSecret();
	const redirectUri = getRedirectUri();

	const url = new URL('/access_token', OAUTH_BASE);

	const body = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		grant_type: 'authorization_code',
		code,
		redirect_uri: redirectUri
	});

	const response = await fetch(url.toString(), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(
			errorData.error_description || errorData.message || 'Ошибка обмена кода на токены'
		);
	}

	return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
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

export async function getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
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

export function verifyRequestSignature(data: {
	sign_keys?: string;
	sign?: string;
	[key: string]: any;
}): boolean {
	const signKeys = data.sign_keys?.split(',');
	if (!signKeys || !data.sign) {
		return false;
	}

	const ordered: Record<string, any> = {};
	for (const key of signKeys) {
		ordered[key] = data[key];
	}

	const stringParams = Object.entries(ordered)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
		.join('&');
	const paramsHash = createHmac('sha256', getClientSecret())
		.update(stringParams)
		.digest()
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=$/, '');

	return paramsHash === data.sign;
}
