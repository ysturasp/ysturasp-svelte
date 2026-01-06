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
	academicUser: any | null;
	academicDetailedUser: any | null;
	loading: boolean;
	academicLoading: boolean;
	hasPaidService: boolean;
	isTelegram: boolean;
}

const initialState: AuthState = {
	authenticated: false,
	user: null,
	academicUser: null,
	academicDetailedUser: null,
	loading: true,
	academicLoading: true,
	hasPaidService: false,
	isTelegram: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);
	let checkAuthPromise: Promise<void> | null = null;

	const checkAuth = async () => {
		if (!browser) return;

		if (checkAuthPromise) {
			return checkAuthPromise;
		}

		checkAuthPromise = (async () => {
			update((state) => ({ ...state, loading: true }));

			try {
				const response = await fetch('/api/auth/me');
				if (response.ok) {
					const data = await response.json();
					update((state) => ({
						...state,
						authenticated: data.authenticated,
						user: data.user || null,
						hasPaidService: data.hasPaidService || false,
						isTelegram: data.isTelegram || false,
						loading: false
					}));
				} else {
					update((state) => ({
						...state,
						authenticated: false,
						user: null,
						hasPaidService: false,
						isTelegram: false,
						loading: false
					}));
				}
			} catch (error) {
				update((state) => ({
					...state,
					authenticated: false,
					user: null,
					hasPaidService: false,
					isTelegram: false,
					loading: false
				}));
			} finally {
				checkAuthPromise = null;
			}
		})();

		return checkAuthPromise;
	};

	const checkAcademic = async () => {
		if (!browser) return;
		update((state) => ({ ...state, academicLoading: true }));

		try {
			const [checkRes, detailRes] = await Promise.all([
				fetch('/api/auth/ystu/check'),
				fetch('/api/auth/ystu/user')
			]);

			let academicUser = null;
			let academicDetailedUser = null;

			if (checkRes.ok) {
				const checkData = await checkRes.json();
				academicUser = checkData.authenticated ? checkData.academicUser : null;
			}

			if (detailRes.ok) {
				academicDetailedUser = await detailRes.json();
			}

			update((state) => ({
				...state,
				academicUser,
				academicDetailedUser,
				academicLoading: false
			}));
		} catch (error) {
			update((state) => ({
				...state,
				academicUser: null,
				academicDetailedUser: null,
				academicLoading: false
			}));
		}
	};

	const logout = async () => {
		await fetch('/api/auth/logout', { method: 'POST' });
		update((state) => ({
			...state,
			authenticated: false,
			user: null,
			hasPaidService: false,
			loading: false
		}));
	};

	const logoutAcademic = async () => {
		await fetch('/api/auth/ystu/logout', { method: 'POST' });
		update((state) => ({ ...state, academicUser: null }));
	};

	const login = () => {
		const currentPath = window.location.pathname;
		const returnUrl =
			currentPath === '/stat' || currentPath.startsWith('/stat') ? '/stat' : currentPath;
		window.location.href = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`;
	};

	return {
		subscribe,
		checkAuth,
		checkAcademic,
		logout,
		logoutAcademic,
		login
	};
}

export const auth = createAuthStore();
