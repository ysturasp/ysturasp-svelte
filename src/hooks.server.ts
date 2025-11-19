import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { initDatabase } from '$lib/db/database';

Sentry.init({
	dsn: 'https://1b06d9a1c323ed3e01e5cc72d1a1a760@o4508637792239616.ingest.us.sentry.io/4509830716260352',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

const initDbHandle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized && !dbInitPromise) {
		console.log('[initDbHandle] Запуск инициализации БД...');
		dbInitPromise = (async () => {
			try {
				console.log('[initDbHandle] Начало инициализации БД...');
				await initDatabase();
				dbInitialized = true;
				console.log('[initDbHandle] БД успешно инициализирована');
			} catch (error) {
				console.error('[initDbHandle] Ошибка инициализации БД:', error);
				dbInitPromise = null;
			}
		})();
	}

	if (dbInitPromise) {
		console.log('[initDbHandle] Ожидание завершения инициализации...');
		await dbInitPromise;
		console.log('[initDbHandle] Инициализация завершена, обработка запроса');
	}

	return resolve(event);
};

const skipMonocraftHandle: Handle = async ({ event, resolve }) => {
	const pathname = decodeURIComponent(event.url.pathname);

	if (pathname.startsWith('/url(') && pathname.includes('Monocraft')) {
		return new Response(null, { status: 204 });
	}

	return resolve(event);
};

console.log('[hooks.server] Модуль загружен, запуск инициализации БД в фоне...');

(async () => {
	try {
		console.log('[hooks.server] Фоновая инициализация БД...');
		await initDatabase();
		dbInitialized = true;
		console.log('[hooks.server] Фоновая инициализация БД завершена успешно');
	} catch (error) {
		console.error('[hooks.server] Ошибка фоновой инициализации БД:', error);
		console.log('[hooks.server] Инициализация будет выполнена при первом запросе');
	}
})();

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle(), initDbHandle, skipMonocraftHandle);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
