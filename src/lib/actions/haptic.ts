import { hapticFeedback } from '@telegram-apps/sdk-svelte';
import { settings } from '$lib/stores/settings';
import type { Settings } from '$lib/stores/settings';
import { checkIsTelegramMiniApp } from '$lib/utils/telegram';

type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

const elementTypeMap: Record<string, HapticType> = {
	'button': 'medium',
	'a[href]': 'light',
	'input[type="text"]': 'light',
	'input[type="checkbox"]': 'selection',
	'input[type="radio"]': 'selection',
	'input[type="submit"]': 'medium',
	'select': 'selection',
	'.modal': 'medium',
	'.dropdown': 'light',
	'.switch': 'selection',
	'.slider': 'light',
	'.combobox': 'light',
	'.tab': 'light',
	'.card-action': 'light',
	'.notification': 'light'
};

const classTypeMap: Record<string, HapticType> = {
	'bg-blue-600': 'medium',
	'bg-red-600': 'error',
	'bg-green-600': 'success',
	'bg-amber-500': 'warning',
	'text-blue-400': 'light',
	'rounded-xl': 'light',
	'rounded-2xl': 'light'
};

function getHapticType(element: HTMLElement): HapticType {
	for (const [selector, type] of Object.entries(elementTypeMap)) {
		if (element.matches(selector)) {
			return type;
		}
	}

	const classes = element.classList;
	for (const [className, type] of Object.entries(classTypeMap)) {
		if (classes.contains(className)) {
			return type;
		}
	}

	const role = element.getAttribute('role');
	if (role) {
		switch (role) {
			case 'button':
				return 'medium';
			case 'tab':
				return 'light';
			case 'switch':
				return 'selection';
			case 'option':
				return 'selection';
			case 'dialog':
				return 'medium';
		}
	}

	return 'light';
}

export function haptic(node: HTMLElement) {
	const isTelegram = checkIsTelegramMiniApp();
	let currentSettings: Settings;

	const unsubscribe = settings.subscribe((value) => {
		currentSettings = value;
	});

	function handleInteraction(event: Event) {
		if (!isTelegram || !currentSettings?.hapticFeedback) return;

		const type = getHapticType(node);

		if (type === 'success' || type === 'warning' || type === 'error') {
			hapticFeedback.notificationOccurred.ifAvailable(type);
		} else if (type === 'selection') {
			hapticFeedback.selectionChanged.ifAvailable();
		} else {
			hapticFeedback.impactOccurred.ifAvailable(type);
		}
	}

	node.addEventListener('click', handleInteraction);
	node.addEventListener('change', handleInteraction);

	return {
		destroy() {
			unsubscribe();
			node.removeEventListener('click', handleInteraction);
			node.removeEventListener('change', handleInteraction);
		}
	};
}
