import type { InstituteId, Stats, Instructors, ReferralStats } from '../types';

export async function getSubjectStats(institute: InstituteId, discipline: string): Promise<Stats> {
	const url = `/api/stat/subject?institute=${encodeURIComponent(institute)}&discipline=${encodeURIComponent(discipline)}`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Ошибка при получении статистики');
	}

	const data = await response.json();
	return data;
}

export async function getInstructors(
	institute: InstituteId,
	subject: string
): Promise<Instructors> {
	const url = `/api/stat/instructors?institute=${encodeURIComponent(institute)}&subject=${encodeURIComponent(subject)}`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Ошибка при получении преподавателей');
	}

	const data = await response.json();
	return data;
}

export async function getTopAntiTop(
	institute: InstituteId,
	filters: { course?: number; minGrades?: number } = {}
) {
	let url = `/api/stat/rating?institute=${encodeURIComponent(institute)}`;
	if (filters.course) url += `&course=${filters.course}`;
	if (filters.minGrades) url += `&minGrades=${filters.minGrades}`;

	const response = await fetch(url);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Ошибка при получении данных');
	}

	const data = await response.json();
	return data;
}

export async function checkViewLimit(isCheckOnly = true) {
	try {
		if (isCheckOnly) {
			const response = await fetch('/api/stat/views');
			if (!response.ok) {
				return { success: false, remaining: 0 };
			}
			const data = await response.json();
			return {
				success: data.remaining > 0,
				remaining: data.remaining,
				monthlyLimit: data.monthlyLimit
			};
		} else {
			return { success: false, remaining: 0 };
		}
	} catch (error) {
		console.error('Error checking view limit:', error);
		return { success: false, remaining: 0 };
	}
}

export async function registerView(discipline: string, institute: string) {
	try {
		const response = await fetch('/api/stat/views', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ discipline, institute })
		});

		if (!response.ok) {
			const data = await response.json();
			return {
				success: false,
				error: data.error || 'Ошибка при регистрации просмотра',
				remaining: 0
			};
		}

		const data = await response.json();
		return {
			success: data.success,
			remaining: data.remaining,
			monthlyLimit: data.monthlyLimit
		};
	} catch (error) {
		console.error('Error registering view:', error);
		return { success: false, remaining: 0 };
	}
}

export async function getReferralStats(): Promise<ReferralStats> {
	try {
		const response = await fetch('/api/stat/referrals');
		if (!response.ok) {
			return {
				referralCount: 0,
				statsLimit: 10,
				history: [],
				leaderboard: []
			};
		}
		const data = await response.json();
		return {
			referralCount: data.referralCount || 0,
			statsLimit: data.monthlyLimit || 10,
			history: data.history || [],
			leaderboard: data.leaderboard || []
		};
	} catch (error) {
		console.error('Error getting referral stats:', error);
		return {
			referralCount: 0,
			statsLimit: 10,
			history: [],
			leaderboard: []
		};
	}
}

export async function updateReferralStats() {
	return await getReferralStats();
}

export function getUserId() {
	return null;
}

export async function registerReferral(referralCode: string) {
	try {
		const response = await fetch(`/api/stat/register-referral?ref=${referralCode}`, {
			method: 'POST'
		});
		return await response.json();
	} catch (error) {
		console.error('Error registering referral:', error);
		return { success: false };
	}
}

export async function getDisciplines(institute: InstituteId): Promise<string[]> {
	const url = `/api/stat/disciplines?institute=${encodeURIComponent(institute)}`;
	const response = await fetch(url);

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || 'Ошибка при получении списка дисциплин');
	}

	const data = await response.json();
	return Array.isArray(data) ? data : [];
}
