import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import CryptoJS from 'crypto-js';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message } = await request.json();

		const secret = env.PRIVATE_KEY;
		if (!secret) {
			return new Response('Секретный ключ не задан', { status: 500 });
		}

		const decrypted = CryptoJS.AES.decrypt(message, secret, {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		}).toString(CryptoJS.enc.Utf8);

		if (!decrypted) {
			throw new Error('Результат расшифровки пустой');
		}

		return json({ decrypted });
	} catch (error: unknown) {
		const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
		return new Response('Ошибка расшифровки: ' + errorMessage, { status: 500 });
	}
};
