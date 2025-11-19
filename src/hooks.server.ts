import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://1b06d9a1c323ed3e01e5cc72d1a1a760@o4508637792239616.ingest.us.sentry.io/4509830716260352',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});

const skipMonocraftHandle: Handle = async ({ event, resolve }) => {
	const pathname = decodeURIComponent(event.url.pathname);

	if (pathname.startsWith('/url(') && pathname.includes('Monocraft')) {
		return new Response(null, { status: 204 });
	}

	return resolve(event);
};

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(sentryHandle(), skipMonocraftHandle);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
