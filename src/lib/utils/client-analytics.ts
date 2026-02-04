export async function trackClientEvent(
	eventType: string,
	payload?: Record<string, unknown>
): Promise<void> {
	try {
		const response = await fetch('/api/analytics/track', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				eventType,
				payload
			})
		});

		if (!response.ok) {
			console.warn('[Analytics] Failed to track event:', eventType);
		}
	} catch (error) {
		console.warn('[Analytics] Error tracking event:', error);
	}
}

export function trackButtonClick(buttonName: string, context?: Record<string, unknown>) {
	trackClientEvent('button:click', {
		buttonName,
		...context
	});
}

export function trackModalOpen(modalName: string) {
	trackClientEvent('modal:open', {
		modalName
	});
}

export function trackSearch(searchType: string, query: string) {
	trackClientEvent('search:query', {
		searchType,
		query: query.slice(0, 100)
	});
}

export function trackPageView(pagePath: string) {
	trackClientEvent('page:view', {
		path: pagePath
	});
}

export function trackExport(exportType: string, format: string) {
	trackClientEvent('export:file', {
		exportType,
		format
	});
}

export function trackShare(shareType: string, platform?: string) {
	trackClientEvent('share:action', {
		shareType,
		platform
	});
}

export function trackError(errorType: string, message: string, context?: Record<string, unknown>) {
	trackClientEvent('error:encountered', {
		errorType,
		message: message.slice(0, 200),
		...context
	});
}
