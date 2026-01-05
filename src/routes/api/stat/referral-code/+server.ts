import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { ensureReferralCode } from '$lib/db/users';

export const GET: RequestHandler = async (event) => {
	const sessionContext = await getSessionContext(event.cookies, { touch: false });
	if (!sessionContext) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	const { user, isTelegram } = sessionContext;

	if (isTelegram) {
		const { getPool } = await import('$lib/db/database');
		const pool = getPool(true);
		if (pool) {
			const result = await pool.query('SELECT "chatId" FROM users WHERE id = $1', [user.id]);
			const chatId = result.rows[0]?.chatId;
			if (chatId) {
				return json({
					referralCode: chatId,
					userId: user.id
				});
			}
		}
		return json({
			referralCode: user.id,
			userId: user.id
		});
	}

	const referralCode = await ensureReferralCode(user.id, isTelegram);

	return json({
		referralCode,
		userId: user.id
	});
};
