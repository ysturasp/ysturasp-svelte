import { browser } from '$app/environment';

export interface PrivacySettings {
	hideEmail: boolean;
	hideName: boolean;
	hideAvatar: boolean;
}

const defaultPrivacySettings: PrivacySettings = {
	hideEmail: false,
	hideName: false,
	hideAvatar: false
};

export function loadPrivacySettings(): PrivacySettings {
	if (!browser) return defaultPrivacySettings;
	const stored = localStorage.getItem('privacy_settings');
	return stored ? { ...defaultPrivacySettings, ...JSON.parse(stored) } : defaultPrivacySettings;
}

export function savePrivacySettings(settings: PrivacySettings) {
	if (!browser) return;
	localStorage.setItem('privacy_settings', JSON.stringify(settings));
}

export function maskEmail(email: string): string {
	if (!email) return '••••••••';
	const [local, domain] = email.split('@');
	if (!domain) return '••••••••';
	const maskedLocal =
		local.length > 2
			? local[0] + '•'.repeat(Math.min(local.length - 2, 5)) + local[local.length - 1]
			: '•'.repeat(local.length);
	return `${maskedLocal}@${domain}`;
}

export function maskName(name: string | null): string {
	if (!name) return 'Пользователь';
	if (name.length <= 2) return '•'.repeat(name.length);
	return name[0] + '•'.repeat(Math.min(name.length - 2, 8)) + name[name.length - 1];
}
