import { browser } from '$app/environment';
import { checkIsTelegramMiniApp } from '$lib/utils/telegram';

const NOTIFICATIONS_API_URL =
	'https://script.google.com/macros/s/AKfycbynJ6k1bvJGUYUF4rb0LYFusgADmDqPXuR27yXf4gC3aBSQLKHvZ-r5rgpbQldUxLnK/exec';

function getTelegramUserData(): { id: string; username?: string } | null {
	const tg = (window as any).Telegram?.WebApp;

	if (tg?.initDataUnsafe?.user?.id) {
		return {
			id: tg.initDataUnsafe.user.id.toString(),
			username: tg.initDataUnsafe.user.username || 'admin'
		};
	}

	const hash = window.location.hash;
	const tgWebAppDataMatch = hash.match(/tgWebAppData=([^&]+)/);

	if (tgWebAppDataMatch) {
		try {
			const encodedData = tgWebAppDataMatch[1];

			let decodedData = decodeURIComponent(encodedData);

			if (decodedData.includes('%')) {
				decodedData = decodeURIComponent(decodedData);
			}

			const userMatch = decodedData.match(/user=(\{[^}]+\})/);

			if (userMatch) {
				const userDataStr = userMatch[1];
				const userData = JSON.parse(userDataStr);
				return {
					id: userData.id?.toString() || null,
					username: userData.username || 'admin'
				};
			}
		} catch (parseError) {}
	}

	return null;
}

export interface NotificationSubscription {
	groupName: string;
	notifyMinutes: number;
	hiddenSubjects?: any[];
	excludeHidden?: boolean;
	manuallyExcludedSubjects?: string[];
}

export interface NotificationStatus {
	subscribed: boolean;
	notifyMinutes?: number;
	subscriptions?: NotificationSubscription[];
}

export interface NotificationResponse {
	success: boolean;
	subscribed?: boolean;
	notifyMinutes?: number;
	subscriptions?: NotificationSubscription[];
	message?: string;
}

export async function checkNotificationStatus(
	groupName?: string
): Promise<NotificationStatus | null> {
	if (!browser) {
		return null;
	}

	const isTelegram = checkIsTelegramMiniApp() || !!(window as any).Telegram?.WebApp;
	if (!isTelegram) {
		return null;
	}

	try {
		const userData = getTelegramUserData();
		if (!userData?.id) {
			return null;
		}

		const response = await fetch(NOTIFICATIONS_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain;charset=utf-8'
			},
			body: JSON.stringify({
				action: 'checkNotificationStatus',
				userId: userData.id
			})
		});

		if (response.ok) {
			const data: NotificationResponse = await response.json();

			if (data.success) {
				if (groupName && data.subscriptions) {
					const groupSubscription = data.subscriptions.find(
						(sub) => sub.groupName === groupName
					);
					return {
						subscribed: !!groupSubscription,
						notifyMinutes: groupSubscription?.notifyMinutes,
						subscriptions: data.subscriptions
					};
				}

				return {
					subscribed: !!(data.subscriptions && data.subscriptions.length > 0),
					subscriptions: data.subscriptions || []
				};
			}
		}
	} catch (error) {}

	return null;
}

export async function toggleNotifications(
	groupName: string,
	notifyMinutes: number = 0,
	hiddenSubjects: any[] | null = null,
	update: boolean = false,
	manuallyExcludedSubjects: string[] = []
): Promise<boolean> {
	if (!browser) {
		return false;
	}

	const isTelegram = checkIsTelegramMiniApp() || !!(window as any).Telegram?.WebApp;
	if (!isTelegram) {
		return false;
	}

	try {
		const userData = getTelegramUserData();
		if (!userData?.id) {
			return false;
		}

		const response = await fetch(NOTIFICATIONS_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain;charset=utf-8'
			},
			body: JSON.stringify({
				action: 'toggleNotification',
				userId: userData.id,
				username: userData.username || 'admin',
				groupName: groupName,
				notifyMinutes: notifyMinutes.toString(),
				hiddenSubjects: hiddenSubjects || [],
				update: update,
				manuallyExcludedSubjects: manuallyExcludedSubjects || []
			})
		});

		if (response.ok) {
			const data: NotificationResponse = await response.json();
			return data.success || false;
		}
	} catch (error) {}

	return false;
}
