import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import * as ystu from '$lib/api/ystu';
import { getSessionContext } from '$lib/server/sessionContext';
import { getRealIp } from '$lib/server/ip';
import { linkYstuAccount } from '$lib/db/users';
import { storeInitialYstuTokensForUser } from '$lib/server/ystuSession';

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const { username, password } = await request.json();

	if (!username || !password) {
		return json({ error: 'Логин и пароль обязательны' }, { status: 400 });
	}

	const ipAddress = getRealIp(request, getClientAddress);
	const context = await getSessionContext(cookies, { touch: false, ipAddress });

	if (!context) {
		return json({ error: 'Необходимо авторизоваться в основном профиле' }, { status: 401 });
	}

	try {
		const tokens = await ystu.login(username, password);

		const userInfo = await ystu.check(tokens.access_token);

		await linkYstuAccount(
			context.user.id,
			userInfo.auth_info.userId,
			userInfo.auth_info.user,
			context.isTelegram
		);

		await storeInitialYstuTokensForUser(context.user.id, context.isTelegram, tokens);

		return json({
			success: true,
			academicUser: userInfo.auth_info.user
		});
	} catch (error: any) {
		console.error('[YSTU Login Error]:', error);
		return json({ error: error.message || 'Ошибка входа в систему ЯГТУ' }, { status: 401 });
	}
};
