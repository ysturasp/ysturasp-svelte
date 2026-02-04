import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSessionContext } from '$lib/server/sessionContext';
import { getPromoCodeByCode, applyPromoCode } from '$lib/db/promo-codes';
import { trackEventAuto } from '$lib/server/analyticsContext';

export const POST: RequestHandler = async (event) => {
	const { cookies, request } = event;
	const context = await getSessionContext(cookies);
	if (!context) {
		return json({ error: 'Не авторизован' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { code } = body;

		if (!code || typeof code !== 'string' || code.trim().length === 0) {
			return json({ error: 'Промокод обязателен' }, { status: 400 });
		}

		const promoCode = await getPromoCodeByCode(code.trim());
		if (!promoCode) {
			return json({ error: 'Промокод не найден' }, { status: 404 });
		}

		const result = await applyPromoCode(context.user.id, promoCode.id, context.isTelegram);
		if (!result.success) {
			return json(
				{ error: result.error || 'Ошибка при применении промокода' },
				{ status: 400 }
			);
		}

		trackEventAuto(event, context.user.id, 'promo:apply', {
			code: code.trim(),
			formatsAdded: result.formatsAdded
		}).catch((err) => console.warn('[Analytics] Track failed:', err));

		return json({
			success: true,
			formatsAdded: result.formatsAdded
		});
	} catch (error) {
		console.error('Ошибка при применении промокода:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Неизвестная ошибка' },
			{ status: 500 }
		);
	}
};
