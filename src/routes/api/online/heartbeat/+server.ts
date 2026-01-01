import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';
import { createHmac, timingSafeEqual } from 'crypto';
import { env } from '$env/dynamic/private';
import { getRealIp } from '$lib/server/ip';

const ONLINE_KEY_PREFIX = 'online:';
const CACHE_KEY = 'online:count:cache';
const ONLINE_EXPIRY_SECONDS = 5 * 60;

function getOnlineSecret(): string {
	const secret = env.ONLINE_SECRET;
	if (!secret) {
		throw new Error('ONLINE_SECRET is not configured');
	}
	return secret;
}

function base64UrlEncode(input: string | Buffer): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function base64UrlDecode(input: string): Buffer {
	let padded = input.replace(/-/g, '+').replace(/_/g, '/');
	const padLength = (4 - (padded.length % 4)) % 4;
	return Buffer.from(padded + '='.repeat(padLength), 'base64');
}

function verifySessionToken(token: string, userId: string, fingerprint: string): boolean {
	try {
		const [encodedPayload, signature] = token.split('.');
		if (!encodedPayload || !signature) return false;

		const payload = base64UrlDecode(encodedPayload).toString();
		const [tokenUserId, tokenFingerprint] = payload.split(':');

		if (tokenUserId !== userId || tokenFingerprint !== fingerprint) {
			return false;
		}

		const expectedSignature = base64UrlEncode(
			createHmac('sha256', getOnlineSecret()).update(payload).digest()
		);

		const sigBuffer = base64UrlDecode(signature);
		const expectedBuffer = base64UrlDecode(expectedSignature);

		if (sigBuffer.length !== expectedBuffer.length) return false;

		return timingSafeEqual(sigBuffer, expectedBuffer);
	} catch {
		return false;
	}
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const { userId, group, sessionToken, fingerprint, activityProof, userAgent, forceUpdate } =
			await request.json();

		if (!userId || typeof userId !== 'string' || userId.length < 5 || userId.length > 50) {
			return json({ error: 'Invalid userId' }, { status: 400 });
		}

		if (!sessionToken || !fingerprint) {
			return json({ error: 'Missing session token or fingerprint' }, { status: 400 });
		}

		if (!verifySessionToken(sessionToken, userId, fingerprint)) {
			return json({ error: 'Invalid session token' }, { status: 401 });
		}

		if (!activityProof || typeof activityProof !== 'object') {
			return json({ error: 'Missing activity proof' }, { status: 400 });
		}

		const { lastActivityTime, eventCount, visibilityState } = activityProof;

		if (!forceUpdate) {
			if (visibilityState !== 'visible') {
				return json({ error: 'Page not visible' }, { status: 400 });
			}

			const timeSinceActivity = Date.now() - (lastActivityTime || 0);
			if (timeSinceActivity > 30000 || eventCount < 2) {
				return json({ error: 'Insufficient activity proof' }, { status: 400 });
			}
		}

		const redis = getRedisClient();
		const ipAddress = getRealIp(request, getClientAddress);
		const key = `${ONLINE_KEY_PREFIX}${userId}`;

		const userDataStr = await redis.get(key);

		if (!userDataStr) {
			return json({ error: 'Session expired or invalid' }, { status: 401 });
		}

		let userData: any;
		try {
			userData = JSON.parse(userDataStr);
		} catch {
			return json({ error: 'Invalid user data' }, { status: 401 });
		}

		if (userData.fingerprint !== fingerprint) {
			return json({ error: 'Fingerprint mismatch' }, { status: 401 });
		}

		const now = Date.now();

		await redis.setex(
			key,
			ONLINE_EXPIRY_SECONDS,
			JSON.stringify({
				userId,
				fingerprint,
				ipAddress,
				userAgent: userData.userAgent,
				createdAt: userData.createdAt || now,
				group: group || 'Гость',
				timestamp: userData.createdAt || now,
				lastActivity: lastActivityTime || now,
				lastHeartbeat: now
			})
		);

		await redis.del(CACHE_KEY);

		redis.publish('online:updates', 'update').catch((error) => {
			console.error('Error publishing update:', error);
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error updating heartbeat:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
