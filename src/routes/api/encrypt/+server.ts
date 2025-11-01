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

		const encrypted = CryptoJS.AES.encrypt(message, secret, {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		}).toString();

		return json({ encrypted });
	} catch (error) {
		return new Response('Ошибка шифрования', { status: 500 });
	}
};
