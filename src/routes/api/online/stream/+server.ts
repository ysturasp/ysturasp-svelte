import type { RequestHandler } from './$types';
import { getRedisClient } from '$lib/config/redis';

const ONLINE_KEY_PREFIX = 'online:';
const PUBSUB_CHANNEL = 'online:updates';

async function getOnlineCount(redis: ReturnType<typeof getRedisClient>) {
	const keys = await redis.keys(`${ONLINE_KEY_PREFIX}*`);

	if (keys.length === 0) {
		return { count: 0, users: {}, groupStats: {} };
	}

	const userKeys = keys.filter((key) => !key.startsWith('online:challenge:'));

	if (userKeys.length === 0) {
		return { count: 0, users: {}, groupStats: {} };
	}

	const users: Record<string, any> = {};
	const groupStats: Record<string, number> = {};

	const values = await redis.mget(...userKeys);

	values.forEach((value, index) => {
		if (value) {
			try {
				const userData = JSON.parse(value);
				const userId = userKeys[index].replace(ONLINE_KEY_PREFIX, '');

				if (userData && (userData.userId || userId)) {
					users[userId] = userData;

					const group = userData.group || 'Гость';
					groupStats[group] = (groupStats[group] || 0) + 1;
				}
			} catch (e) {
				console.error('Error parsing user data:', e);
			}
		}
	});

	return {
		count: Object.keys(users).length,
		users,
		groupStats
	};
}

export const GET: RequestHandler = async () => {
	const redis = getRedisClient();

	let subscriber: ReturnType<typeof getRedisClient> | null = null;
	let checkInterval: ReturnType<typeof setInterval> | null = null;
	let isClosed = false;

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder();

			const sendData = (data: any) => {
				if (isClosed) return;
				try {
					const message = `data: ${JSON.stringify(data)}\n\n`;
					controller.enqueue(encoder.encode(message));
				} catch (error) {
					console.error('Error sending SSE data:', error);
				}
			};

			const cleanup = async () => {
				isClosed = true;
				if (checkInterval) {
					clearInterval(checkInterval);
					checkInterval = null;
				}
				if (subscriber) {
					try {
						await subscriber.unsubscribe(PUBSUB_CHANNEL);
						await subscriber.quit();
					} catch (error) {
						console.error('Error cleaning up subscriber:', error);
					}
					subscriber = null;
				}
			};

			try {
				const initialData = await getOnlineCount(redis);
				sendData(initialData);
			} catch (error) {
				console.error('Error getting initial count:', error);
			}

			try {
				subscriber = redis.duplicate();

				await subscriber.subscribe(PUBSUB_CHANNEL);

				subscriber.on('message', async (channel, message) => {
					if (isClosed || channel !== PUBSUB_CHANNEL) return;
					try {
						const data = await getOnlineCount(redis);
						sendData(data);
					} catch (error) {
						console.error('Error getting updated count:', error);
					}
				});
			} catch (error) {
				console.error('Error setting up Redis subscriber:', error);
			}

			checkInterval = setInterval(async () => {
				if (isClosed) {
					clearInterval(checkInterval!);
					return;
				}
				try {
					const data = await getOnlineCount(redis);
					sendData(data);
				} catch (error) {
					console.error('Error in periodic check:', error);
				}
			}, 500);

			(controller as any)._cleanup = cleanup;
		},
		async cancel() {
			isClosed = true;
			if (checkInterval) {
				clearInterval(checkInterval);
				checkInterval = null;
			}
			if (subscriber) {
				try {
					await subscriber.unsubscribe(PUBSUB_CHANNEL);
					subscriber.removeAllListeners();
					await subscriber.quit();
				} catch (error) {
					console.error('Error cleaning up subscriber in cancel:', error);
				}
				subscriber = null;
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
