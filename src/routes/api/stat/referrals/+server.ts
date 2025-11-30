import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import {
	getReferralCount,
	getStatLimit,
	createReferral,
	getReferralByReferredId
} from '$lib/db/referrals';

export const GET: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = sessionContext;
	const referralCount = await getReferralCount(user.id);
	const { monthlyLimit, referralBonus } = await getStatLimit(user.id);

	return json({
		referralCount,
		monthlyLimit,
		referralBonus
	});
};

export const POST: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = sessionContext;
	const data = await event.request.json();
	const { referredUserId } = data;

	if (!referredUserId) {
		return json({ error: 'Не указан ID приглашенного пользователя' }, { status: 400 });
	}

	if (user.id === referredUserId) {
		return json({ error: 'Нельзя пригласить самого себя' }, { status: 400 });
	}

	const existingReferral = await getReferralByReferredId(referredUserId);
	if (existingReferral) {
		return json({ error: 'Пользователь уже был приглашен' }, { status: 400 });
	}

	const referral = await createReferral(user.id, referredUserId);
	if (!referral) {
		return json({ error: 'Не удалось создать реферал' }, { status: 400 });
	}

	const referralCount = await getReferralCount(user.id);
	const { monthlyLimit } = await getStatLimit(user.id);

	return json({
		success: true,
		referralCount,
		monthlyLimit
	});
};
