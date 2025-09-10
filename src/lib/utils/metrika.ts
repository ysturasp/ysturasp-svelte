import { browser } from '$app/environment';

export const METRIKA_ID = 97705826;

export function reachGoal(name: string, params?: Record<string, unknown>) {
	if (!browser) return;
	try {
		(window as any).ym?.(METRIKA_ID, 'reachGoal', name, params);
	} catch {}
}
