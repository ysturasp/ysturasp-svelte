import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import { getAcademicTokens, clearAcademicCookies } from '$lib/server/academicSession';

export const POST: RequestHandler = async ({ cookies }) => {
	const { accessToken } = getAcademicTokens(cookies);

	if (accessToken) {
		try {
			await ystu.logout(accessToken);
		} catch (error) {
			console.error('[YSTU Logout Proxy Error]:', error);
		}
	}

	clearAcademicCookies(cookies);

	return json({ success: true });
};
