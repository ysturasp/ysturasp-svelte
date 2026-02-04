import type { RequestEvent } from '@sveltejs/kit';
import { trackEvent, getTrackEventSQL, type WebEventSource } from './analytics';

export function getEventSource(event: RequestEvent): WebEventSource {
	if (event.locals.isTelegram === true) {
		return 'mini-app';
	}

	const userAgent = event.request.headers.get('user-agent') || '';
	const referer = event.request.headers.get('referer') || '';
	const origin = event.request.headers.get('origin') || '';

	if (
		userAgent.toLowerCase().includes('telegram') ||
		referer.includes('telegram') ||
		origin.includes('telegram') ||
		event.url.searchParams.has('tgWebAppData') ||
		event.url.searchParams.has('tgWebAppStartParam') ||
		event.request.headers.get('sec-fetch-site') === 'cross-site'
	) {
		return 'mini-app';
	}

	const pathname = event.url.pathname;
	if (pathname.startsWith('/miniapp') || pathname.startsWith('/tg')) {
		return 'mini-app';
	}

	return 'web';
}

export function isMiniApp(event: RequestEvent): boolean {
	return getEventSource(event) === 'mini-app';
}

export async function trackEventAuto(
	event: RequestEvent,
	userId: string,
	eventType: string,
	payload?: Record<string, unknown> | null
): Promise<void> {
	const source = getEventSource(event);
	const miniApp = source === 'mini-app';

	await trackEvent(
		{
			userId,
			eventType,
			payload,
			source
		},
		miniApp
	);
}

export function getTrackEventSQLAuto(
	event: RequestEvent,
	userId: string,
	eventType: string,
	payload?: Record<string, unknown> | null
): { sql: string; values: any[] } {
	const source = getEventSource(event);
	const miniApp = source === 'mini-app';

	return getTrackEventSQL(
		{
			userId,
			eventType,
			payload,
			source
		},
		miniApp
	);
}

export async function executeWithTracking<T>(
	pool: any,
	mainQuery: { sql: string; values: any[] },
	event: RequestEvent,
	userId: string,
	eventType: string,
	payload?: Record<string, unknown> | null
): Promise<T> {
	const trackingQuery = getTrackEventSQLAuto(event, userId, eventType, payload);

	const client = await pool.connect();
	try {
		await client.query('BEGIN');

		const result = await client.query(mainQuery.sql, mainQuery.values);

		try {
			await client.query(trackingQuery.sql, trackingQuery.values);
		} catch (err) {
			console.warn('[executeWithTracking] Analytics tracking failed:', err);
		}

		await client.query('COMMIT');
		return result;
	} catch (err) {
		await client.query('ROLLBACK');
		throw err;
	} finally {
		client.release();
	}
}
