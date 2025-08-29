import { json } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

interface FileInfo {
	id: string;
	name: string;
}

interface CourseInfo {
	name: string;
	number: string;
	course: number;
	startDate: string | null;
}

interface Direction {
	id: string;
	name: string;
	courses: Record<string, CourseInfo>;
}

interface SemesterInfo {
	id: string;
	name: string;
	folderId: string;
	timestamp: number;
}

let cache: {
	data: any;
	timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000;

const API_URL = 'https://drive.google.com';
const API_VK_URL = 'https://vk.com/al_wall.php';

function getSemesterInfo(timestamp: number): SemesterInfo {
	const date = new Date(timestamp * 1000);
	const month = date.getMonth() + 1;
	const year = date.getFullYear();
	const isSpringSemester = month >= 1 && month <= 6;

	return {
		id: `${isSpringSemester ? 'spring' : 'autumn'}-${year}`,
		name: `${isSpringSemester ? 'Весенний' : 'Осенний'} ${year}`,
		folderId: '',
		timestamp
	};
}

async function getFolderContents(folderId: string): Promise<FileInfo[]> {
	try {
		const response = await fetch(`${API_URL}/drive/folders/${folderId}`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'
			}
		});
		if (!response.ok) {
			console.error(
				`Ошибка загрузки папки ${folderId}:`,
				response.status,
				response.statusText
			);
			return [];
		}
		const html = await response.text();

		const files: FileInfo[] = [];
		const regex = /data-id="([^"]+)".*?KL4NAf.*?>([^<]+)\.xlsx/g;
		let match;

		while ((match = regex.exec(html)) !== null) {
			files.push({
				id: match[1],
				name: match[2]
			});
		}

		return files;
	} catch (error) {
		console.error(`Ошибка при получении содержимого папки ${folderId}:`, error);
		return [];
	}
}

async function getFileContent(fileId: string): Promise<ArrayBuffer | null> {
	try {
		const response = await fetch(`${API_URL}/uc?id=${fileId}&export=download`, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)'
			}
		});
		if (!response.ok) {
			console.error(`Ошибка загрузки файла ${fileId}:`, response.status, response.statusText);
			return null;
		}
		return response.arrayBuffer();
	} catch (error) {
		console.error(`Ошибка при загрузке файла ${fileId}:`, error);
		return null;
	}
}

function parseGroupInfo(
	groupName: string,
	headerDate?: string
): { number: string; course: number; startDate: string | null } {
	let startDate = null;
	let groupNumber = null;
	let courseNumber = null;

	const fullMatch = groupName.match(/(\d+)\s*\((\d+)\s*курс\)\s*с\s*(\d{2}\.\d{2}\.\d{4})/);
	if (fullMatch) {
		groupNumber = fullMatch[1];
		courseNumber = parseInt(fullMatch[2]);
		startDate = fullMatch[3];
	} else {
		const simpleMatch = groupName.match(/(\d+)\s*\((\d+)\s*курс\)/);
		if (simpleMatch) {
			groupNumber = simpleMatch[1];
			courseNumber = parseInt(simpleMatch[2]);
		} else {
			const numberMatch = groupName.match(/^(\d{4,5})/);
			if (numberMatch) {
				groupNumber = numberMatch[1];
				courseNumber = 1;
			}
		}
	}

	if (!startDate && groupNumber && groupNumber.match(/^9[34]/)) {
		const headerDateMatch = headerDate?.match(/с\s*(\d{2}\.\d{2}\.\d{4})/);
		if (headerDateMatch) {
			startDate = headerDateMatch[1];
		}
	}

	return {
		number: groupNumber || '',
		course: courseNumber || 1,
		startDate
	};
}

const DIRECTION_NAMES: Record<string, string> = {
	'ЭкиУпр': 'Экономика и управление',
	'Доп.обр': 'Дополнительное образование',
	'Маг.1 курс': 'Магистратура 1 курс',
	'Маг.2 курс': 'Магистратура 2 курс',
	'Мол.пол': 'Молодежная политика и социальное проектирование',
	'Обр.инж.': 'Образовательный инжиниринг',
	'ОрВДиМП': 'Организация ВР, Маркетинг и бренд-менеджмент',
	'Марк.и бренд-менед.': 'Организация ВР, Маркетинг и бренд-менеджмент',
	'ПиСП': 'Психология и социальная педагогика',
	'Пс.обр.': 'Психология образования',
	'Пс.РиВЛ': 'Психология развития и воспитания личности',
	'Соц.-прав.защ.нас.': 'Социально-правовая защита населения',
	'Мол.пол, Соц.-прав.защ.': 'Молодежная политика и социальное проектирование'
};

function normalizeDirectionName(name: string): string {
	if (DIRECTION_NAMES[name]) {
		return DIRECTION_NAMES[name];
	}

	for (const [short, full] of Object.entries(DIRECTION_NAMES)) {
		if (name.includes(short)) {
			return full;
		}
	}

	return name;
}

async function getCoursesFromFile(fileId: string): Promise<Record<string, CourseInfo>> {
	try {
		const buffer = await getFileContent(fileId);
		if (!buffer) {
			console.error(`Не удалось получить содержимое файла ${fileId}`);
			return {};
		}

		const workbook = XLSX.read(buffer, { type: 'array' });
		const worksheet = workbook.Sheets['Table 1'];

		if (!worksheet) {
			console.error(`Лист "Table 1" не найден в файле ${fileId}`);
			return {};
		}

		const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as Record<
			string,
			any
		>[];
		if (!rawData[2] || !rawData[3]) {
			console.error(`Некорректная структура файла ${fileId}`);
			return {};
		}

		const groups = {
			first: rawData[3]['__EMPTY_1'],
			second: rawData[3]['__EMPTY_2'],
			third: rawData[3]['__EMPTY_3'],
			fourth: rawData[3]['__EMPTY_4']
		};

		const directionHeaders = {
			first: rawData[2]['__EMPTY_1'] || '',
			second: rawData[2]['__EMPTY_2'] || '',
			third: rawData[2]['__EMPTY_3'] || '',
			fourth: rawData[2]['__EMPTY_4'] || ''
		};

		const courses: Record<string, CourseInfo> = {};

		Object.entries(groups).forEach(([course, groupName]) => {
			if (groupName) {
				const info = parseGroupInfo(
					groupName as string,
					directionHeaders[course as keyof typeof directionHeaders]
				);
				if (info.number) {
					courses[course] = {
						name: `${info.number} (${info.course} курс)`,
						number: info.number,
						course: info.course,
						startDate: info.startDate
					};
				}
			}
		});

		return courses;
	} catch (error) {
		console.error(`Ошибка при получении данных из файла ${fileId}:`, error);
		return {};
	}
}

export async function GET() {
	try {
		if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
			return json(cache.data);
		}

		const response = await fetch(`${API_VK_URL}?act=s`, {
			method: 'POST',
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'user-agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
				'x-requested-with': 'XMLHttpRequest'
			},
			body: 'act=s&al=1&inline=1&offset=0&owner_id=-21173074&owners_only=1&q=drive.google.com&search=1'
		});

		if (!response.ok) {
			throw new Error(`Ошибка запроса к VK: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const payload = data.payload[1][0];

		const folderMatches = [...payload.matchAll(/folders\\\/([a-zA-Z0-9_-]+)/g)];
		const dateMatches = [...payload.matchAll(/PostDateBlock__root.*?date&quot;:(\d+)/g)];

		const semesters: SemesterInfo[] = [];
		const schedules = await Promise.all(
			folderMatches.map(async (match, index) => {
				const folderId = match[1];
				const timestamp = dateMatches[index] ? parseInt(dateMatches[index][1]) : null;
				const date = timestamp ? new Date(timestamp * 1000) : null;
				const month = date ? date.getMonth() + 1 : null;
				const year = date ? date.getFullYear() : null;
				const semester = month ? (month >= 1 && month <= 6 ? 'spring' : 'autumn') : null;

				const semesterInfo = timestamp ? getSemesterInfo(timestamp) : null;
				if (semesterInfo) {
					semesterInfo.folderId = folderId;
					semesters.push(semesterInfo);
				}

				const files = await getFolderContents(folderId);
				const directions: Direction[] = await Promise.all(
					files.map(async (file) => {
						const courses = await getCoursesFromFile(file.id);
						return {
							id: file.id,
							name: normalizeDirectionName(file.name.replace('.xlsx', '')),
							courses
						};
					})
				);

				directions.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

				return {
					folderId,
					timestamp,
					semester,
					year,
					directions
				};
			})
		);

		semesters.sort((a, b) => b.timestamp - a.timestamp);

		const result = {
			schedules,
			semesters
		};

		cache = {
			data: result,
			timestamp: Date.now()
		};

		return json(result);
	} catch (error) {
		console.error('Ошибка при обработке запроса:', error);

		if (cache) {
			return json(cache.data);
		}

		return json(
			{
				error: 'Внутренняя ошибка сервера',
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}
