import { browser } from '$app/environment';
import { checkIsTelegramMiniApp } from './telegram';

export type WriteAccessStatus = 'allowed' | 'denied' | 'blocked' | 'error' | 'not_telegram';

/**
 * Ожидает загрузки Telegram WebApp API (быстрое ожидание)
 */
function waitForTelegramWebApp(maxWait = 500): Promise<any> {
	return new Promise((resolve) => {
		if (!browser) {
			resolve(null);
			return;
		}

		const tg = (window as any).Telegram?.WebApp;
		if (tg) {
			resolve(tg);
			return;
		}

		let attempts = 0;
		const maxAttempts = maxWait / 50;
		const interval = setInterval(() => {
			attempts++;
			const webApp = (window as any).Telegram?.WebApp;
			if (webApp) {
				clearInterval(interval);
				resolve(webApp);
			} else if (attempts >= maxAttempts) {
				clearInterval(interval);
				resolve(null);
			}
		}, 50);
	});
}

/**
 * Проверяет и запрашивает доступ на отправку сообщений от бота пользователю
 * Должен вызываться после инициализации Telegram SDK
 * @returns Статус доступа: 'allowed' - разрешено, 'denied' - отказано, 'blocked' - бот заблокирован, 'error' - ошибка, 'not_telegram' - не Telegram
 */
export async function requestWriteAccessPermission(): Promise<WriteAccessStatus> {
	if (!browser) {
		return 'not_telegram';
	}

	const isTelegram = checkIsTelegramMiniApp();
	if (!isTelegram) {
		return 'not_telegram';
	}

	try {
		const tg = (window as any).Telegram?.WebApp;

		if (tg && typeof tg.requestWriteAccess === 'function') {
			try {
				const result = await tg.requestWriteAccess();
				if (result === true || result === 'allowed') {
					return 'allowed';
				}
				return 'denied';
			} catch (requestError: any) {
				const errorMessage = String(
					requestError?.message || requestError || 'denied'
				).toLowerCase();
				if (
					errorMessage.includes('blocked') ||
					errorMessage.includes('заблокирован') ||
					errorMessage.includes('user blocked') ||
					errorMessage.includes('bot was blocked') ||
					errorMessage.includes('bot_blocked')
				) {
					return 'blocked';
				}
				return 'denied';
			}
		}

		const webApp = await waitForTelegramWebApp(300);
		if (webApp && typeof webApp.requestWriteAccess === 'function') {
			try {
				const result = await webApp.requestWriteAccess();
				if (result === true || result === 'allowed') {
					return 'allowed';
				}
				return 'denied';
			} catch (requestError: any) {
				const errorMessage = String(
					requestError?.message || requestError || 'denied'
				).toLowerCase();
				if (
					errorMessage.includes('blocked') ||
					errorMessage.includes('заблокирован') ||
					errorMessage.includes('user blocked') ||
					errorMessage.includes('bot was blocked') ||
					errorMessage.includes('bot_blocked')
				) {
					return 'blocked';
				}
				return 'denied';
			}
		}

		if (webApp && typeof webApp.postEvent === 'function') {
			try {
				webApp.postEvent('web_app_request_write_access');
				return 'allowed';
			} catch (postError: any) {
				const errorMessage = String(
					postError?.message || postError || 'denied'
				).toLowerCase();
				if (errorMessage.includes('blocked') || errorMessage.includes('заблокирован')) {
					return 'blocked';
				}
				return 'denied';
			}
		}

		try {
			const sdk = (await Promise.race([
				import('@tma.js/sdk'),
				new Promise((_, reject) =>
					setTimeout(() => reject(new Error('SDK import timeout')), 500)
				)
			])) as any;

			if (
				sdk &&
				'requestWriteAccess' in sdk &&
				typeof sdk.requestWriteAccess === 'function'
			) {
				const result = await sdk.requestWriteAccess();
				if (result === 'allowed') {
					return 'allowed';
				}
				const errorMessage = String(result).toLowerCase();
				if (
					errorMessage.includes('blocked') ||
					errorMessage.includes('заблокирован') ||
					errorMessage.includes('user blocked') ||
					errorMessage.includes('bot was blocked') ||
					errorMessage.includes('bot_blocked')
				) {
					return 'blocked';
				}
				return 'denied';
			}
		} catch (sdkError) {}

		console.error('requestWriteAccess не доступен в текущей версии Telegram WebApp');
		return 'error';
	} catch (error) {
		console.error('Ошибка при запросе доступа на отправку сообщений:', error);

		const errorMessage = String(error).toLowerCase();
		if (
			errorMessage.includes('blocked') ||
			errorMessage.includes('заблокирован') ||
			errorMessage.includes('user blocked') ||
			errorMessage.includes('bot was blocked')
		) {
			return 'blocked';
		}

		if (errorMessage.includes('denied') || errorMessage.includes('отклонен')) {
			return 'denied';
		}

		return 'error';
	}
}
