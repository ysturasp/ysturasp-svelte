import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { clearYstuSessionForUser, getValidYstuAccessTokenForUser } from '$lib/server/ystuSession';

export const POST: RequestHandler = async ({ cookies, getClientAddress, request }) => {
	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ success: true });
	}

	try {
		const accessToken = await getValidYstuAccessTokenForUser(
			context.user.id,
			context.isTelegram
		);

		if (accessToken) {
			try {
				await ystu.logout(accessToken);
			} catch (error) {
				console.error('[YSTU Logout Proxy Error]:', error);
			}
		}
	} finally {
		await clearYstuSessionForUser(context.user.id, context.isTelegram);
	}

	return json({ success: true });
};
