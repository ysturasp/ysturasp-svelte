import { env } from '$env/dynamic/private';
import { YooCheckout } from '@a2seven/yoo-checkout';

let checkout: YooCheckout | null = null;

export function getCheckout(): YooCheckout {
	if (!checkout) {
		const shopId = env.YOOKASSA_SHOP_ID;
		const secretKey = env.YOOKASSA_SECRET_KEY;

		if (!shopId || !secretKey) {
			throw new Error('YOOKASSA_SHOP_ID или YOOKASSA_SECRET_KEY не заданы');
		}

		checkout = new YooCheckout({
			shopId,
			secretKey
		});
	}
	return checkout;
}

export interface CreatePaymentParams {
	amount: number;
	description: string;
	returnUrl: string;
	metadata?: Record<string, string>;
}

export async function createPayment(params: CreatePaymentParams) {
	const checkout = getCheckout();

	const payment = await checkout.createPayment({
		amount: {
			value: params.amount.toFixed(2),
			currency: 'RUB'
		},
		capture: true,
		confirmation: {
			type: 'redirect',
			return_url: params.returnUrl
		},
		description: params.description,
		metadata: params.metadata || {}
	});

	return payment;
}

export async function getPayment(paymentId: string) {
	const checkout = getCheckout();
	return await checkout.getPayment(paymentId);
}
