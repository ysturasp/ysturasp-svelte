import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { YSTULesson } from '../../routes/rasp/types';
import { settings } from './settings';

export interface LinearState {
	id: string;
	name: string;
	color: string;
}

export interface LinearPriority {
	id: number;
	name: string;
	icon: string;
}

export interface LinearTask {
	id: string;
	title: string;
	description: string;
	state: LinearState;
	priority: number;
	dueDate: string | null;
	url: string;
	teamId: string;
	labels?: {
		nodes: {
			name: string;
		}[];
	};
}

interface LinearStoreState {
	apiKey: string | null;
	isConfigured: boolean;
	tasks: Record<string, LinearTask[]>;
	states: LinearState[];
	teamId: string | null;
}

let LINEAR_API_URL = 'https://api-linear-two.vercel.app/graphql';

settings.subscribe((value) => {
	LINEAR_API_URL = value.linearApiServer + '/graphql';
});

export const LINEAR_PRIORITIES: LinearPriority[] = [
	{
		id: 0,
		name: 'Нет',
		icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="7.25" width="3" height="1.5" rx="0.5" opacity="0.9"></rect>
            <rect x="6.5" y="7.25" width="3" height="1.5" rx="0.5" opacity="0.9"></rect>
            <rect x="11.5" y="7.25" width="3" height="1.5" rx="0.5" opacity="0.9"></rect>
        </svg>`
	},
	{
		id: 1,
		name: 'Срочно',
		icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 1C1.91067 1 1 1.91067 1 3V13C1 14.0893 1.91067 15 3 15H13C14.0893 15 15 14.0893 15 13V3C15 1.91067 14.0893 1 13 1H3ZM7 4L9 4L8.75391 8.99836H7.25L7 4ZM9 11C9 11.5523 8.55228 12 8 12C7.44772 12 7 11.5523 7 11C7 10.4477 7.44772 10 8 10C8.55228 10 9 10.4477 9 11Z"></path>
        </svg>`
	},
	{
		id: 2,
		name: 'Высокий',
		icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="8" width="3" height="6" rx="1"></rect>
            <rect x="6.5" y="5" width="3" height="9" rx="1"></rect>
            <rect x="11.5" y="2" width="3" height="12" rx="1"></rect>
        </svg>`
	},
	{
		id: 3,
		name: 'Средний',
		icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="8" width="3" height="6" rx="1"></rect>
            <rect x="6.5" y="5" width="3" height="9" rx="1"></rect>
            <rect x="11.5" y="2" width="3" height="12" rx="1" fill-opacity="0.4"></rect>
        </svg>`
	},
	{
		id: 4,
		name: 'Низкий',
		icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" role="img" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <rect x="1.5" y="8" width="3" height="6" rx="1"></rect>
            <rect x="6.5" y="5" width="3" height="9" rx="1" fill-opacity="0.4"></rect>
            <rect x="11.5" y="2" width="3" height="12" rx="1" fill-opacity="0.4"></rect>
        </svg>`
	}
];

async function fetchLinear(apiKey: string, query: string, variables: any = {}) {
	const response = await fetch(LINEAR_API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': apiKey
		},
		body: JSON.stringify({
			query,
			variables
		})
	});

	if (!response.ok) {
		throw new Error('Linear API request failed');
	}

	const data = await response.json();
	if (data.errors) {
		throw new Error(data.errors[0].message);
	}

	return data.data;
}

async function fetchTeamId(apiKey: string): Promise<string> {
	const query = `
        query {
            teams {
                nodes {
                    id
                    name
                }
            }
        }
    `;

	const data = await fetchLinear(apiKey, query);
	const teams = data.teams.nodes;

	if (teams.length === 0) {
		throw new Error('No teams found');
	}

	return teams[0].id;
}

async function fetchStates(apiKey: string, teamId: string): Promise<LinearState[]> {
	const query = `
        query($teamId: String!) {
            team(id: $teamId) {
                states {
                    nodes {
                        id
                        name
                        color
                    }
                }
            }
        }
    `;

	const data = await fetchLinear(apiKey, query, { teamId });
	return data.team.states.nodes;
}

function createLinearStore() {
	const { subscribe, set, update } = writable<LinearStoreState>({
		apiKey: null,
		isConfigured: false,
		tasks: {},
		states: [],
		teamId: null
	});

	const initFromLocalStorage = () => {
		if (browser) {
			const apiKey = localStorage.getItem('linearApiKey');
			const teamId = localStorage.getItem('linearTeamId');
			const states = JSON.parse(localStorage.getItem('linearStates') || '[]');

			if (apiKey && teamId) {
				update((state) => ({
					...state,
					apiKey,
					isConfigured: true,
					teamId,
					states
				}));
			}
		}
	};

	if (browser) {
		initFromLocalStorage();
	}

	return {
		subscribe,
		setApiKey: async (key: string) => {
			try {
				const teamId = await fetchTeamId(key);
				const states = await fetchStates(key, teamId);

				if (browser) {
					localStorage.setItem('linearApiKey', key);
					localStorage.setItem('linearTeamId', teamId);
					localStorage.setItem('linearStates', JSON.stringify(states));
				}

				update((state) => ({
					...state,
					apiKey: key,
					isConfigured: true,
					teamId,
					states
				}));
			} catch (error) {
				throw new Error('Failed to configure Linear integration');
			}
		},
		removeApiKey: () => {
			if (browser) {
				localStorage.removeItem('linearApiKey');
				localStorage.removeItem('linearTeamId');
				localStorage.removeItem('linearStates');
			}
			update((state) => ({
				...state,
				apiKey: null,
				isConfigured: false,
				teamId: null,
				states: []
			}));
		},
		addTask: (lessonKey: string, task: LinearTask) => {
			update((state) => {
				const tasks = { ...state.tasks };
				if (!tasks[lessonKey]) {
					tasks[lessonKey] = [];
				}
				tasks[lessonKey] = [...tasks[lessonKey], task];
				return { ...state, tasks };
			});
		},
		removeTask: (lessonKey: string, taskId: string) => {
			update((state) => {
				const tasks = { ...state.tasks };
				if (tasks[lessonKey]) {
					tasks[lessonKey] = tasks[lessonKey].filter((t) => t.id !== taskId);
				}
				return { ...state, tasks };
			});
		},
		clearTasks: (lessonKey: string) => {
			update((state) => {
				const tasks = { ...state.tasks };
				tasks[lessonKey] = [];
				return { ...state, tasks };
			});
		}
	};
}

export const linearStore = createLinearStore();

export function getLessonKey(lesson: YSTULesson, date: string): string {
	const lessonName = lesson.lessonName || 'без названия';
	return `${date}_${lessonName}_${lesson.type}_${lesson.teacherName}`;
}

export async function createLinearTask(
	apiKey: string,
	teamId: string,
	title: string,
	description: string,
	stateId?: string,
	priority?: number,
	dueDate?: string,
	subjectName?: string,
	teacherName?: string
): Promise<LinearTask> {
	let labelId: string | null = null;

	if (subjectName || (!subjectName && teacherName)) {
		const labelName = subjectName
			? `subject:${subjectName.toLowerCase().trim()}`
			: teacherName
				? `subject:без названия ${teacherName.toLowerCase().trim()}`
				: null;

		if (labelName) {
			const checkLabelQuery = `
                query GetLabel($name: String!) {
                    issueLabels(filter: { name: { eq: $name } }) {
                        nodes {
                            id
                        }
                    }
                }
            `;

			const labelData = await fetchLinear(apiKey, checkLabelQuery, {
				name: labelName
			});

			labelId = labelData.issueLabels?.nodes?.[0]?.id;

			if (!labelId) {
				const createLabelQuery = `
                    mutation CreateIssueLabel($input: IssueLabelCreateInput!) {
                        issueLabelCreate(input: $input) {
                            issueLabel {
                                id
                            }
                            success
                        }
                    }
                `;

				const createLabelData = await fetchLinear(apiKey, createLabelQuery, {
					input: {
						name: labelName,
						teamId,
						color: '#0366d6'
					}
				});

				labelId = createLabelData.issueLabelCreate?.issueLabel?.id;
			}
		}
	}

	const query = `
        mutation CreateIssue(
            $teamId: String!
            $title: String!
            $description: String!
            $stateId: String
            $priority: Int
            $dueDate: TimelessDate
            $labelIds: [String!]
        ) {
            issueCreate(
                input: {
                    teamId: $teamId
                    title: $title
                    description: $description
                    stateId: $stateId
                    priority: $priority
                    dueDate: $dueDate
                    labelIds: $labelIds
                }
            ) {
                success
                issue {
                    id
                    title
                    description
                    state {
                        id
                        name
                        color
                    }
                    priority
                    dueDate
                    url
                    labels {
                        nodes {
                            name
                        }
                    }
                }
            }
        }
    `;

	const variables = {
		teamId,
		title,
		description,
		stateId,
		priority,
		dueDate: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
		labelIds: labelId ? [labelId] : []
	};

	const data = await fetchLinear(apiKey, query, variables);
	const issue = data.issueCreate.issue;

	return {
		id: issue.id,
		title: issue.title,
		description: issue.description,
		state: issue.state,
		priority: issue.priority,
		dueDate: issue.dueDate,
		url: issue.url,
		teamId,
		labels: issue.labels
	};
}

export async function updateLinearTask(
	apiKey: string,
	taskId: string,
	updates: Partial<Omit<LinearTask, 'id' | 'url'>>
): Promise<LinearTask> {
	const query = `
        mutation UpdateIssue(
            $id: String!
            $title: String
            $description: String
            $stateId: String
            $priority: Int
            $dueDate: TimelessDate
        ) {
            issueUpdate(
                id: $id
                input: {
                    title: $title
                    description: $description
                    stateId: $stateId
                    priority: $priority
                    dueDate: $dueDate
                }
            ) {
                success
                issue {
                    id
                    title
                    description
                    state {
                        id
                        name
                        color
                    }
                    priority
                    dueDate
                    url
                    labels {
                        nodes {
                            name
                        }
                    }
                }
            }
        }
    `;

	const variables = {
		id: taskId,
		title: updates.title,
		description: updates.description,
		stateId: updates.state?.id,
		priority: updates.priority,
		dueDate: updates.dueDate ? new Date(updates.dueDate).toISOString().split('T')[0] : null
	};

	const data = await fetchLinear(apiKey, query, variables);
	const issue = data.issueUpdate.issue;

	return {
		id: issue.id,
		title: issue.title,
		description: issue.description,
		state: issue.state,
		priority: issue.priority,
		dueDate: issue.dueDate,
		url: issue.url,
		teamId: updates.teamId!,
		labels: issue.labels
	};
}

export async function deleteLinearTask(apiKey: string, taskId: string): Promise<void> {
	const query = `
        mutation DeleteIssue($id: String!) {
            issueDelete(id: $id) {
                success
            }
        }
    `;

	await fetchLinear(apiKey, query, { id: taskId });
}

export async function getAllTasks(apiKey: string): Promise<LinearTask[]> {
	const query = `
        query GetAllIssues {
            issues(filter: { labels: { name: { contains: "subject:" } } }) {
                nodes {
                    id
                    title
                    description
                    state {
                        id
                        name
                        color
                    }
                    priority
                    dueDate
                    url
                    team {
                        id
                    }
                    labels {
                        nodes {
                            name
                        }
                    }
                }
            }
        }
    `;

	const data = await fetchLinear(apiKey, query);
	return data.issues.nodes.map((issue: any) => ({
		id: issue.id,
		title: issue.title,
		description: issue.description,
		state: issue.state,
		priority: issue.priority,
		dueDate: issue.dueDate,
		url: issue.url,
		teamId: issue.team.id,
		labels: issue.labels
	}));
}
