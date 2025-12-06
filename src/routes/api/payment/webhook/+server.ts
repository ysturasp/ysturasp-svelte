import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPaymentByYookassaId, updatePaymentStatus } from '$lib/db/payments';
import { addPaidFormats } from '$lib/db/limits';
import { cancelPaymentCheck } from '$lib/payment/payment-scheduler';
import ipaddr from 'ipaddr.js';

const ALLOWED_YOOKASSA_IPS = [
	'185.71.76.0/27',
	'185.71.77.0/27',
	'77.75.153.0/25',
	'77.75.156.11/32',
	'77.75.156.35/32',
	'77.75.154.128/25',
	'2a02:5180::/32'
] as const;

function isIpAllowed(ip: string): boolean {
	try {
		const parsedIp = ipaddr.parse(ip);

		return ALLOWED_YOOKASSA_IPS.some((cidr) => {
			const [range, prefixLen = '32'] = cidr.split('/');
			const parsedRange = ipaddr.parse(range);
			return (
				parsedIp.kind() === parsedRange.kind() &&
				parsedIp.match(parsedRange, Number(prefixLen))
			);
		});
	} catch (error) {
		console.error('Не удалось распарсить IP адрес webhook:', { ip, error });
		return false;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.text();
		const headers = Object.fromEntries(request.headers);

		const sourceIp =
			request.headers.get('cf-connecting-ip') ||
			request.headers.get('x-real-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
			null;

		if (!sourceIp || !isIpAllowed(sourceIp)) {
			console.warn('Webhook rejected: source IP is not allowed', { sourceIp });
			return json({ error: 'IP адрес webhook не разрешён' }, { status: 403 });
		}

		const url = new URL(request.url);
		const payload = `${request.method}|${url.pathname}${url.search}|${body}`;

		const event = JSON.parse(body);
		const paymentId = event.object?.id;

		if (!paymentId) {
			return json({ error: 'ID платежа не найден' }, { status: 400 });
		}

		const payment = await getPaymentByYookassaId(paymentId);
		if (!payment) {
			return json({ error: 'Платеж не найден' }, { status: 404 });
		}

		const status = event.object?.status;

		if (status) {
			const previousStatus = payment.status;
			const updatedPayment = await updatePaymentStatus(paymentId, status);

			if (previousStatus === 'pending' && status !== 'pending') {
				cancelPaymentCheck(paymentId);
			}

			if (status === 'succeeded' && payment.status !== 'succeeded') {
				if (updatedPayment && updatedPayment.status === 'succeeded') {
					await addPaidFormats(payment.user_id, payment.formats_count);
				}
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Ошибка обработки webhook:', error);
		return json({ error: 'Ошибка обработки webhook' }, { status: 500 });
	}
};
