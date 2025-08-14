import { writable } from 'svelte/store';

export interface Settings {
	darkTheme: boolean;
	lowercase: boolean;
	showSubgroups: boolean;
	showAPILink: boolean;
	linearApiKey: string;
	linearApiServer: string;
	showLinearApiKey: boolean;
	modernFonts: boolean;
	hapticFeedback: boolean;
}

const defaultSettings: Settings = {
	darkTheme: true,
	lowercase: true,
	showSubgroups: true,
	showAPILink: true,
	linearApiKey: '',
	linearApiServer: 'https://api-linear-two.vercel.app',
	showLinearApiKey: false,
	modernFonts: true,
	hapticFeedback: true
};

function createSettingsStore() {
	const storedSettings =
		typeof localStorage !== 'undefined' ? localStorage.getItem('app_settings') : null;

	const initialSettings = storedSettings
		? { ...defaultSettings, ...JSON.parse(storedSettings) }
		: defaultSettings;

	const { subscribe, set, update } = writable<Settings>(initialSettings);

	return {
		subscribe,
		set: (settings: Settings) => {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('app_settings', JSON.stringify(settings));
			}
			set(settings);
		},
		update,
		reset: () => {
			if (typeof localStorage !== 'undefined') {
				localStorage.removeItem('app_settings');
			}
			set(defaultSettings);
		}
	};
}

export const settings = createSettingsStore();
