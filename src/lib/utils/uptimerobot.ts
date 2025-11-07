export interface UptimeRobotMonitor {
	'monitorId': number;
	'createdAt': string;
	'statusClass': 'success' | 'danger' | 'warning';
	'name': string;
	'url': string | null;
	'type': string;
	'groupId': number;
	'groupName': string;
	'dailyRatios': Array<{
		date: string;
		ratio: string;
		label: string;
		color: string;
	}>;
	'30dRatio': {
		ratio: string;
		label: string;
		color: string;
	};
	'90dRatio': {
		ratio: string;
		label: string;
		color: string;
	};
	'ratio': {
		ratio: string;
		label: string;
		color: string;
	};
	'hasIncidentComments': boolean;
}

export interface UptimeRobotResponse {
	status: string;
	data: UptimeRobotMonitor[];
	statistics: {
		uptime: {
			l1: { label: string; ratio: string };
			l7: { label: string; ratio: string };
			l30: { label: string; ratio: string };
			l90: { label: string; ratio: string };
		};
		latest_downtime: string | null;
		counts: {
			up: number;
			down: number;
			paused: number;
			total: number;
		};
		count_result: string;
	};
}

export async function checkServiceStatus(): Promise<UptimeRobotResponse | null> {
	try {
		const timestamp = Date.now();
		const url = `https://stats.uptimerobot.com/api/getMonitorList/COz2FUGsub?page=1&_=${timestamp}`;

		console.log('Fetching service status from:', url);

		const response = await fetch(url, {
			method: 'GET',
			headers: {
				'accept': 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
				'cache-control': 'no-cache',
				'referer': 'https://stats.uptimerobot.com/COz2FUGsub',
				'x-requested-with': 'XMLHttpRequest'
			},
			mode: 'cors',
			credentials: 'omit'
		});

		console.log('Response status:', response.status, response.statusText);

		if (!response.ok) {
			console.error('Failed to fetch service status:', response.status, response.statusText);
			const text = await response.text();
			console.error('Response text:', text);
			return null;
		}

		const data: UptimeRobotResponse = await response.json();
		console.log('Parsed data:', data);
		console.log('Data status:', data.status);
		console.log('Data length:', data.data?.length);
		console.log('Statistics:', data.statistics);

		return data;
	} catch (error) {
		console.error('Error checking service status:', error);
		if (error instanceof Error) {
			console.error('Error message:', error.message);
			console.error('Error stack:', error.stack);
		}
		return null;
	}
}

export function getDownServices(data: UptimeRobotResponse): UptimeRobotMonitor[] {
	return data.data.filter((monitor) => monitor.statusClass === 'danger');
}
