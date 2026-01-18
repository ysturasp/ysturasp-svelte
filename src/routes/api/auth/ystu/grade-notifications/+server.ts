import { json, type RequestHandler } from '@sveltejs/kit';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { setGradeNotificationsEnabled, getGradeNotificationsEnabled } from '$lib/db/ystuTokens';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ error: 'Необходимо авторизоваться' }, { status: 401 });
	}

	try {
		const { enabled } = await request.json();

		if (typeof enabled !== 'boolean') {
			return json({ error: 'Параметр enabled должен быть boolean' }, { status: 400 });
		}

		await setGradeNotificationsEnabled(context.user.id, enabled, context.isTelegram);

		return json({ success: true, enabled });
	} catch (error: any) {
		console.error('[Grade Notifications Toggle Error]:', error);
		return json({ error: error.message || 'Ошибка при изменении настройки' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ cookies, getClientAddress, request }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ error: 'Необходимо авторизоваться' }, { status: 401 });
	}

	try {
		const enabled = await getGradeNotificationsEnabled(context.user.id, context.isTelegram);
		return json({ enabled });
	} catch (error: any) {
		console.error('[Grade Notifications Get Error]:', error);
		return json({ error: error.message || 'Ошибка при получении настройки' }, { status: 500 });
	}
};
