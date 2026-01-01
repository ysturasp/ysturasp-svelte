import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';
import { randomBytes } from 'crypto';

const CHALLENGE_PREFIX = 'online:challenge:';
const CHALLENGE_TTL = 60;

export const GET: RequestHandler = async ({ url, getClientAddress }) => {
	try {
		const userId = url.searchParams.get('userId');
		const fingerprint = url.searchParams.get('fingerprint');

		if (!userId || typeof userId !== 'string' || userId.length < 5 || userId.length > 50) {
			return json({ error: 'Invalid userId' }, { status: 400 });
		}

		if (!fingerprint || typeof fingerprint !== 'string') {
			return json({ error: 'Invalid fingerprint' }, { status: 400 });
		}

		const redis = getRedisClient();
		const ipAddress = getClientAddress();

		const challenge = randomBytes(32).toString('base64url');
		const challengeKey = `${CHALLENGE_PREFIX}${userId}:${fingerprint}`;

		await redis.setex(
			challengeKey,
			CHALLENGE_TTL,
			JSON.stringify({
				challenge,
				userId,
				fingerprint,
				ipAddress,
				createdAt: Date.now()
			})
		);

		return json({
			challenge,
			expiresIn: CHALLENGE_TTL
		});
	} catch (error) {
		console.error('Error generating challenge:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
