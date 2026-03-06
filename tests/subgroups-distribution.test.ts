import { generateSubgroupDistribution } from '../src/routes/rasp/stores/subgroups';
import type { TeacherSubgroups } from '../src/routes/rasp/stores/subgroups';
import Redis from 'ioredis';
import {
	getActualGroupsKey,
	getGroupScheduleKey,
	getInstitutesListKey
} from '../src/lib/utils/redis-keys';

type RedisClient = Redis;
type SourceMode = 'redis' | 'hybrid' | 'api';

const API_ORIGIN = process.env.TEST_SCHEDULE_API_ORIGIN || 'http://localhost:5173';

function parseArgs(argv: string[]) {
	let source: SourceMode = 'redis';
	let ttlSeconds = 604800;
	let maxRetries429 = 5;
	let retryBaseDelayMs = 750;
	let delayMs = 0;
	let writeCache = true;

	const positional: string[] = [];

	for (const arg of argv) {
		if (!arg.startsWith('-')) {
			positional.push(arg);
			continue;
		}

		if (arg === '--use-cache' || arg === '--cache' || arg === '--source=redis') {
			source = 'redis';
			continue;
		}
		if (arg === '--hybrid' || arg === '--source=hybrid') {
			source = 'hybrid';
			continue;
		}
		if (
			arg === '--refresh' ||
			arg === '--api' ||
			arg === '--source=api' ||
			arg === '--source=refresh'
		) {
			source = 'api';
			continue;
		}
		if (arg === '--no-write-cache') {
			writeCache = false;
			continue;
		}
		if (arg.startsWith('--ttl=')) {
			const v = Number(arg.slice('--ttl='.length));
			if (Number.isFinite(v) && v > 0) ttlSeconds = v;
			continue;
		}
		if (arg.startsWith('--delay-ms=')) {
			const v = Number(arg.slice('--delay-ms='.length));
			if (Number.isFinite(v) && v >= 0) delayMs = v;
			continue;
		}
		if (arg.startsWith('--retries-429=')) {
			const v = Number(arg.slice('--retries-429='.length));
			if (Number.isFinite(v) && v >= 0) maxRetries429 = v;
			continue;
		}
		if (arg.startsWith('--retry-base-ms=')) {
			const v = Number(arg.slice('--retry-base-ms='.length));
			if (Number.isFinite(v) && v > 0) retryBaseDelayMs = v;
			continue;
		}
	}

	const targetGroup = positional[0];

	return {
		source,
		targetGroup,
		ttlSeconds,
		maxRetries429,
		retryBaseDelayMs,
		delayMs,
		writeCache
	};
}

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

function createRedisClient(): RedisClient {
	const url = process.env.REDIS_URL;
	if (url) {
		return new Redis(url, {
			maxRetriesPerRequest: 3,
			enableReadyCheck: true
		});
	}

	return new Redis({
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379'),
		password: process.env.REDIS_PASSWORD || undefined,
		maxRetriesPerRequest: 3,
		enableReadyCheck: true
	});
}

async function sleep(ms: number) {
	if (ms <= 0) return;
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(
	url: string,
	{
		maxRetries429,
		retryBaseDelayMs
	}: {
		maxRetries429: number;
		retryBaseDelayMs: number;
	}
) {
	if (typeof fetch !== 'function') {
		throw new Error('Global fetch is not available in this environment');
	}

	let attempt = 0;
	while (true) {
		const response = await fetch(url);
		if (response.ok) return response.json();

		if (response.status === 429 && attempt < maxRetries429) {
			const delay = Math.min(10000, retryBaseDelayMs * Math.pow(2, attempt));
			attempt++;
			await sleep(delay);
			continue;
		}

		const text = await response.text().catch(() => '');
		throw new Error(`HTTP ${response.status} ${response.statusText} for ${url}. ${text}`);
	}
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

async function getInstitutes(redis: RedisClient): Promise<Institute[]> {
	const candidates = [getInstitutesListKey(), getActualGroupsKey()];
	for (const key of candidates) {
		const raw = await redis.get(key);
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			const items = parsed?.items;
			if (Array.isArray(items)) return items as Institute[];
		} catch {}
	}

	throw new Error(
		`Не найден список институтов/групп в Redis (ключи: ${candidates.join(
			', '
		)}). Запусти с --hybrid или --refresh чтобы заполнить кеш.`
	);
}

async function getScheduleFromRedis(
	redis: RedisClient,
	group: string
): Promise<ScheduleData | null> {
	const cacheKey = getGroupScheduleKey(group);
	const raw = await redis.get(cacheKey);
	if (!raw) return null;

	const parsed = JSON.parse(raw);
	if (parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
		// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
		delete (parsed as any).timestamp;
	}

	return parsed as ScheduleData;
}

async function getInstitutesFromRedis(redis: RedisClient): Promise<Institute[] | null> {
	const candidates = [getInstitutesListKey(), getActualGroupsKey()];
	for (const key of candidates) {
		const raw = await redis.get(key);
		if (!raw) continue;
		try {
			const parsed = JSON.parse(raw);
			const items = parsed?.items;
			if (Array.isArray(items)) return items as Institute[];
		} catch {}
	}
	return null;
}

async function getInstitutesFromApi({
	maxRetries429,
	retryBaseDelayMs
}: {
	maxRetries429: number;
	retryBaseDelayMs: number;
}): Promise<{ items: Institute[] }> {
	const url = `${API_ORIGIN}/api/schedule/institutes`;
	return fetchJsonWithRetry(url, { maxRetries429, retryBaseDelayMs });
}

async function getInstitutesFlexible({
	redis,
	source,
	writeCache,
	maxRetries429,
	retryBaseDelayMs,
	ttlSeconds
}: {
	redis: RedisClient;
	source: SourceMode;
	writeCache: boolean;
	maxRetries429: number;
	retryBaseDelayMs: number;
	ttlSeconds: number;
}): Promise<Institute[]> {
	if (source !== 'api') {
		const cached = await getInstitutesFromRedis(redis);
		if (cached) return cached;
		if (source === 'redis') {
			throw new Error(
				`Не найден список институтов/групп в Redis (ключи: ${getInstitutesListKey()}, ${getActualGroupsKey()}). Запусти с --hybrid или --refresh чтобы заполнить кеш.`
			);
		}
	}

	const data = await getInstitutesFromApi({ maxRetries429, retryBaseDelayMs });
	if (writeCache) {
		const payload = JSON.stringify(data);
		await Promise.allSettled([
			redis.set(getInstitutesListKey(), payload, 'EX', Math.min(3600, ttlSeconds)),
			redis.set(getActualGroupsKey(), payload, 'EX', Math.min(3600, ttlSeconds))
		]);
	}
	return data.items || [];
}

async function getScheduleFromApi(
	group: string,
	{
		maxRetries429,
		retryBaseDelayMs
	}: {
		maxRetries429: number;
		retryBaseDelayMs: number;
	}
): Promise<ScheduleData> {
	const url = `${API_ORIGIN}/api/schedule/group/${encodeURIComponent(group)}`;
	return fetchJsonWithRetry(url, { maxRetries429, retryBaseDelayMs });
}

async function getScheduleFlexible({
	redis,
	group,
	source,
	writeCache,
	ttlSeconds,
	maxRetries429,
	retryBaseDelayMs,
	delayMs
}: {
	redis: RedisClient;
	group: string;
	source: SourceMode;
	writeCache: boolean;
	ttlSeconds: number;
	maxRetries429: number;
	retryBaseDelayMs: number;
	delayMs: number;
}): Promise<ScheduleData | null> {
	if (source !== 'api') {
		const cached = await getScheduleFromRedis(redis, group);
		if (cached) return cached;
		if (source === 'redis') return null;
	}

	await sleep(delayMs);
	const schedule = await getScheduleFromApi(group, { maxRetries429, retryBaseDelayMs });

	if (writeCache) {
		const cacheKey = getGroupScheduleKey(group);
		const cachePayload = JSON.stringify({ ...schedule, timestamp: Date.now() });
		await redis.set(cacheKey, cachePayload, 'EX', ttlSeconds);
	}

	return schedule;
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

async function testGroup(
	redis: RedisClient,
	group: string,
	institute: string,
	opts: {
		source: SourceMode;
		writeCache: boolean;
		ttlSeconds: number;
		maxRetries429: number;
		retryBaseDelayMs: number;
		delayMs: number;
	}
): Promise<TestResult> {
	const errors: string[] = [];

	try {
		const scheduleData = await getScheduleFlexible({
			redis,
			group,
			source: opts.source,
			writeCache: opts.writeCache,
			ttlSeconds: opts.ttlSeconds,
			maxRetries429: opts.maxRetries429,
			retryBaseDelayMs: opts.retryBaseDelayMs,
			delayMs: opts.delayMs
		});

		if (!scheduleData?.items?.length) {
			return {
				group,
				institute,
				passed: true,
				errors: [
					opts.source === 'redis'
						? 'Нет данных расписания (в Redis)'
						: 'Нет данных расписания'
				]
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

async function testSingleGroup(
	redis: RedisClient,
	group: string,
	opts: {
		source: SourceMode;
		writeCache: boolean;
		ttlSeconds: number;
		maxRetries429: number;
		retryBaseDelayMs: number;
		delayMs: number;
	}
): Promise<boolean> {
	try {
		const label =
			opts.source === 'redis'
				? 'из Redis'
				: opts.source === 'hybrid'
					? 'Redis → API (если нужно)'
					: 'из API (refresh)';
		console.log(`Загрузка расписания (${label}) для ${group}...`);
		const result = await testGroup(redis, group, 'Точечная проверка', opts);

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

		return result.passed;
	} catch (error) {
		console.error('❌ Ошибка:', error);
		return false;
	}
}

async function runTests() {
	const args = parseArgs(process.argv.slice(2));
	const redis = createRedisClient();
	let exitCode = 0;
	try {
		await redis.ping();

		const opts = {
			source: args.source,
			writeCache: args.writeCache,
			ttlSeconds: args.ttlSeconds,
			maxRetries429: args.maxRetries429,
			retryBaseDelayMs: args.retryBaseDelayMs,
			delayMs: args.delayMs
		};

		if (args.targetGroup) {
			console.log(`🎯 Тестирование группы: ${args.targetGroup}\n`);
			const passed = await testSingleGroup(redis, args.targetGroup, opts);
			exitCode = passed ? 0 : 1;
			return;
		}

		console.log('🚀 Тестирование распределения подгрупп\n');

		let totalGroups = 0;
		let passedGroups = 0;
		let failedGroups = 0;
		let skippedGroups = 0;
		const failedResults: TestResult[] = [];

		const institutes = await getInstitutesFlexible({
			redis,
			source: args.source,
			writeCache: args.writeCache,
			maxRetries429: args.maxRetries429,
			retryBaseDelayMs: args.retryBaseDelayMs,
			ttlSeconds: args.ttlSeconds
		});
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

				const result = await testGroup(redis, group, institute.name, opts);

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

		exitCode = failedGroups > 0 ? 1 : 0;
	} catch (e) {
		console.error(
			'❌ Ошибка. Если это подключение к Redis — проверь REDIS_URL или REDIS_HOST/REDIS_PORT/REDIS_PASSWORD.',
			e
		);
		exitCode = 1;
	} finally {
		try {
			await redis.quit();
		} catch {}
		process.exitCode = exitCode;
	}
}

runTests();
