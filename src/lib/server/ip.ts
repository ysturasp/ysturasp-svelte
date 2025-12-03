export function getRealIp(request: Request, getClientAddress: () => string) {
	const headerOrder = [
		'cf-connecting-ip',
		'true-client-ip',
		'x-real-ip',
		'x-client-ip',
		'x-forwarded-for',
		'forwarded'
	];

	for (const name of headerOrder) {
		const value = request.headers.get(name);
		if (!value) continue;

		if (name === 'forwarded') {
			const match = value.match(/for=([^;]+)/i);
			if (match && match[1]) {
				return match[1].replace(/^"|"$/g, '');
			}
			continue;
		}

		const first = value.split(',')[0]?.trim();
		if (first) {
			return first;
		}
	}

	return getClientAddress();
}
