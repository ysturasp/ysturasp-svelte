import type { YSTUTokens } from '$lib/api/ystu';
import * as ystu from '$lib/api/ystu';
import { getYstuTokensForUser, saveYstuTokens, clearYstuTokensForUser } from '$lib/db/ystuTokens';

export async function storeInitialYstuTokensForUser(
	userId: string,
	isTelegram: boolean,
	tokens: YSTUTokens
): Promise<void> {
	await saveYstuTokens(userId, isTelegram, tokens);
}

export async function getValidYstuAccessTokenForUser(
	userId: string,
	isTelegram: boolean
): Promise<string | null> {
	const record = await getYstuTokensForUser(userId, isTelegram);

	if (!record) {
		return null;
	}

	const now = new Date();
	const skewMs = 30 * 1000;

	if (record.accessExpiresAt.getTime() - skewMs > now.getTime()) {
		return record.accessToken;
	}

	if (!record.refreshToken) {
		return null;
	}

	const newTokens = await ystu.refresh(record.refreshToken);
	await saveYstuTokens(userId, isTelegram, newTokens);

	return newTokens.access_token;
}

export async function clearYstuSessionForUser(userId: string, isTelegram: boolean): Promise<void> {
	await clearYstuTokensForUser(userId, isTelegram);
}
