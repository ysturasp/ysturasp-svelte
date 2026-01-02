import { browser } from '$app/environment';
import { checkIsTelegramMiniApp } from '$lib/utils/telegram';
import { retrieveRawInitData } from '@tma.js/sdk-svelte';
import type { SupportRequest } from '$lib/types/support';

const API_BASE_URL = import.meta.env.VITE_NOTIFICATIONS_API_URL;

function getTelegramInitData(): string | null {
	if (!browser) {
		return null;
	}

	try {
		const initData = retrieveRawInitData();
		if (initData && typeof initData === 'string' && initData.length > 0) {
			return initData;
		}
	} catch (error) {
		console.error('Error getting initData from retrieveRawInitData', error);
	}

	const tg = (window as any).Telegram?.WebApp;
	if (tg) {
		if (tg.initData && typeof tg.initData === 'string' && tg.initData.length > 0) {
			return tg.initData;
		}
	}

	return null;
}

export interface CreateSupportRequestParams {
	message: string;
	source?: string;
	isSecurityReport?: boolean;
	userId?: string;
}

export interface CreateSupportRequestResponse {
	success: boolean;
	request?: SupportRequest;
	message?: string;
}

export interface GetSupportRequestsResponse {
	success: boolean;
	requests?: SupportRequest[];
	message?: string;
}

export interface ReplyToSupportRequestParams {
	requestId: string;
	message: string;
	source?: string;
	userId?: string;
}

export interface ReplyToSupportRequestResponse {
	success: boolean;
	request?: SupportRequest;
	message?: string;
}

export async function createSupportRequest(
	params: CreateSupportRequestParams
): Promise<CreateSupportRequestResponse> {
	if (!browser) {
		return { success: false, message: 'Только для браузера' };
	}

	try {
		const initData = getTelegramInitData();
		const body: any = {
			message: params.message,
			source: params.source || 'web',
			isSecurityReport: params.isSecurityReport || false
		};

		if (initData) {
			body.initData = initData;
		} else if (params.userId) {
			body.userId = params.userId;
		}

		const response = await fetch(`${API_BASE_URL}/support`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			if (response.status === 401) {
				console.error('Unauthorized: Invalid initData');
				return { success: false, message: 'Ошибка авторизации' };
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: CreateSupportRequestResponse = await response.json();
		return data;
	} catch (error) {
		console.error('Error creating support request', error);
		return { success: false, message: 'Произошла ошибка при отправке сообщения' };
	}
}

export async function getSupportRequests(
	userId?: string,
	source?: string
): Promise<GetSupportRequestsResponse> {
	if (!browser) {
		return { success: false, message: 'Только для браузера' };
	}

	if (!API_BASE_URL) {
		return { success: false, message: 'API URL не настроен' };
	}

	try {
		const initData = getTelegramInitData();
		const body: any = {};

		if (initData) {
			body.initData = initData;
		} else if (userId) {
			body.userId = userId;
		} else {
			return { success: false, message: 'Требуется userId или авторизация' };
		}

		if (source) {
			body.source = source;
		}

		const response = await fetch(`${API_BASE_URL}/support/requests`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			if (response.status === 401) {
				console.error('Unauthorized: Invalid initData');
				return { success: false, message: 'Ошибка авторизации' };
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: GetSupportRequestsResponse = await response.json();
		return data;
	} catch (error) {
		console.error('Error getting support requests', error);
		return { success: false, message: 'Ошибка загрузки запросов' };
	}
}

export async function replyToSupportRequest(
	params: ReplyToSupportRequestParams
): Promise<ReplyToSupportRequestResponse> {
	if (!browser) {
		return { success: false, message: 'Только для браузера' };
	}

	try {
		const initData = getTelegramInitData();
		const body: any = {
			requestId: params.requestId,
			message: params.message,
			source: params.source || 'web'
		};

		if (initData) {
			body.initData = initData;
		} else if (params.userId) {
			body.userId = params.userId;
		} else {
			return { success: false, message: 'Требуется userId или авторизация' };
		}

		const response = await fetch(`${API_BASE_URL}/support/reply`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			if (response.status === 401) {
				console.error('Unauthorized: Invalid initData');
				return { success: false, message: 'Ошибка авторизации' };
			}
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: ReplyToSupportRequestResponse = await response.json();
		return data;
	} catch (error) {
		console.error('Error replying to support request', error);
		return { success: false, message: 'Произошла ошибка при отправке сообщения' };
	}
}
