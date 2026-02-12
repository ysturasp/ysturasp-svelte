import { getPool } from './database';

export interface SecurityEventPayload {
	ipAddress: string | null;
	userAgent: string | null;
	method: string;
	path: string;
	status: number | null;
	reason: string;
	referer: string | null;
	isBot: boolean;
	isApiTestingTool: boolean;
}

const BLOCK_WINDOW_MINUTES = 10;
const BLOCK_THRESHOLD = 50;
const BLOCK_DURATION_MINUTES = 60;

export async function isIpBlocked(ipAddress: string | null): Promise<boolean> {
	if (!ipAddress) return false;

	const pool = getPool(false);
	if (!pool) return false;

	const result = await pool.query(
		`
		SELECT blocked_until
		FROM blocked_ips
		WHERE ip_address = $1
			AND blocked_until > NOW()
		LIMIT 1
	`,
		[ipAddress]
	);

	return result.rows.length > 0;
}

export async function logSecurityEventAndMaybeBlock(
	payload: SecurityEventPayload
): Promise<{ blocked: boolean }> {
	const pool = getPool(false);
	if (!pool) return { blocked: false };

	const { ipAddress, userAgent, method, path, status, reason, referer, isBot, isApiTestingTool } =
		payload;

	try {
		await pool.query(
			`
			INSERT INTO security_events (
				ip_address,
				user_agent,
				method,
				path,
				status,
				reason,
				referer,
				is_bot,
				is_api_testing_tool
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		`,
			[ipAddress, userAgent, method, path, status, reason, referer, isBot, isApiTestingTool]
		);
	} catch (error) {
		console.error('[security] Ошибка записи security_events:', error);
		return { blocked: false };
	}

	if (!ipAddress) {
		return { blocked: false };
	}

	try {
		const countResult = await pool.query(
			`
			SELECT COUNT(*)::int AS cnt
			FROM security_events
			WHERE ip_address = $1
				AND created_at > NOW() - ($2::text || ' minutes')::interval
		`,
			[ipAddress, BLOCK_WINDOW_MINUTES]
		);

		const cnt: number = countResult.rows[0]?.cnt ?? 0;

		if (cnt >= BLOCK_THRESHOLD) {
			const blockedUntilInterval = `${BLOCK_DURATION_MINUTES} minutes`;

			await pool.query(
				`
				INSERT INTO blocked_ips (
					ip_address,
					blocked_until,
					reason,
					events_count,
					last_event_at
				)
				VALUES ($1, NOW() + ($2::text || ' minutes')::interval, $3, $4, NOW())
				ON CONFLICT (ip_address) DO UPDATE
				SET blocked_until = GREATEST(
						blocked_ips.blocked_until,
						NOW() + ($2::text || ' minutes')::interval
					),
					reason = EXCLUDED.reason,
					events_count = blocked_ips.events_count + EXCLUDED.events_count,
					last_event_at = NOW()
			`,
				[ipAddress, BLOCK_DURATION_MINUTES, 'TOO_MANY_SUSPICIOUS_404', cnt]
			);

			console.warn(
				`[security] IP ${ipAddress} временно заблокирован: ${cnt} событий за ${BLOCK_WINDOW_MINUTES} минут`
			);

			return { blocked: true };
		}
	} catch (error) {
		console.error('[security] Ошибка проверки порога блокировки:', error);
	}

	return { blocked: false };
}
