import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import {
	exchangeCodeForTokens,
	getUserInfo,
	verifyRequestSignature,
	type OAuthUserInfo
} from '$lib/auth/ystu';
import { linkYstuAccount } from '$lib/db/users';
import { storeInitialYstuTokensForUser } from '$lib/server/ystuSession';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const sign = url.searchParams.get('sign');
	const sign_keys = url.searchParams.get('sign_keys');

	if (!code) {
		return new Response('Отсутствует параметр code', { status: 400 });
	}

	const savedState = cookies.get('ystu_oauth_state');
	if (!savedState || savedState !== state) {
		return new Response('Неверный state параметр', { status: 400 });
	}

	if (sign && sign_keys) {
		const queryData: Record<string, string> = {};
		url.searchParams.forEach((value, key) => {
			queryData[key] = value;
		});

		if (!verifyRequestSignature({ ...queryData, sign, sign_keys })) {
			return new Response('Неверная подпись запроса', { status: 400 });
		}
	}

	const userId = cookies.get('ystu_oauth_user_id');
	const isTelegramStr = cookies.get('ystu_oauth_is_telegram');
	const isTelegram = isTelegramStr === 'true';

	if (!userId) {
		return new Response('Сессия истекла. Пожалуйста, попробуйте снова.', { status: 400 });
	}

	try {
		const tokens = await exchangeCodeForTokens(code);

		const userInfo = await getUserInfo(tokens.access_token);

		await linkYstuAccount(
			userId,
			userInfo.auth_info.userId,
			userInfo.auth_info.user,
			isTelegram
		);

		await storeInitialYstuTokensForUser(userId, isTelegram, tokens);

		cookies.delete('ystu_oauth_state', { path: '/' });
		cookies.delete('ystu_oauth_user_id', { path: '/' });
		cookies.delete('ystu_oauth_is_telegram', { path: '/' });

		throw redirect(302, '/profile?ystu_linked=true');
	} catch (error: any) {
		console.error('[YSTU OAuth Callback Error]:', error);

		cookies.delete('ystu_oauth_state', { path: '/' });
		cookies.delete('ystu_oauth_user_id', { path: '/' });
		cookies.delete('ystu_oauth_is_telegram', { path: '/' });

		return new Response(`Ошибка авторизации: ${error.message || 'Неизвестная ошибка'}`, {
			status: 500
		});
	}
};
