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
	const sign = url.searchParams.get('sign');
	const sign_keys = url.searchParams.get('sign_keys');

	if (!code) {
		return new Response('Отсутствует параметр code', { status: 400 });
	}

	if (!sign || !sign_keys) {
		return new Response('Отсутствует подпись запроса', { status: 400 });
	}

	const queryData: Record<string, string> = {};
	url.searchParams.forEach((value, key) => {
		queryData[key] = value;
	});

	if (!verifyRequestSignature({ ...queryData, sign, sign_keys })) {
		return new Response('Неверная подпись запроса', { status: 400 });
	}

	const userId = cookies.get('ystu_oauth_user_id');
	const isTelegramStr = cookies.get('ystu_oauth_is_telegram');
	const isTelegram = isTelegramStr === 'true';
	const returnUrlCookie = cookies.get('ystu_oauth_return');

	if (!userId) {
		return new Response('Сессия истекла. Пожалуйста, попробуйте снова.', { status: 400 });
	}

	try {
		const tokens = await exchangeCodeForTokens(code);

		console.log('[OAuth Callback] Tokens received:', {
			accessTokenLength: tokens.access_token?.length,
			refreshTokenLength: tokens.refresh_token?.length,
			expiresIn: tokens.expires_in,
			tokenType: tokens.token_type,
			accessTokenPreview: tokens.access_token
				? `${tokens.access_token.substring(0, 20)}...${tokens.access_token.substring(tokens.access_token.length - 10)}`
				: 'null'
		});

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
		cookies.delete('ystu_oauth_return', { path: '/' });

		const targetPath =
			returnUrlCookie && (returnUrlCookie === '/me' || returnUrlCookie === '/profile')
				? returnUrlCookie
				: '/me';

		const separator = targetPath.includes('?') ? '&' : '?';
		const redirectUrl = `${targetPath}${separator}ystu_linked=true`;

		throw redirect(302, redirectUrl);
	} catch (error: any) {
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error;
		}

		console.error('[YSTU OAuth Callback Error]:', error);

		cookies.delete('ystu_oauth_state', { path: '/' });
		cookies.delete('ystu_oauth_user_id', { path: '/' });
		cookies.delete('ystu_oauth_is_telegram', { path: '/' });

		return new Response(`Ошибка авторизации: ${error.message || 'Неизвестная ошибка'}`, {
			status: 500
		});
	}
};
