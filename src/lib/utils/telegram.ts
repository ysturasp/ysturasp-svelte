import { browser } from '$app/environment';
import { retrieveLaunchParams } from '@tma.js/sdk-svelte';

export function checkIsTelegramMiniApp(): boolean {
	if (!browser) return false;

	try {
		retrieveLaunchParams();
		return true;
	} catch {
		if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
			return true;
		}
		return false;
	}
}
