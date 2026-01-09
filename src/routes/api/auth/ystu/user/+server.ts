import { json, type RequestHandler } from '@sveltejs/kit';
import { getDetailedUserInfo } from '$lib/api/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { getValidYstuAccessTokenForUser } from '$lib/server/ystuSession';

export const GET: RequestHandler = async ({ cookies, getClientAddress, request }) => {
	try {
		const ipAddress = getRealIp(request, getClientAddress);
		const context = await getSessionContext(cookies, { touch: false, ipAddress });

		if (!context) {
			return json({ error: 'Сессия ЯГТУ не найдена' }, { status: 401 });
		}

		const accessToken = await getValidYstuAccessTokenForUser(
			context.user.id,
			context.isTelegram
		);
		if (!accessToken) {
			return json({ error: 'Сессия ЯГТУ не найдена' }, { status: 401 });
		}

		const userData = await getDetailedUserInfo(accessToken);
		return json(userData);
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
