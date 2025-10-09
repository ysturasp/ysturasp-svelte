import type { InstituteId, Stats, Instructors } from '../types';

const STATS_URLS: Record<InstituteId, string> = {
	'btn-digital-systems':
		'https://script.google.com/macros/s/AKfycbxdL_UC__SmYJiPHmlsD4-T1ZiglPvgnehXed1OR9Qjk_fJ3rPxrVBT5Z0Zh1CiI7sC/exec',
	'btn-architecture-design':
		'https://script.google.com/macros/s/AKfycbyN0A6BDc-w1yUVLkn25J_fW7s3wpdaR6SgL6s3uBeUAfrBsxJb0pYKuWr3M03mkzGWrA/exec',
	'btn-civil-transport':
		'https://script.google.com/macros/s/AKfycbzbxLrOI2rA8ZzVfrT6RXIG5ADMl_5NdAQd8NEIYfg-qKkWVe_fGyB5pDolsCOtH14Mxw/exec',
	'btn-chemistry':
		'https://script.google.com/macros/s/AKfycbwF5HYRZ4k2Eg25VjtHgmlEznjyFOBRj2ZOqQch5z7f_mJ5rJ8LmfOzawS7Kwsv3xiZXg/exec'
};

const INSTRUCTOR_URLS: Record<InstituteId, string> = {
	'btn-digital-systems':
		'https://script.google.com/macros/s/AKfycby2mh-j-haUvit8bfirQ7fOGh-8S_VFJ3c-DvIc25XM0zgjJPcJYVgc_tEeLJ-h9aaj7w/exec',
	'btn-architecture-design':
		'https://script.google.com/macros/s/AKfycbxKdSyy9JZAlFfj8KivDJbDsWyOWy1yRzUSI2TYeGBLitVsbpBxbIAaw0sz3STy9mpu/exec',
	'btn-civil-transport':
		'https://script.google.com/macros/s/AKfycbzIby7Zm8Jk_LdtCQEPib4aYnvjqv1ucyH3a9aghfwNDu9QyMbCflmolCpd8uK-joPasw/exec',
	'btn-chemistry':
		'https://script.google.com/macros/s/AKfycbwF5HYRZ4k2Eg25VjtHgmlEznjyFOBRj2ZOqQch5z7f_mJ5rJ8LmfOzawS7Kwsv3xiZXg/exec' // temp plug prepods link for chemistry institute
};

const TOP_ANTITOP_URLS: Record<InstituteId, string> = {
	'btn-digital-systems':
		'https://script.google.com/macros/s/AKfycbwGCkkHXW776ydUQZETrk9_zYv_ZYvz7MsPQ0p0AdYNjWe8iTems3pxgdpsT7rP7-bg/exec',
	'btn-architecture-design':
		'https://script.google.com/macros/s/AKfycbzC6yVUPqlPRubATCOV5GdcgeaFj8O42DSFuOORCVSm6BMki4tW3tCdrTE65C1PoqeDcQ/exec',
	'btn-civil-transport':
		'https://script.google.com/macros/s/AKfycbz_5IGSgCYpiJ8zCx7qkwCTj2IE_IN51TlPwi5HlqYUCpnTcQegAuC3vFACV1dUnFxp/exec',
	'btn-chemistry':
		'https://script.google.com/macros/s/AKfycbyouqWIqob_4OsQki4-zx4Qk3aPS4MkrbXxU3TXucSlRPFu0j5R6RbgfBHcT5uikgUF0w/exec'
};

const REFERRAL_API_URL =
	'https://script.google.com/macros/s/AKfycbxbAl--AM5WqHdw49XNpGSNSxL4jHDEHhLD6YAgwgZQAnB4-Id0fKfyxQ--85Mljco1/exec';

export async function getSubjectStats(institute: InstituteId, discipline: string): Promise<Stats> {
	const url = `${STATS_URLS[institute]}?discipline=${encodeURIComponent(discipline)}`;
	const response = await fetch(url);
	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	return data;
}

export async function getInstructors(
	institute: InstituteId,
	subject: string
): Promise<Instructors> {
	const url = `${INSTRUCTOR_URLS[institute]}?subject=${encodeURIComponent(subject)}`;
	const response = await fetch(url);
	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	return data;
}

export async function getTopAntiTop(institute: InstituteId) {
	const response = await fetch(TOP_ANTITOP_URLS[institute]);
	const data = await response.json();

	if (data.error) {
		throw new Error(data.error);
	}

	return data;
}

export async function getIP() {
	try {
		const response = await fetch('https://api.ipify.org?format=json');
		const data = await response.json();
		return data.ip;
	} catch (error) {
		console.error('Error getting IP:', error);
		return 'unknown';
	}
}

export async function makeReferralRequest(action: string, params: any) {
	const queryParams = new URLSearchParams({
		action,
		...params
	});

	try {
		const response = await fetch(`${REFERRAL_API_URL}?${queryParams}`);
		return await response.json();
	} catch (error) {
		console.error('API request failed:', error);
		throw error;
	}
}

export function getUserId() {
	let userId = localStorage.getItem('userId');
	if (!userId) {
		userId =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		localStorage.setItem('userId', userId);
	}
	return userId;
}

export async function checkViewLimit(isCheckOnly = true) {
	try {
		const response = await makeReferralRequest('checkLimit', {
			userId: getUserId(),
			ip: await getIP(),
			isCheckOnly: isCheckOnly.toString()
		});
		return response;
	} catch (error) {
		console.error('Error checking view limit:', error);
		return { success: false, remaining: 0 };
	}
}

export async function getReferralStats() {
	try {
		const response = await makeReferralRequest('getReferrals', {
			userId: getUserId()
		});
		return {
			referralCount: response.count,
			statsLimit: response.dailyLimit
		};
	} catch (error) {
		console.error('Error getting referral stats:', error);
		return {
			referralCount: 0,
			statsLimit: 10
		};
	}
}

export async function updateReferralStats() {
	const stats = await getReferralStats();
	return stats;
}
