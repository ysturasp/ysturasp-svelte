import { browser } from '$app/environment';
import { retrieveLaunchParams } from '@tma.js/sdk-svelte';

let isTelegramMiniApp: boolean | null = null;

export function checkIsTelegramMiniApp(): boolean {
	if (!browser) return false;

	if (isTelegramMiniApp !== null) {
		return isTelegramMiniApp;
	}

	try {
		retrieveLaunchParams();
		isTelegramMiniApp = true;
		return true;
	} catch {
		isTelegramMiniApp = false;
		return false;
	}
}
