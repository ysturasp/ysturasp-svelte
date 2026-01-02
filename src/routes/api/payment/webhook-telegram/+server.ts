import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPaymentByTelegramId, updatePaymentStatus, createPayment } from '$lib/db/payments';
import { addPaidFormats } from '$lib/db/limits';
import { getUserById } from '$lib/db/users';
import { getSessionContext } from '$lib/server/sessionContext';
import { getPriceWithPromotion } from '$lib/utils/promotions';

function calculateBasePrice(count: number): number {
	if (count >= 50) return 3000;
	if (count >= 20) return 1500;
	if (count >= 10) return 850;
	if (count >= 5) return 500;
	return count * 125;
}

function calculatePrice(count: number): number {
	const basePrice = calculateBasePrice(count);
	const { finalPrice } = getPriceWithPromotion(basePrice);
	return finalPrice;
}

async function handleClientWebhook(body: any, cookies: any) {
	const paymentId = body.paymentId;
	let userId = body.userId;
	let formatsCount = body.formatsCount;

	if (!paymentId) {
		throw new Error('ID платежа не найден');
	}

	let payment = await getPaymentByTelegramId(paymentId, true);

	if (!payment) {
		if (!userId || !formatsCount) {
			const context = await getSessionContext(cookies, {});
			if (context) {
				userId = userId || context.user.id;
			}
			if (!userId || !formatsCount) {
				throw new Error('Недостаточно данных для создания платежа');
			}
		}

		const rubAmount = calculatePrice(formatsCount);

		payment = await createPayment(
			userId!,
			paymentId,
			rubAmount,
			formatsCount!,
			'telegram_stars',
			'succeeded',
			true
		);
	} else {
		const updatedPayment = await updatePaymentStatus(
			paymentId,
			'succeeded',
			'telegram_stars',
			true
		);
		payment = updatedPayment || payment;
	}

	if (payment && payment.status === 'succeeded') {
		let isTelegram = false;
		const userInMainDb = await getUserById(payment.user_id, false);
		if (!userInMainDb) {
			const userInBotDb = await getUserById(payment.user_id, true);
			if (userInBotDb) {
				isTelegram = true;
			}
		}
		await addPaidFormats(payment.user_id, payment.formats_count, isTelegram);
	}

	return payment;
}

async function handleTelegramBotUpdate(update: any) {
	if (!update.message || !update.message.successful_payment) {
		return null;
	}

	const successfulPayment = update.message.successful_payment;
	const invoicePayload = successfulPayment.invoice_payload;

	if (!invoicePayload) {
		console.warn('Telegram Bot API update: invoice_payload отсутствует');
		return null;
	}

	let payloadData: { paymentId: string; userId: string; formatsCount: number };
	try {
		payloadData = JSON.parse(invoicePayload);
	} catch (error) {
		console.error('Ошибка парсинга invoice_payload:', error);
		return null;
	}

	const { paymentId, userId, formatsCount } = payloadData;

	if (!paymentId || !userId || !formatsCount) {
		console.warn('Telegram Bot API update: недостаточно данных в payload', payloadData);
		return null;
	}

	let payment = await getPaymentByTelegramId(paymentId, true);

	if (!payment) {
		const rubAmount = calculatePrice(formatsCount);
		payment = await createPayment(
			userId,
			paymentId,
			rubAmount,
			formatsCount,
			'telegram_stars',
			'succeeded',
			true
		);
	} else {
		const updatedPayment = await updatePaymentStatus(
			paymentId,
			'succeeded',
			'telegram_stars',
			true
		);
		payment = updatedPayment || payment;
	}

	if (payment && payment.status === 'succeeded') {
		let isTelegram = false;
		const userInMainDb = await getUserById(payment.user_id, false);
		if (!userInMainDb) {
			const userInBotDb = await getUserById(payment.user_id, true);
			if (userInBotDb) {
				isTelegram = true;
			}
		}
		await addPaidFormats(payment.user_id, payment.formats_count, isTelegram);
	}

	return payment;
}

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const body = await request.json();

		if (body.update_id !== undefined || body.message?.successful_payment) {
			const payment = await handleTelegramBotUpdate(body);
			if (payment) {
				return json({ success: true, ok: true });
			}
			return json({ success: true, ok: true });
		} else {
			await handleClientWebhook(body, cookies);
			return json({ success: true });
		}
	} catch (error) {
		console.error('Ошибка обработки платежа Telegram Stars:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Ошибка обработки платежа' },
			{ status: 500 }
		);
	}
};
