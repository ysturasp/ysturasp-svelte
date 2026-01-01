import { env } from '$env/dynamic/private';

export { convertRubToStars, convertStarsToRub } from '$lib/utils/telegram-stars';

export interface CreateTelegramInvoiceParams {
	title: string;
	description: string;
	payload: string;
	currency: string;
	prices: Array<{ label: string; amount: number }>;
}

export async function createTelegramInvoice(params: CreateTelegramInvoiceParams): Promise<string> {
	const botToken = env.TELEGRAM_BOT_TOKEN;
	if (!botToken) {
		throw new Error('TELEGRAM_BOT_TOKEN не задан');
	}

	const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			title: params.title,
			description: params.description,
			payload: params.payload,
			currency: params.currency,
			prices: params.prices
		})
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ description: 'Unknown error' }));
		throw new Error(
			`Telegram API error: ${error.description || error.message || 'Unknown error'}`
		);
	}

	const data = await response.json();
	if (!data.ok) {
		throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
	}

	return data.result;
}
