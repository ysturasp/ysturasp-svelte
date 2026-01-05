import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import {
	getAcademicTokens,
	setAcademicCookies,
	clearAcademicCookies
} from '$lib/server/academicSession';

export const GET: RequestHandler = async ({ cookies }) => {
	const { accessToken, refreshToken } = getAcademicTokens(cookies);

	if (!accessToken && !refreshToken) {
		return json({ error: 'Необходимо авторизоваться в системе ЯГТУ' }, { status: 401 });
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

		const marks = await ystu.getMarks(currentAccessToken);
		return json(marks);
	} catch (error: any) {
		console.error('[YSTU Marks Error]:', error);
		if (error.message.includes('недействительна') || error.message.includes('expired')) {
			clearAcademicCookies(cookies);
		}
		return json({ error: error.message || 'Ошибка при получении оценок' }, { status: 500 });
	}
};
