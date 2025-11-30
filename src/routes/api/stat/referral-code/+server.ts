import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { ensureReferralCode } from '$lib/db/users';

export const GET: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user } = sessionContext;
	const referralCode = await ensureReferralCode(user.id);

	return json({ referralCode });
};
