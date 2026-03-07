export const API_FETCH_TIMEOUT_MS = 1000;

export async function fetchWithTimeout(
	fetchFn: typeof fetch,
	url: string,
	options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
	const { timeoutMs = API_FETCH_TIMEOUT_MS, ...fetchOptions } = options;
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const response = await fetchFn(url, {
			...fetchOptions,
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		return response;
	} catch (e) {
		clearTimeout(timeoutId);
		throw e;
	}
}
