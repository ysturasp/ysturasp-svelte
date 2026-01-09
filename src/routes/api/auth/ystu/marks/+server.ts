import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { clearYstuSessionForUser, getValidYstuAccessTokenForUser } from '$lib/server/ystuSession';

export const GET: RequestHandler = async ({ cookies, getClientAddress, request }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ error: 'Необходимо авторизоваться в системе ЯГТУ' }, { status: 401 });
	}

	try {
		const currentAccessToken = await getValidYstuAccessTokenForUser(
			context.user.id,
			context.isTelegram
		);

		if (!currentAccessToken) {
			return json({ error: 'Необходимо авторизоваться в системе ЯГТУ' }, { status: 401 });
		}

		const marks = await ystu.getMarks(currentAccessToken);
		return json(marks);
	} catch (error: any) {
		console.error('[YSTU Marks Error]:', error);
		if (error.message.includes('недействительна') || error.message.includes('expired')) {
			await clearYstuSessionForUser(context.user.id, context.isTelegram);
		}
		return json({ error: error.message || 'Ошибка при получении оценок' }, { status: 500 });
	}
};
