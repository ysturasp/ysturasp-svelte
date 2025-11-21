import { env } from '$env/dynamic/private';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const DEFAULT_SESSION_TTL = 60 * 60 * 24 * 30;
const REFRESH_THRESHOLD_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
	userId: string;
	sessionId: string;
	sessionKey: string;
	issuedAt: number;
	expiresAt: number;
	nonce: string;
}

function getSessionSecret(): string {
	const secret = env.SESSION_SECRET;
	if (!secret) {
		throw new Error('SESSION_SECRET is not configured');
	}
	return secret;
}

function base64UrlEncode(input: string | Buffer): string {
	return Buffer.from(input)
		.toString('base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
	const padded = input.replace(/-/g, '+').replace(/_/g, '/');
	const padLength = (4 - (padded.length % 4)) % 4;
	return Buffer.from(padded + '='.repeat(padLength), 'base64');
}

function signPayload(payload: string): string {
	return base64UrlEncode(createHmac('sha256', getSessionSecret()).update(payload).digest());
}

export interface CreateTokenParams {
	userId: string;
	sessionId: string;
	sessionKey: string;
	ttlSeconds?: number;
}

export function createSessionToken({
	userId,
	sessionId,
	sessionKey,
	ttlSeconds = DEFAULT_SESSION_TTL
}: CreateTokenParams): { token: string; expiresAt: number } {
	const issuedAt = Math.floor(Date.now() / 1000);
	const expiresAt = issuedAt + ttlSeconds;

	const payload: SessionPayload = {
		userId,
		sessionId,
		sessionKey,
		issuedAt,
		expiresAt,
		nonce: randomBytes(16).toString('hex')
	};

	const encodedPayload = base64UrlEncode(JSON.stringify(payload));
	const signature = signPayload(encodedPayload);

	return {
		token: `${encodedPayload}.${signature}`,
		expiresAt
	};
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
	if (!token) {
		return null;
	}

	const [encodedPayload, signature] = token.split('.');
	if (!encodedPayload || !signature) {
		return null;
	}

	const expectedSignature = signPayload(encodedPayload);

	const sigBuffer = base64UrlDecode(signature);
	const expectedBuffer = base64UrlDecode(expectedSignature);

	if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
		return null;
	}

	try {
		const payload = JSON.parse(base64UrlDecode(encodedPayload).toString()) as SessionPayload;
		if (payload.expiresAt <= Math.floor(Date.now() / 1000)) {
			return null;
		}
		if (!payload.userId || !payload.sessionId || !payload.sessionKey) {
			return null;
		}
		return payload;
	} catch (error) {
		console.error('Failed to parse session token payload:', error);
		return null;
	}
}

export function shouldRefreshSession(
	payload: SessionPayload,
	thresholdSeconds: number = REFRESH_THRESHOLD_SECONDS
): boolean {
	const now = Math.floor(Date.now() / 1000);
	return payload.expiresAt - now <= thresholdSeconds;
}
