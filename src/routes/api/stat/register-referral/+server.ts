import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { createReferralByCode, getReferralByReferredId } from '$lib/db/referrals';

export const POST: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = sessionContext;
	const url = new URL(event.request.url);
	const referralCode = url.searchParams.get('ref');

	if (!referralCode) {
		return json({ success: false, error: 'Не указан реферальный код' });
	}

	const existingReferral = await getReferralByReferredId(user.id);
	if (existingReferral) {
		return json({ success: false, error: 'Вы уже были приглашены другим пользователем' });
	}

	const referral = await createReferralByCode(referralCode, user.id);
	if (!referral) {
		return json({
			success: false,
			error: 'Неверный реферальный код или нельзя пригласить самого себя'
		});
	}

	return json({ success: true });
};
