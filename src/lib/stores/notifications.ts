import { writable } from 'svelte/store';
import type { NotificationType } from '$lib/types';

export interface NotificationItem {
	id: string;
	message: string;
	type: NotificationType;
	height?: number;
	isHiding?: boolean;
}

function createNotificationsStore() {
	const { subscribe, update } = writable<NotificationItem[]>([]);

	const store = {
		subscribe,
		add: (message: string, type: NotificationType = 'info') => {
			const id = Math.random().toString(36).substring(2);
			update((notifications) => [...notifications, { id, message, type }]);

			setTimeout(() => {
				update((notifications) =>
					notifications.map((n) => (n.id === id ? { ...n, isHiding: true } : n))
				);

				setTimeout(() => {
					store.remove(id);
				}, 500);
			}, 5000);
		},
		remove: (id: string) => {
			update((notifications) => notifications.filter((n) => n.id !== id));
		}
	};

	return store;
}

export const notifications = createNotificationsStore();
