import { getPool } from '$lib/db/database';
import type { Pool } from 'pg';

export type WebEventSource = 'web' | 'mini-app';

export interface TrackEventParams {
	userId?: string | null;
	anonymousId?: string | null;
	eventType: string;
	payload?: Record<string, unknown> | null;
	source: WebEventSource;
}

export interface DailyActiveUsersRow {
	date: string;
	unique_users: string;
	total_events: string;
}

export interface EventTypeStatsRow {
	event_type: string;
	count: string;
}

export interface AnalyticsSummary {
	periodStart: string;
	periodEnd: string;
	totalEvents: number;
	uniqueUsers: number;
	eventsByType: Array<{ eventType: string; count: number }>;
	dailyActiveUsers: Array<{
		date: string;
		uniqueUsers: number;
		totalEvents: number;
	}>;
}

export async function trackEvent(
	params: TrackEventParams,
	isMiniApp: boolean = false
): Promise<void> {
	const { userId = null, anonymousId = null, eventType, payload = null, source } = params;

	try {
		const pool = getPool(isMiniApp);
		if (!pool) {
			console.warn('[trackEvent] Pool не найден, событие не сохранено', {
				isMiniApp,
				eventType
			});
			return;
		}

		const tableName = isMiniApp ? 'webapp_events' : 'web_events';

		const query = `
			INSERT INTO ${tableName} (user_id, anonymous_id, event_type, payload, source, created_at)
			VALUES ($1, $2, $3, $4, $5, NOW())
		`;

		await pool.query(query, [
			userId,
			anonymousId,
			eventType,
			payload ? JSON.stringify(payload) : null,
			source
		]);
	} catch (err) {
		console.error(`[trackEvent] Analytics track failed:`, {
			error: err instanceof Error ? err.message : String(err),
			stack: err instanceof Error ? err.stack : undefined,
			userId,
			eventType,
			isMiniApp,
			tableName: isMiniApp ? 'webapp_events' : 'web_events'
		});
	}
}

export function getTrackEventSQL(
	params: TrackEventParams,
	isMiniApp: boolean = false
): {
	sql: string;
	values: any[];
} {
	const { userId = null, anonymousId = null, eventType, payload = null, source } = params;
	const tableName = isMiniApp ? 'webapp_events' : 'web_events';

	const sql = `
		INSERT INTO ${tableName} (user_id, anonymous_id, event_type, payload, source, created_at)
		VALUES ($1, $2, $3, $4, $5, NOW())
	`;

	const values = [
		userId,
		anonymousId,
		eventType,
		payload ? JSON.stringify(payload) : null,
		source
	];

	console.log('[getTrackEventSQL] SQL подготовлен', {
		tableName,
		userId,
		eventType,
		source,
		isMiniApp
	});

	return { sql, values };
}

export async function getDAU(
	startDate: Date,
	endDate: Date,
	isMiniApp: boolean = false
): Promise<DailyActiveUsersRow[]> {
	const pool = getPool(isMiniApp);
	if (!pool) {
		throw new Error('[getDAU] Pool не найден');
	}

	const tableName = isMiniApp ? 'webapp_events' : 'web_events';

	const result = await pool.query<DailyActiveUsersRow>(
		`
		SELECT 
			DATE(created_at AT TIME ZONE 'UTC') as date,
			COUNT(DISTINCT COALESCE(user_id::text, anonymous_id::text)) as unique_users,
			COUNT(*) as total_events
		FROM ${tableName}
		WHERE created_at >= $1 AND created_at <= $2
		GROUP BY DATE(created_at AT TIME ZONE 'UTC')
		ORDER BY date ASC
		`,
		[startDate, endDate]
	);

	return result.rows;
}

export async function getMAU(month: Date, isMiniApp: boolean = false): Promise<number> {
	const pool = getPool(isMiniApp);
	if (!pool) {
		throw new Error('[getMAU] Pool не найден');
	}

	const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
	const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);

	const tableName = isMiniApp ? 'webapp_events' : 'web_events';

	const result = await pool.query<{ count: string }>(
		`
		SELECT COUNT(DISTINCT COALESCE(user_id::text, anonymous_id::text)) as count
		FROM ${tableName}
		WHERE created_at >= $1 AND created_at <= $2
		`,
		[startOfMonth, endOfMonth]
	);

	return parseInt(result.rows[0]?.count ?? '0', 10);
}

export async function getEventsByType(
	startDate: Date,
	endDate: Date,
	isMiniApp: boolean = false
): Promise<EventTypeStatsRow[]> {
	const pool = getPool(isMiniApp);
	if (!pool) {
		throw new Error('[getEventsByType] Pool не найден');
	}

	const tableName = isMiniApp ? 'webapp_events' : 'web_events';

	const result = await pool.query<EventTypeStatsRow>(
		`
		SELECT 
			event_type,
			COUNT(*) as count
		FROM ${tableName}
		WHERE created_at >= $1 AND created_at <= $2
		GROUP BY event_type
		ORDER BY count DESC
		`,
		[startDate, endDate]
	);

	return result.rows;
}

export async function getSummary(
	startDate: Date,
	endDate: Date,
	isMiniApp: boolean = false
): Promise<AnalyticsSummary> {
	const pool = getPool(isMiniApp);
	if (!pool) {
		throw new Error('[getSummary] Pool не найден');
	}

	const tableName = isMiniApp ? 'webapp_events' : 'web_events';

	const [totalEventsResult, uniqueResult, eventsByType, dailyActiveUsers] = await Promise.all([
		pool.query<{ count: string }>(
			`SELECT COUNT(*) as count FROM ${tableName} WHERE created_at >= $1 AND created_at <= $2`,
			[startDate, endDate]
		),
		pool.query<{ count: string }>(
			`SELECT COUNT(DISTINCT COALESCE(user_id::text, anonymous_id::text)) as count FROM ${tableName} WHERE created_at >= $1 AND created_at <= $2`,
			[startDate, endDate]
		),
		getEventsByType(startDate, endDate, isMiniApp),
		getDAU(startDate, endDate, isMiniApp)
	]);

	const totalEvents = parseInt(totalEventsResult.rows[0]?.count ?? '0', 10);
	const uniqueUsers = parseInt(uniqueResult.rows[0]?.count ?? '0', 10);

	return {
		periodStart: startDate.toISOString().slice(0, 10),
		periodEnd: endDate.toISOString().slice(0, 10),
		totalEvents,
		uniqueUsers,
		eventsByType: eventsByType.map((r) => ({
			eventType: r.event_type,
			count: parseInt(r.count, 10)
		})),
		dailyActiveUsers: dailyActiveUsers.map((r) => ({
			date: r.date,
			uniqueUsers: parseInt(r.unique_users, 10),
			totalEvents: parseInt(r.total_events, 10)
		}))
	};
}
