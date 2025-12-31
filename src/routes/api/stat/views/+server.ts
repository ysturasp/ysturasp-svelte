import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { createStatView, getMonthlyViewCount } from '$lib/db/statViews';
import { getStatLimit } from '$lib/db/referrals';

export const POST: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user, isTelegram } = sessionContext;
	const data = await event.request.json();
	const { discipline, institute } = data;

	if (!discipline || !institute) {
		return json({ error: 'Не указаны дисциплина или институт' }, { status: 400 });
	}

	const { monthlyLimit } = await getStatLimit(user.id, isTelegram);
	const viewCount = await getMonthlyViewCount(user.id, isTelegram);

	if (viewCount >= monthlyLimit) {
		return json({
			success: false,
			error: 'Достигнут месячный лимит просмотров',
			remaining: 0,
			monthlyLimit
		});
	}

	await createStatView(user.id, discipline, institute, isTelegram);
	const newViewCount = await getMonthlyViewCount(user.id, isTelegram);

	return json({
		success: true,
		remaining: monthlyLimit - newViewCount,
		monthlyLimit
	});
};

export const GET: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user, isTelegram } = sessionContext;
	const { monthlyLimit } = await getStatLimit(user.id, isTelegram);
	const viewCount = await getMonthlyViewCount(user.id, isTelegram);
	const remaining = Math.max(0, monthlyLimit - viewCount);

	return json({
		remaining,
		monthlyLimit,
		used: viewCount
	});
};
