import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { clearYstuSessionForUser, getValidYstuAccessTokenForUser } from '$lib/server/ystuSession';

export const GET: RequestHandler = async ({ cookies, request, getClientAddress }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ authenticated: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const currentAccessToken = await getValidYstuAccessTokenForUser(
			context.user.id,
			context.isTelegram
		);

		if (!currentAccessToken) {
			return json({ authenticated: false });
		}

		const userInfo = await ystu.check(currentAccessToken);
		return json({
			authenticated: true,
			academicUser: userInfo.auth_info.user
		});
	} catch (error: any) {
		console.error('[YSTU Check Error]:', error);
		await clearYstuSessionForUser(context.user.id, context.isTelegram);
		return json({ authenticated: false, error: 'Session expired' });
	}
};
