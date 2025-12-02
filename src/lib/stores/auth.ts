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

	const checkAuth = async () => {
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
	};

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		set({
			authenticated: false,
			user: null,
			loading: false
		});
	};

	const login = () => {
		const currentPath = window.location.pathname;
		const returnUrl =
			currentPath === '/stat' || currentPath.startsWith('/stat') ? '/stat' : '/formatt';
		window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
	};

	const loginWithCredentials = async (email: string, password: string) => {
		if (!browser) return;
		const response = await fetch('/api/auth/test', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password })
		});

		if (!response.ok) {
			let message = 'Не удалось войти';
			try {
				const payload = await response.json();
				if (typeof payload?.error === 'string') {
					message = payload.error;
				}
			} catch {}
			throw new Error(message);
		}

		await checkAuth();
	};

	return {
		subscribe,
		checkAuth,
		logout,
		login,
		loginWithCredentials
	};
}

export const auth = createAuthStore();
