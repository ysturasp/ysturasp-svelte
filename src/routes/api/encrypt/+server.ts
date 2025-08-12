import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import CryptoJS from 'crypto-js';
import { PRIVATE_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { message } = await request.json();

		const encrypted = CryptoJS.AES.encrypt(message, PRIVATE_KEY, {
			mode: CryptoJS.mode.CBC,
			padding: CryptoJS.pad.Pkcs7
		}).toString();

		return json({ encrypted });
	} catch (error) {
		return new Response('Ошибка шифрования', { status: 500 });
	}
};
