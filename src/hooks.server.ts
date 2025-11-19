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

const initDbHandle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		try {
			await initDatabase();
			dbInitialized = true;
		} catch (error) {
			console.error('Ошибка инициализации БД:', error);
		}
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

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle(), initDbHandle, skipMonocraftHandle);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
