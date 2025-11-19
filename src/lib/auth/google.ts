import { env } from '$env/dynamic/private';

export interface GoogleUserInfo {
	id: string;
	email: string;
	name?: string;
	picture?: string;
}

export async function verifyGoogleToken(token: string): Promise<GoogleUserInfo | null> {
	try {
		const response = await fetch(
			`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${token}`
		);

		if (!response.ok) {
			return null;
		}

		const data = await response.json();

		return {
			id: data.id,
			email: data.email,
			name: data.name,
			picture: data.picture
		};
	} catch (error) {
		console.error('Ошибка верификации Google token:', error);
		return null;
	}
}

export function getGoogleOAuthUrl(redirectUri: string): string {
	const clientId = env.GOOGLE_CLIENT_ID;
	if (!clientId) {
		throw new Error('GOOGLE_CLIENT_ID не задан');
	}

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: redirectUri,
		response_type: 'code',
		scope: 'openid email profile',
		access_type: 'offline',
		prompt: 'consent'
	});

	return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGoogleCode(
	code: string,
	redirectUri: string
): Promise<string | null> {
	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('GOOGLE_CLIENT_ID или GOOGLE_CLIENT_SECRET не заданы');
	}

	try {
		const response = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				code,
				client_id: clientId,
				client_secret: clientSecret,
				redirect_uri: redirectUri,
				grant_type: 'authorization_code'
			})
		});

		if (!response.ok) {
			return null;
		}

		const data = await response.json();
		return data.access_token || null;
	} catch (error) {
		console.error('Ошибка обмена кода на токен:', error);
		return null;
	}
}
