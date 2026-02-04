import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { initDatabase } from '$lib/db/database';
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

	if (pathname.startsWith('/url(') && pathname.includes('Monocraft')) {
		return new Response(null, { status: 204 });
	}

	return resolve(event);
};

const suppressBotErrorsHandle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;
	const userAgent = event.request.headers.get('user-agent');

	const isDevelopment = process.env.NODE_ENV === 'development' || import.meta.env?.DEV;
	if (isApiTestingTool(userAgent) && !isDevelopment) {
		const isStaticPath = STATIC_PATHS.some((path) => pathname.startsWith(path));

		if (!isStaticPath) {
			return new Response('Forbidden', { status: 403 });
		}
	}

	if (isBotRequest(pathname, userAgent)) {
		const originalConsoleError = console.error;
		const originalConsoleWarn = console.warn;
		const originalConsoleLog = console.log;

		const suppressLogging = (...args: unknown[]) => {
			const firstArg = args[0];
			if (firstArg instanceof Error) {
				if (firstArg.message.includes('Not found:')) {
					const pathMatch = firstArg.message.match(/Not found: (.+)/);
					if (pathMatch && isBotRequest(pathMatch[1], userAgent)) {
						return;
					}
				}
			} else if (typeof firstArg === 'string') {
				if (firstArg.includes('Not found:') && firstArg.includes(pathname)) {
					return;
				}
			}
			originalConsoleError.apply(console, args);
		};

		console.error = suppressLogging;
		console.warn = suppressLogging;

		const originalStderrWrite = process.stderr.write.bind(process.stderr);
		process.stderr.write = (chunk: any, ...args: any[]) => {
			const str = chunk?.toString() || '';
			if (str.includes('Not found:') && str.includes(pathname)) {
				return true;
			}
			return originalStderrWrite(chunk, ...args);
		};

		const wrappedResolve = async (event: Parameters<typeof resolve>[0]) => {
			try {
				return await resolve(event);
			} catch (error) {
				if (error instanceof Error && error.message.includes('Not found:')) {
					const notFoundError = error as Error & { status?: number };
					notFoundError.status = 404;
					throw notFoundError;
				}
				throw error;
			}
		};

		try {
			const result = await wrappedResolve(event);
			console.error = originalConsoleError;
			console.warn = originalConsoleWarn;
			console.log = originalConsoleLog;
			process.stderr.write = originalStderrWrite;
			return result;
		} catch (error) {
			console.error = originalConsoleError;
			console.warn = originalConsoleWarn;
			console.log = originalConsoleLog;
			process.stderr.write = originalStderrWrite;
			throw error;
		}
	}

	return resolve(event);
};

const originalConsoleError = console.error;
const originalStderrWrite = process.stderr.write.bind(process.stderr);

console.error = (...args: unknown[]) => {
	const firstArg = args[0];
	if (firstArg instanceof Error && firstArg.message.includes('Not found:')) {
		const pathMatch = firstArg.message.match(/Not found: (.+)/);
		if (pathMatch) {
			const path = pathMatch[1];
			if (
				path.startsWith('/.well-known/appspecific/') ||
				path.startsWith('/.well-known/security.txt') ||
				path.startsWith('/.well-known/assetlinks.json') ||
				path.startsWith('/.well-known/apple-app-site-association')
			) {
				return;
			}
			if (hasSuspiciousSigns(path)) {
				return;
			}
		}
	}
	originalConsoleError.apply(console, args);
};

process.stderr.write = (chunk: any, ...args: any[]) => {
	const str = chunk?.toString() || '';
	if (str.includes('Not found:')) {
		const pathMatch = str.match(/Not found: (.+)/);
		if (pathMatch) {
			const path = pathMatch[1];
			if (
				path.startsWith('/.well-known/appspecific/') ||
				path.startsWith('/.well-known/security.txt') ||
				path.startsWith('/.well-known/assetlinks.json') ||
				path.startsWith('/.well-known/apple-app-site-association')
			) {
				return true;
			}
			if (hasSuspiciousSigns(path)) {
				return true;
			}
		}
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

const sessionHandle: Handle = async ({ event, resolve }) => {
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
};

// If you have custom handlers, make sure to place them after `sentryHandle()` in the `sequence` function.
export const handle = sequence(
	suppressBotErrorsHandle,
	sentryHandle(),
	initDbHandle,
	sessionHandle,
	skipMonocraftHandle
);

// If you have a custom error handler, pass it to `handleErrorWithSentry`
export const handleError = handleErrorWithSentry();
