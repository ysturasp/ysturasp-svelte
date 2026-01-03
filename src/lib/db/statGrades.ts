import { getPool } from './database';
import type { InstituteId } from '../../routes/stat/types';

const INSTITUTE_TO_TABLE: Record<InstituteId, string> = {
	'btn-digital-systems': 'ids',
	'btn-architecture-design': 'iad',
	'btn-civil-transport': 'icst',
	'btn-chemistry': 'icht',
	'btn-economics-management': 'iem',
	'btn-engineering-machinery': 'iemm'
};

export function getGradesTableName(institute: InstituteId): string {
	const shortName = INSTITUTE_TO_TABLE[institute];
	if (!shortName) {
		throw new Error(`Неизвестный институт: ${institute}`);
	}
	const tableName = `grades_${shortName}`;
	if (!/^grades_[a-z]+$/.test(tableName)) {
		throw new Error(`Некорректное имя таблицы: ${tableName}`);
	}
	return tableName;
}

export async function getSubjectStats(
	institute: InstituteId,
	discipline: string
): Promise<{
	average: number;
	count5: number;
	count4: number;
	count3: number;
	count2: number;
	totalCount: number;
	byCourse: Array<{ course: number; average: number; count: number }>;
	bySemester: Array<{ semester: number; average: number; count: number }>;
	byControlType: Array<{ controlType: string; average: number; count: number }>;
	inDiplomaCount: number;
	inDiplomaPercent: number;
	topGroups: Array<{ groupName: string; average: number; count: number }>;
}> {
	const pool = getPool();
	if (!pool) {
		throw new Error('База данных не доступна');
	}

	const tableName = getGradesTableName(institute);

	const tableExists = await pool.query(
		`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)
	`,
		[tableName]
	);

	if (!tableExists.rows[0]?.exists) {
		return {
			average: 0,
			count5: 0,
			count4: 0,
			count3: 0,
			count2: 0,
			totalCount: 0,
			byCourse: [],
			bySemester: [],
			byControlType: [],
			inDiplomaCount: 0,
			inDiplomaPercent: 0,
			topGroups: []
		};
	}

	const mainStats = await pool.query(
		`
		SELECT 
			COUNT(*) FILTER (WHERE grade_numeric = 5) as count5,
			COUNT(*) FILTER (WHERE grade_numeric = 4) as count4,
			COUNT(*) FILTER (WHERE grade_numeric = 3) as count3,
			COUNT(*) FILTER (WHERE grade_numeric = 2) as count2,
			COUNT(*) FILTER (WHERE grade_numeric IS NOT NULL) as total_count,
			AVG(grade_numeric) FILTER (WHERE grade_numeric IS NOT NULL) as average,
			COUNT(*) FILTER (WHERE in_diploma = true AND grade_numeric IS NOT NULL) as in_diploma_count
		FROM "${tableName}"
		WHERE subject = $1
		AND grade_numeric IS NOT NULL
	`,
		[discipline]
	);

	const mainRow = mainStats.rows[0];
	const totalCount = parseInt(mainRow.total_count || '0', 10);
	const inDiplomaCount = parseInt(mainRow.in_diploma_count || '0', 10);

	const byCourseResult = await pool.query(
		`
		SELECT 
			course,
			AVG(grade_numeric) as average,
			COUNT(*) as count
		FROM "${tableName}"
		WHERE subject = $1
		AND grade_numeric IS NOT NULL
		GROUP BY course
		ORDER BY course ASC
	`,
		[discipline]
	);

	const bySemesterResult = await pool.query(
		`
		SELECT 
			semester,
			AVG(grade_numeric) as average,
			COUNT(*) as count
		FROM "${tableName}"
		WHERE subject = $1
		AND grade_numeric IS NOT NULL
		GROUP BY semester
		ORDER BY semester ASC
	`,
		[discipline]
	);

	const byControlTypeResult = await pool.query(
		`
		SELECT 
			control_type,
			AVG(grade_numeric) as average,
			COUNT(*) as count
		FROM "${tableName}"
		WHERE subject = $1
		AND grade_numeric IS NOT NULL
		AND control_type IS NOT NULL
		AND control_type != ''
		GROUP BY control_type
		ORDER BY count DESC, average DESC
	`,
		[discipline]
	);

	const topGroupsResult = await pool.query(
		`
		SELECT 
			group_name,
			AVG(grade_numeric) as average,
			COUNT(*) as count
		FROM "${tableName}"
		WHERE subject = $1
		AND grade_numeric IS NOT NULL
		GROUP BY group_name
		HAVING COUNT(*) >= 3
		ORDER BY average DESC, count DESC
		LIMIT 10
	`,
		[discipline]
	);

	return {
		average: parseFloat(mainRow.average || '0') || 0,
		count5: parseInt(mainRow.count5 || '0', 10),
		count4: parseInt(mainRow.count4 || '0', 10),
		count3: parseInt(mainRow.count3 || '0', 10),
		count2: parseInt(mainRow.count2 || '0', 10),
		totalCount,
		byCourse: byCourseResult.rows.map((row) => ({
			course: parseInt(row.course || '0', 10),
			average: parseFloat(row.average || '0') || 0,
			count: parseInt(row.count || '0', 10)
		})),
		bySemester: bySemesterResult.rows.map((row) => ({
			semester: parseInt(row.semester || '0', 10),
			average: parseFloat(row.average || '0') || 0,
			count: parseInt(row.count || '0', 10)
		})),
		byControlType: byControlTypeResult.rows.map((row) => ({
			controlType: row.control_type || '',
			average: parseFloat(row.average || '0') || 0,
			count: parseInt(row.count || '0', 10)
		})),
		inDiplomaCount,
		inDiplomaPercent: totalCount > 0 ? Math.round((inDiplomaCount / totalCount) * 100) : 0,
		topGroups: topGroupsResult.rows.map((row) => ({
			groupName: row.group_name || '',
			average: parseFloat(row.average || '0') || 0,
			count: parseInt(row.count || '0', 10)
		}))
	};
}

export async function getInstructors(
	institute: InstituteId,
	subject: string
): Promise<{ teachers: string[] }> {
	const pool = getPool();
	if (!pool) {
		throw new Error('База данных не доступна');
	}

	const tableName = getGradesTableName(institute);

	const tableExists = await pool.query(
		`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)
	`,
		[tableName]
	);

	if (!tableExists.rows[0]?.exists) {
		return { teachers: [] };
	}

	const result = await pool.query(
		`
		SELECT DISTINCT control_type
		FROM "${tableName}"
		WHERE subject = $1
		AND control_type IS NOT NULL
		AND control_type != ''
		ORDER BY control_type
	`,
		[subject]
	);

	const teachers = result.rows.map((row) => row.control_type).filter(Boolean);

	return { teachers: teachers.length > 0 ? [teachers.join(', ')] : [] };
}

export async function getTopAntiTop(institute: InstituteId): Promise<{
	top10: Array<{ position: number; subject: string; average: number; count: number }>;
	antitop10: Array<{ position: number; subject: string; average: number; count: number }>;
}> {
	const pool = getPool();
	if (!pool) {
		throw new Error('База данных не доступна');
	}

	const tableName = getGradesTableName(institute);

	const tableExists = await pool.query(
		`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)
	`,
		[tableName]
	);

	if (!tableExists.rows[0]?.exists) {
		return { top10: [], antitop10: [] };
	}

	const result = await pool.query(
		`
		SELECT 
			subject,
			AVG(grade_numeric) as average,
			COUNT(*) as count
		FROM "${tableName}"
		WHERE grade_numeric IS NOT NULL
		GROUP BY subject
		HAVING COUNT(*) >= 5
		ORDER BY average DESC, count DESC
	`
	);

	const subjects = result.rows.map((row, index) => ({
		position: index + 1,
		subject: row.subject,
		average: parseFloat(row.average || '0') || 0,
		count: parseInt(row.count || '0', 10)
	}));

	const top10 = subjects.slice(0, 10);
	const antitop10 = subjects
		.slice(-10)
		.reverse()
		.map((item, index) => ({
			...item,
			position: index + 1
		}));

	return { top10, antitop10 };
}

export async function getDisciplines(institute: InstituteId): Promise<string[]> {
	const pool = getPool();
	if (!pool) {
		throw new Error('База данных не доступна');
	}

	const tableName = getGradesTableName(institute);

	const tableExists = await pool.query(
		`
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'public' 
			AND table_name = $1
		)
	`,
		[tableName]
	);

	if (!tableExists.rows[0]?.exists) {
		return [];
	}

	const result = await pool.query(
		`
		SELECT DISTINCT subject
		FROM "${tableName}"
		WHERE subject IS NOT NULL
		AND subject != ''
		AND grade_numeric IS NOT NULL
		ORDER BY subject ASC
	`
	);

	return result.rows.map((row) => row.subject).filter(Boolean);
}
