import { generateSubgroupDistribution } from '../src/routes/rasp/stores/subgroups';
import type { TeacherSubgroups } from '../src/routes/rasp/stores/subgroups';

const API_BASE = 'https://api-ochre-eta-11.vercel.app/s/schedule/v1/schedule';

interface Institute {
	name: string;
	groups: string[];
}

interface SemesterInfo {
	id: string;
	name: string;
	folderId: string;
	timestamp: number;
	year: number;
	type: 'spring' | 'autumn';
	range: { start: Date; end: Date };
}

interface Lesson {
	type: number;
	lessonName: string;
	teacherName: string;
	additionalTeacherName?: string;
	isDivision?: boolean;
	timeRange: string;
	startAt: string;
	endAt: string;
}

interface Day {
	info: { date: string };
	lessons: Lesson[];
}

interface Week {
	number: number;
	days: Day[];
}

interface ScheduleData {
	items: Week[];
}

interface TestResult {
	group: string;
	institute: string;
	passed: boolean;
	errors: string[];
}

const SUBGROUP_TYPES = new Set([8, 4]);

function isSubgroupType(type: number): boolean {
	return SUBGROUP_TYPES.has(type);
}

function getCurrentSemester(): SemesterInfo {
	const now = new Date();
	const month = now.getMonth();
	const year = now.getFullYear();

	let startMonth = month >= 0 && month <= 6 ? 1 : 8;
	let type: 'spring' | 'autumn' = month >= 0 && month <= 6 ? 'spring' : 'autumn';

	const firstDay = new Date(year, startMonth, 1);
	const dayOfWeek = firstDay.getDay();
	const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	const start = new Date(year, startMonth, 1 + ((7 - daysToMonday) % 7));
	const end = new Date(start);
	end.setDate(start.getDate() + 18 * 7 - 1);

	return {
		id: `${type}-${year}`,
		name: type === 'spring' ? `Весенний ${year}` : `Осенний ${year}`,
		year,
		type,
		range: { start, end },
		folderId: '',
		timestamp: 0
	};
}

function isDateInSemester(dateString: string, semester: SemesterInfo): boolean {
	const date = new Date(dateString);
	return date >= semester.range.start && date <= semester.range.end;
}

function getWeekNumberByDate(date: Date, semester: SemesterInfo): number {
	const weeksSinceStart = Math.floor(
		(date.getTime() - semester.range.start.getTime()) / (7 * 24 * 60 * 60 * 1000)
	);
	return Math.max(1, Math.min(18, weeksSinceStart + 1));
}

async function getInstitutes(): Promise<Institute[]> {
	const response = await fetch(`${API_BASE}/actual_groups`);
	const data = await response.json();
	return data.items || [];
}

async function getSchedule(group: string): Promise<ScheduleData> {
	const response = await fetch(`${API_BASE}/group/${group}`);
	return await response.json();
}

function validateSubgroupDistribution(
	teacherSubgroups: TeacherSubgroups,
	scheduleData: ScheduleData,
	group: string
): string[] {
	const errors: string[] = [];

	const subjectStats = new Map<string, { s1: number; s2: number; teachers: Set<string> }>();

	Object.entries(teacherSubgroups).forEach(([gKey, data]) => {
		const subjectName = data.displayName;

		if (!subjectStats.has(subjectName)) {
			subjectStats.set(subjectName, { s1: 0, s2: 0, teachers: new Set() });
		}

		const stats = subjectStats.get(subjectName)!;
		stats.teachers.add(data.teacher);

		Object.values(data.dates).forEach((info) => {
			if (info.subgroup === 1) stats.s1++;
			else if (info.subgroup === 2) stats.s2++;
		});
	});

	subjectStats.forEach((stats, subjectName) => {
		const diff = Math.abs(stats.s1 - stats.s2);
		const total = stats.s1 + stats.s2;
		const teachersList = Array.from(stats.teachers).join(', ');

		if (total < 2) {
			return;
		}

		if (diff > 1 && total > 2) {
			errors.push(
				`"${subjectName}" (преп: ${teachersList}): дисбаланс подгрупп (подгр.1: ${stats.s1}, подгр.2: ${stats.s2}, разница: ${diff})`
			);
		}

		if (total > 0 && (stats.s1 === 0 || stats.s2 === 0)) {
			errors.push(
				`"${subjectName}" (преп: ${teachersList}): все занятия в одной подгруппе (подгр.1: ${stats.s1}, подгр.2: ${stats.s2})`
			);
		}
	});

	const slotMap = new Map<
		string,
		Array<{
			groupKey: string;
			subgroup: 1 | 2;
			displayName: string;
			teacher: string;
			isDivision: boolean;
		}>
	>();
	Object.entries(teacherSubgroups).forEach(([gKey, data]) => {
		Object.entries(data.dates).forEach(([dtKey, info]) => {
			if (!slotMap.has(dtKey)) slotMap.set(dtKey, []);
			slotMap.get(dtKey)!.push({
				groupKey: gKey,
				subgroup: info.subgroup,
				displayName: data.displayName,
				teacher: data.teacher,
				isDivision: data.isDivision
			});
		});
	});

	slotMap.forEach((entries, slot) => {
		const divisionEntries = entries.filter((e) => e.isDivision);

		if (divisionEntries.length >= 2) {
			const subgroups = divisionEntries.map((e) => e.subgroup);
			const uniqueSubgroups = new Set(subgroups);

			if (uniqueSubgroups.size < 2) {
				const lessons = divisionEntries
					.map((e) => `"${e.displayName}" (${e.teacher})`)
					.join(', ');
				errors.push(
					`Конфликт в слоте "${slot}": ${divisionEntries.length} занятий по подгруппам в одной подгруппе ${subgroups[0]} - ${lessons}`
				);
			}
		}
	});

	return errors;
}

async function testGroup(group: string, institute: string): Promise<TestResult> {
	const errors: string[] = [];

	try {
		const scheduleData = await getSchedule(group);

		if (!scheduleData?.items?.length) {
			return {
				group,
				institute,
				passed: true,
				errors: ['Нет данных расписания']
			};
		}

		let hasSubgroupLessons = false;
		scheduleData.items.forEach((week) => {
			week.days.forEach((day) => {
				if (day.lessons?.some((l) => isSubgroupType(l.type))) {
					hasSubgroupLessons = true;
				}
			});
		});

		if (!hasSubgroupLessons) {
			return {
				group,
				institute,
				passed: true,
				errors: ['Нет подгрупп']
			};
		}

		const semester = getCurrentSemester();
		const teacherSubgroups = generateSubgroupDistribution(scheduleData, semester);

		if (!teacherSubgroups || Object.keys(teacherSubgroups).length === 0) {
			return {
				group,
				institute,
				passed: true,
				errors: ['Нет данных для распределения']
			};
		}

		const validationErrors = validateSubgroupDistribution(
			teacherSubgroups,
			scheduleData,
			group
		);
		errors.push(...validationErrors);
	} catch (error) {
		errors.push(`Ошибка: ${error instanceof Error ? error.message : String(error)}`);
	}

	return {
		group,
		institute,
		passed: errors.length === 0,
		errors
	};
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testSingleGroup(group: string) {
	try {
		console.log(`Загрузка расписания для ${group}...`);
		const result = await testGroup(group, 'Точечная проверка');

		console.log('\n' + '='.repeat(80));
		if (
			result.errors.length === 1 &&
			(result.errors[0].includes('Нет данных') || result.errors[0].includes('Нет подгрупп'))
		) {
			console.log(`⊘ ${group}: ${result.errors[0]}`);
		} else if (result.passed) {
			console.log(`✅ ${group}: Все проверки пройдены`);
		} else {
			console.log(`❌ ${group}: Найдено ${result.errors.length} ошибок\n`);
			result.errors.forEach((error, i) => {
				console.log(`${i + 1}. ${error}`);
			});
		}
		console.log('='.repeat(80));

		process.exit(result.passed ? 0 : 1);
	} catch (error) {
		console.error('❌ Ошибка:', error);
		process.exit(1);
	}
}

async function runTests() {
	const targetGroup = process.argv[2];

	if (targetGroup) {
		console.log(`🎯 Тестирование группы: ${targetGroup}\n`);
		await testSingleGroup(targetGroup);
		return;
	}

	console.log('🚀 Тестирование распределения подгрупп\n');

	let totalGroups = 0;
	let passedGroups = 0;
	let failedGroups = 0;
	let skippedGroups = 0;
	let requestCount = 0;
	const failedResults: TestResult[] = [];

	try {
		const institutes = await getInstitutes();
		console.log(`📚 Институтов: ${institutes.length}\n`);

		for (const institute of institutes) {
			if (
				institute.name === 'Заочная форма обучения' ||
				institute.name === 'Заочный форма обучения (отделение УОП)' ||
				institute.name === 'Институт Магии и Игр' ||
				institute.name.toLowerCase().includes('заочн')
			) {
				console.log(`\n⊘ ${institute.name} - пропущен`);
				skippedGroups += institute.groups.length;
				totalGroups += institute.groups.length;
				continue;
			}

			console.log(`\n📖 ${institute.name} (${institute.groups.length} групп)`);

			let institutePassedCount = 0;
			let instituteFailedCount = 0;
			let instituteSkippedCount = 0;

			for (const group of institute.groups) {
				totalGroups++;
				requestCount++;

				if (requestCount % 5 === 0) {
					console.log(` [⏸️ пауза 15с после ${requestCount} запросов]`);
					await sleep(15000);
				}

				const result = await testGroup(group, institute.name);

				if (
					result.errors.length === 1 &&
					(result.errors[0].includes('Нет данных') ||
						result.errors[0].includes('Нет подгрупп'))
				) {
					skippedGroups++;
					instituteSkippedCount++;
					console.log(`  ⊘ ${group} - ${result.errors[0]}`);
				} else if (result.passed) {
					passedGroups++;
					institutePassedCount++;
					console.log(`  ✓ ${group}`);
				} else {
					failedGroups++;
					instituteFailedCount++;
					failedResults.push(result);
					console.log(`  ✗ ${group} - ${result.errors.length} ошибок:`);
					result.errors.forEach((error, i) => {
						console.log(`     ${i + 1}. ${error}`);
					});
				}
			}

			console.log(
				`\n  ✅ ${institutePassedCount} | ❌ ${instituteFailedCount} | ⊘ ${instituteSkippedCount}`
			);
		}

		console.log('\n' + '='.repeat(80));
		console.log('📊 ИТОГО:');
		console.log('='.repeat(80));
		console.log(`Всего: ${totalGroups}`);
		console.log(
			`✅ Пройдено: ${passedGroups} (${((passedGroups / totalGroups) * 100).toFixed(1)}%)`
		);
		console.log(
			`❌ Провалено: ${failedGroups} (${((failedGroups / totalGroups) * 100).toFixed(1)}%)`
		);
		console.log(
			`⊘ Пропущено: ${skippedGroups} (${((skippedGroups / totalGroups) * 100).toFixed(1)}%)`
		);
		console.log('='.repeat(80));

		if (failedResults.length > 0) {
			console.log('\n' + '='.repeat(80));
			console.log('❌ ДЕТАЛИ ОШИБОК:');
			console.log('='.repeat(80));

			failedResults.forEach((result) => {
				console.log(`\n🔴 ${result.institute} - ${result.group}:`);
				result.errors.forEach((error) => {
					console.log(`   • ${error}`);
				});
			});
		}

		process.exit(failedGroups > 0 ? 1 : 0);
	} catch (error) {
		console.error('\n❌ Ошибка:', error);
		process.exit(1);
	}
}

runTests();
