import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';
import { createHmac } from 'crypto';
import { env } from '$env/dynamic/private';
import { randomBytes } from 'crypto';

const ONLINE_KEY_PREFIX = 'online:';
const CHALLENGE_PREFIX = 'online:challenge:';
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

function base64UrlDecode(input: string): string {
	let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
	const pad = base64.length % 4;
	if (pad) {
		base64 += '='.repeat(4 - pad);
	}
	return Buffer.from(base64, 'base64').toString('utf-8');
}

function createSessionToken(userId: string, fingerprint: string): string {
	const timestamp = Date.now();
	const nonce = randomBytes(16).toString('hex');
	const payload = `${userId}:${fingerprint}:${timestamp}:${nonce}`;
	const signature = base64UrlEncode(
		createHmac('sha256', getOnlineSecret()).update(payload).digest()
	);
	return base64UrlEncode(payload) + '.' + signature;
}

async function verifyChallengeSignature(
	challenge: string,
	signature: string,
	userId: string,
	fingerprint: string
): Promise<boolean> {
	try {
		if (!challenge || !signature) {
			return false;
		}

		let base64 = signature.replace(/-/g, '+').replace(/_/g, '/');
		const pad = base64.length % 4;
		if (pad) {
			base64 += '='.repeat(4 - pad);
		}
		const receivedSignature = Buffer.from(base64, 'base64');

		const keyMaterial = `${challenge}:${userId}:${fingerprint}`;

		const expectedSignature = createHmac('sha256', keyMaterial).update(challenge).digest();

		if (receivedSignature.length !== expectedSignature.length) {
			return false;
		}

		let result = 0;
		for (let i = 0; i < receivedSignature.length; i++) {
			result |= receivedSignature[i] ^ expectedSignature[i];
		}

		return result === 0;
	} catch {
		return false;
	}
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const { userId, fingerprint, userAgent, challenge, signature } = await request.json();

		if (!userId || typeof userId !== 'string' || userId.length < 5 || userId.length > 50) {
			return json({ error: 'Invalid userId' }, { status: 400 });
		}

		if (!fingerprint || typeof fingerprint !== 'string') {
			return json({ error: 'Invalid fingerprint' }, { status: 400 });
		}

		if (!userAgent || userAgent.length < 10) {
			return json({ error: 'Invalid user agent' }, { status: 400 });
		}

		if (!challenge || typeof challenge !== 'string') {
			return json({ error: 'Missing challenge' }, { status: 400 });
		}

		if (!signature || typeof signature !== 'string') {
			return json({ error: 'Missing signature' }, { status: 400 });
		}

		const redis = getRedisClient();
		const ipAddress = getClientAddress();
		const challengeKey = `${CHALLENGE_PREFIX}${userId}:${fingerprint}`;

		const challengeDataStr = await redis.get(challengeKey);
		if (!challengeDataStr) {
			return json({ error: 'Challenge expired or invalid' }, { status: 401 });
		}

		let challengeData: any;
		try {
			challengeData = JSON.parse(challengeDataStr);
		} catch {
			return json({ error: 'Invalid challenge data' }, { status: 401 });
		}

		if (challengeData.challenge !== challenge) {
			return json({ error: 'Challenge mismatch' }, { status: 401 });
		}

		const isValidSignature = await verifyChallengeSignature(
			challenge,
			signature,
			userId,
			fingerprint
		);
		if (!isValidSignature) {
			return json({ error: 'Invalid signature' }, { status: 401 });
		}

		if (challengeData.ipAddress !== ipAddress) {
			console.warn(
				`IP mismatch for userId ${userId}: expected ${challengeData.ipAddress}, got ${ipAddress}`
			);
		}

		await redis.del(challengeKey);

		const now = Date.now();
		const sessionToken = createSessionToken(userId, fingerprint);
		const key = `${ONLINE_KEY_PREFIX}${userId}`;

		await redis.setex(
			key,
			ONLINE_EXPIRY_SECONDS,
			JSON.stringify({
				userId,
				fingerprint,
				ipAddress,
				userAgent,
				createdAt: now,
				group: 'Гость',
				timestamp: now,
				lastActivity: now,
				lastHeartbeat: now
			})
		);

		return json({
			sessionToken,
			expiresIn: ONLINE_EXPIRY_SECONDS
		});
	} catch (error) {
		console.error('Error initializing online session:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
