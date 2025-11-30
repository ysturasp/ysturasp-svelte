import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	name: string | null;
	picture: string | null;
}

interface AuthState {
	authenticated: boolean;
	user: User | null;
	loading: boolean;
}

const initialState: AuthState = {
	authenticated: false,
	user: null,
	loading: true
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		checkAuth: async () => {
			if (!browser) return;

			update((state) => ({ ...state, loading: true }));

			try {
				const response = await fetch('/api/auth/me');
				if (response.ok) {
					const data = await response.json();
					set({
						authenticated: data.authenticated,
						user: data.user || null,
						loading: false
					});
				} else {
					set({
						authenticated: false,
						user: null,
						loading: false
					});
				}
			} catch (error) {
				set({
					authenticated: false,
					user: null,
					loading: false
				});
			}
		},
		logout: async () => {
			await fetch('/api/auth/logout', { method: 'POST' });
			set({
				authenticated: false,
				user: null,
				loading: false
			});
		},
		login: () => {
			const currentPath = window.location.pathname;
			const returnUrl =
				currentPath === '/stat' || currentPath.startsWith('/stat') ? '/stat' : '/formatt';
			window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
		}
	};
}

export const auth = createAuthStore();
