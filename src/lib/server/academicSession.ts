import type { Cookies } from '@sveltejs/kit';
import type { YSTUTokens } from '$lib/api/ystu';

export const COOKIE_NAMES = {
	ACCESS_TOKEN: 'ystu_at',
	REFRESH_TOKEN: 'ystu_rt'
};

export const SESSION_TTL = {
	ACCESS: 15551999,
	REFRESH: 23327999
};

export function setAcademicCookies(cookies: Cookies, tokens: YSTUTokens) {
	const secure = process.env.NODE_ENV === 'production';

	cookies.set(COOKIE_NAMES.ACCESS_TOKEN, tokens.access_token, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		maxAge: tokens.expires_in || SESSION_TTL.ACCESS
	});

	if (tokens.refresh_token) {
		cookies.set(COOKIE_NAMES.REFRESH_TOKEN, tokens.refresh_token, {
			path: '/',
			httpOnly: true,
			secure,
			sameSite: 'lax',
			maxAge: SESSION_TTL.REFRESH
		});
	}
}

export function clearAcademicCookies(cookies: Cookies) {
	cookies.delete(COOKIE_NAMES.ACCESS_TOKEN, { path: '/' });
	cookies.delete(COOKIE_NAMES.REFRESH_TOKEN, { path: '/' });
}

export function getAcademicTokens(cookies: Cookies) {
	const accessToken = cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
	const refreshToken = cookies.get(COOKIE_NAMES.REFRESH_TOKEN);

	return { accessToken, refreshToken };
}
