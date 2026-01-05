import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import {
	getAcademicTokens,
	setAcademicCookies,
	clearAcademicCookies
} from '$lib/server/academicSession';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';

export const GET: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
	}

	const { accessToken, refreshToken } = getAcademicTokens(cookies);

	if (!accessToken && !refreshToken) {
		return json({ authenticated: false });
	}

	try {
		let currentAccessToken = accessToken;

		if (!currentAccessToken && refreshToken) {
			const newTokens = await ystu.refresh(refreshToken);
			setAcademicCookies(cookies, newTokens);
			currentAccessToken = newTokens.access_token;
		}

		if (!currentAccessToken) {
			throw new Error('No access token');
		}

		const userInfo = await ystu.check(currentAccessToken);
		return json({
			authenticated: true,
			academicUser: userInfo.auth_info.user
		});
	} catch (error: any) {
		console.error('[YSTU Check Error]:', error);
		clearAcademicCookies(cookies);
		return json({ authenticated: false, error: 'Session expired' });
	}
};
