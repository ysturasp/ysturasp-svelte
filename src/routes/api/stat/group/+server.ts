import { json, type RequestHandler } from '@sveltejs/kit';
import { getGroupStats } from '$lib/db/statGrades';
import { getActualGroups } from '$lib/api/ystu';
import { FACULTY_NAME_MAP } from '$lib/constants/ystu';
import type { InstituteId } from '../../../stat/types';

export const GET: RequestHandler = async ({ url }) => {
	let institute = url.searchParams.get('institute') as InstituteId | null;
	const group = url.searchParams.get('group');

	if (!group) {
		return json({ error: 'Не указана группа' }, { status: 400 });
	}

	try {
		const { items } = await getActualGroups();
		let detectedInstitute: InstituteId | null = null;

		for (const item of items) {
			if (item.groups.includes(group)) {
				detectedInstitute = FACULTY_NAME_MAP[item.name] || null;
				if (detectedInstitute) break;
			}
		}

		if (detectedInstitute) {
			institute = detectedInstitute;
		}

		if (!institute) {
			return json(
				{ error: 'Не удалось определить институт для этой группы' },
				{ status: 400 }
			);
		}

		const data = await getGroupStats(institute, group);

		let percentile: number | null = null;
		const userAverage = url.searchParams.get('userAverage');
		if (userAverage && data.average > 0 && data.stddev > 0) {
			const x = parseFloat(userAverage);
			const mu = data.average;
			const sigma = data.stddev;

			const z = (x - mu) / sigma;
			const t = 1 / (1 + 0.2316419 * Math.abs(z));
			const d = 0.3989423 * Math.exp((-z * z) / 2);
			const p =
				d *
				t *
				(0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
			percentile = z > 0 ? 1 - p : p;
			percentile = Math.round(percentile * 100);
		}

		return json({ ...data, institute, percentile });
	} catch (error: any) {
		return json({ error: error.message }, { status: 500 });
	}
};
