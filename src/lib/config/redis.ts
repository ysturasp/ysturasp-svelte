import Redis from 'ioredis';
import { env } from '$env/dynamic/private';

let redisClient: Redis | null = null;

let lastErrorLogTime = 0;
const ERROR_LOG_INTERVAL = 10000;
let connectionErrorCount = 0;
let isConnected = false;

function isConnectionError(err: Error): boolean {
	const connectionErrorCodes = ['EAI_AGAIN', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
	const errorCode = 'code' in err ? (err as any).code : undefined;
	return errorCode ? connectionErrorCodes.includes(errorCode) : false;
}

export function getRedisClient(): Redis {
	if (!redisClient) {
		redisClient = new Redis({
			host: env.REDIS_HOST || 'localhost',
			port: parseInt(env.REDIS_PORT || '6379'),
			password: env.REDIS_PASSWORD || undefined,
			retryStrategy: (times) => {
				const delay = Math.min(times * 50, 2000);
				return delay;
			},
			lazyConnect: false,
			enableReadyCheck: true,
			maxRetriesPerRequest: 3
		});

		redisClient.on('error', (err) => {
			const now = Date.now();
			const isConnError = isConnectionError(err);

			if (isConnError) {
				connectionErrorCount++;
				if (now - lastErrorLogTime >= ERROR_LOG_INTERVAL) {
					console.warn(
						`Redis connection error (attempt ${connectionErrorCount}): ${err.message}. Retrying...`
					);
					lastErrorLogTime = now;
				}
			} else {
				console.error('Redis Client Error:', err);
			}
		});

		redisClient.on('connect', () => {
			isConnected = true;
			if (connectionErrorCount > 0) {
				console.log(
					`Redis Client Connected (after ${connectionErrorCount} failed attempts)`
				);
				connectionErrorCount = 0;
			} else {
				console.log('Redis Client Connected');
			}
		});

		redisClient.on('ready', () => {
			isConnected = true;
		});

		redisClient.on('close', () => {
			isConnected = false;
		});

		redisClient.on('reconnecting', (delay: number) => {
			const now = Date.now();
			if (now - lastErrorLogTime >= ERROR_LOG_INTERVAL) {
				console.log(`Redis reconnecting in ${delay}ms...`);
				lastErrorLogTime = now;
			}
		});
	}

	return redisClient;
}

export async function closeRedisClient(): Promise<void> {
	if (redisClient) {
		await redisClient.quit();
		redisClient = null;
	}
}
