import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { initDatabase } from '$lib/db/database';
import { isIpBlocked, logSecurityEventAndMaybeBlock } from '$lib/db/security';
import { isbot } from 'isbot';
import { startPaymentChecker } from '$lib/payment/payment-scheduler';
import { getSessionContext } from '$lib/server/sessionContext';

const KNOWN_ROUTE_PREFIXES = [
	'/api',
	'/rasp',
	'/raspaudience',
	'/raspprep',
	'/yspu',
	'/format',
	'/stat',
	'/groups',
	'/campus',
	'/data',
	'/about',
	'/support',
	'/legal',
	'/profile',
	'/vkr',
	'/install',
	'/installapp',
	'/changelog',
	'/robots.txt',
	'/sitemap.xml',
	'/security.txt',
	'/.well-known',
	'/images'
];

const SUSPICIOUS_EXTENSIONS = [
	'.php',
	'.asp',
	'.aspx',
	'.jsp',
	'.cgi',
	'.pl',
	'.sh',
	'.py',
	'.rb',
	'.env',
	'.sql',
	'.bak',
	'.old',
	'.tmp',
	'.log',
	'.ini',
	'.conf',
	'.config'
];

const STATIC_PATHS = ['/images', '/robots.txt', '/sitemap.xml', '/security.txt', '/.well-known'];

function isKnownRoute(pathname: string): boolean {
	if (pathname === '/') {
		return true;
	}

	return KNOWN_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function hasSuspiciousSigns(pathname: string): boolean {
	const normalizedPath = pathname.toLowerCase();

	if (normalizedPath === '/env' || normalizedPath === '/.env') {
		return true;
	}

	if (/^\/[^/]+\.js$/i.test(pathname)) {
		return true;
	}

	if (pathname.startsWith('/@vite/')) {
		return true;
	}

	if (SUSPICIOUS_EXTENSIONS.some((ext) => normalizedPath.endsWith(ext))) {
		return true;
	}

	const legitimateWellKnown = [
		'/.well-known/security.txt',
		'/.well-known/appspecific/',
		'/.well-known/assetlinks.json'
	];
	const isLegitimateWellKnown = legitimateWellKnown.some((path) => pathname.startsWith(path));

	if (/^\/\./.test(pathname) && !isLegitimateWellKnown) {
		return true;
	}

	const suspiciousPatterns = [
		/\/wp-(admin|login|content|includes)/i,
		/\/phpmyadmin|phpMyAdmin/i,
		/\/admin(istrator)?\/?$/i,
		/\/cgi-bin/i,
		/\/xmlrpc/i,
		/\/backup/i,
		/\/shell|cmd|exec/i,
		/\/test\.(php|html|htm)/i,
		/\/phpinfo/i
	];

	return suspiciousPatterns.some((pattern) => pattern.test(pathname));
}

const API_TESTING_TOOLS = [
	/postman/i,
	/insomnia/i,
	/httpie/i,
	/thunder\s*client/i,
	/rest\s*client/i,
	/api\s*client/i,
	/curl/i,
	/wget/i,
	/http\s*request/i
];

function isApiTestingTool(userAgent: string | null): boolean {
	if (!userAgent) return false;
	return API_TESTING_TOOLS.some((pattern) => pattern.test(userAgent));
}

function isBotRequest(pathname: string, userAgent: string | null): boolean {
	if (hasSuspiciousSigns(pathname)) {
		return true;
	}

	const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;
	if (isApiTestingTool(userAgent) && !isDevelopment) {
		const isStaticPath = STATIC_PATHS.some((path) => pathname.startsWith(path));

		if (!isStaticPath) {
			return true;
		}
	}

	if (isKnownRoute(pathname)) {
		return false;
	}

	if (userAgent && isbot(userAgent)) {
		return true;
	}

	return false;
}

Sentry.init({
	dsn: 'https://1b06d9a1c323ed3e01e5cc72d1a1a760@o4508637792239616.ingest.us.sentry.io/4509830716260352',

	tracesSampleRate: 1.0,

	// Enable logs to be sent to Sentry
	enableLogs: true,

	beforeSend(event, hint) {
		if (event.exception) {
			const error = hint.originalException;
			if (error instanceof Error && error.message.includes('Not found:')) {
				const pathMatch = error.message.match(/Not found: (.+)/);
				if (pathMatch) {
					const path = pathMatch[1];

					if (
						path.startsWith('/.well-known/appspecific/') ||
						path.startsWith('/.well-known/security.txt') ||
						path.startsWith('/.well-known/assetlinks.json') ||
						path.startsWith('/.well-known/apple-app-site-association')
					) {
						return null;
					}

					if (isKnownRoute(path)) {
						return event;
					}

					if (hasSuspiciousSigns(path)) {
						return null;
					}

					return null;
				}
			}
		}
		return event;
	}

	// uncomment the line below to enable Spotlight (https://spotlightjs.com)
	// spotlight: import.meta.env.DEV,
});

let dbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

const initDbHandle: Handle = async ({ event, resolve }) => {
	if (dbInitialized) {
		return resolve(event);
	}

	if (dbInitPromise) {
		await dbInitPromise;
		return resolve(event);
	}

	console.log('[initDbHandle] Запуск инициализации БД...');
	dbInitPromise = (async () => {
		try {
			await initDatabase(false);
			await initDatabase(true);
			dbInitialized = true;
			console.log('[initDbHandle] БД успешно инициализированы');
		} catch (error) {
			console.error('[initDbHandle] Ошибка инициализации БД:', error);
			dbInitPromise = null;
		}
	})();

	await dbInitPromise;
	return resolve(event);
};

const skipMonocraftHandle: Handle = async ({ event, resolve }) => {
	const pathname = decodeURIComponent(event.url.pathname);

	if (pathname === '/favicon.ico') {
		return new Response(null, { status: 204 });
	}

	if (pathname.startsWith('/url(') && pathname.includes('Monocraft')) {
		return new Response(null, { status: 204 });
	}

	return resolve(event);
};

const suppressBotErrorsHandle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const userAgent = event.request.headers.get('user-agent');
	const referer = event.request.headers.get('referer');

	const cfConnectingIp = event.request.headers.get('cf-connecting-ip');
	const clientAddressHeader = event.request.headers.get('x-forwarded-for');
	const forwardedIp = clientAddressHeader?.split(',')[0]?.trim() || null;
	const clientAddress =
		typeof event.getClientAddress === 'function' ? event.getClientAddress() : null;
	const ipAddress = cfConnectingIp || forwardedIp || clientAddress;

	const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;
	if (await isIpBlocked(ipAddress)) {
		return new Response('Forbidden', { status: 403 });
	}

	if (isApiTestingTool(userAgent) && !isDevelopment) {
		const isStaticPath = STATIC_PATHS.some((path) => pathname.startsWith(path));

		if (!isStaticPath) {
			await logSecurityEventAndMaybeBlock({
				ipAddress,
				userAgent,
				method: event.request.method,
				path: pathname,
				status: 403,
				reason: 'API_TESTING_TOOL_FORBIDDEN',
				referer,
				isBot: false,
				isApiTestingTool: true
			});
			return new Response('Forbidden', { status: 403 });
		}
	}

	const botLike = isBotRequest(pathname, userAgent);

	try {
		const response = await resolve(event);

		if (response.status === 404) {
			await logSecurityEventAndMaybeBlock({
				ipAddress,
				userAgent,
				method: event.request.method,
				path: pathname,
				status: 404,
				reason: botLike ? 'BOT_404' : 'NOT_FOUND',
				referer,
				isBot: botLike,
				isApiTestingTool: isApiTestingTool(userAgent)
			});
		}

		return response;
	} catch (error) {
		if (error instanceof Error && error.message.includes('Not found:')) {
			const pathMatch = error.message.match(/Not found: (.+)/);
			const notFoundPath = pathMatch ? pathMatch[1] : pathname;

			const { blocked } = await logSecurityEventAndMaybeBlock({
				ipAddress,
				userAgent,
				method: event.request.method,
				path: notFoundPath,
				status: 404,
				reason: botLike ? 'BOT_404_ERROR' : 'NOT_FOUND_ERROR',
				referer,
				isBot: botLike,
				isApiTestingTool: isApiTestingTool(userAgent)
			});

			if (blocked) {
				return new Response('Forbidden', { status: 403 });
			}

			return new Response('Not found', { status: 404 });
		}

		throw error;
	}
};

const originalConsoleError = console.error;
const originalStderrWrite = process.stderr.write.bind(process.stderr);

console.error = (...args: unknown[]) => {
	const firstArg = args[0];
	if (firstArg instanceof Error && firstArg.message.includes('Not found:')) {
		return;
	}
	originalConsoleError.apply(console, args);
};

process.stderr.write = (chunk: any, ...args: any[]) => {
	const str = chunk?.toString() || '';
	if (str.includes('Not found:')) {
		return true;
	}
	return originalStderrWrite(chunk, ...args);
};

console.log('[hooks.server] Модуль загружен, запуск инициализации БД в фоне...');

dbInitPromise = (async () => {
	try {
		console.log('[hooks.server] Фоновая инициализация БД...');
		await initDatabase(false);
		await initDatabase(true);
		dbInitialized = true;
		console.log('[hooks.server] Фоновая инициализация БД завершена успешно');

		startPaymentChecker();
	} catch (error) {
		console.error('[hooks.server] Ошибка фоновой инициализации БД:', error);
		console.log('[hooks.server] Инициализация будет выполнена при первом запросе');
		dbInitPromise = null;
	}
})();

const anonymousIdHandle: Handle = async ({ event, resolve }) => {
	let anonymousId = event.cookies.get('analytics_anonymous_id');

	if (!anonymousId) {
		anonymousId = crypto.randomUUID();
		event.cookies.set('analytics_anonymous_id', anonymousId, {
			path: '/',
			httpOnly: false,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	event.locals.anonymousId = anonymousId;
	return resolve(event);
};

export async function sessionHandle({ event, resolve }: { event: any; resolve: any }) {
	try {
		const context = await getSessionContext(event.cookies);
		if (context) {
			event.locals.user = context.user;
			event.locals.session = context.session;
			event.locals.isTelegram = context.isTelegram;
		}
	} catch (error) {
		console.error('[sessionHandle] Ошибка получения сессии:', error);
	}

	return resolve(event);
}

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(
	suppressBotErrorsHandle,
	sentryHandle(),
	initDbHandle,
	anonymousIdHandle,
	sessionHandle,
	skipMonocraftHandle
);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
