import type { Group } from './stores';

const GROUPS_API_URL =
	'https://script.google.com/macros/s/AKfycbzJIWG-wYgdveSNMeoKtZOwZ1AkdROSU_O0Kq3PEIYRUkhukOykMYuuZMtRGmgdVX1Cdg/exec';
const AUTH_API_URL = 'https://oauth.ystuty.ru';

export async function getGroups(token: string | null): Promise<Group[]> {
	try {
		const response = await fetch(GROUPS_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain;charset=utf-8'
			},
			body: JSON.stringify({
				action: 'get_public',
				token: token ?? null
			})
		});
		return await response.json();
	} catch (error) {
		console.error('Error loading groups:', error);
		throw error;
	}
}

export async function addGroup(groupData: Omit<Group, 'id' | 'verified' | 'date'>) {
	try {
		const response = await fetch(GROUPS_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain;charset=utf-8'
			},
			body: JSON.stringify({
				action: 'add',
				group: groupData
			})
		});
		return await response.json();
	} catch (error) {
		console.error('Error adding group:', error);
		throw error;
	}
}

export async function deleteGroup(token: string) {
	try {
		const response = await fetch(GROUPS_API_URL, {
			method: 'POST',
			headers: {
				'Content-Type': 'text/plain;charset=utf-8'
			},
			body: JSON.stringify({
				action: 'delete',
				token
			})
		});
		return await response.json();
	} catch (error) {
		console.error('Error deleting group:', error);
		throw error;
	}
}

export async function checkAuth(token: string) {
	try {
		const response = await fetch(`${AUTH_API_URL}/check`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		return await response.json();
	} catch (error) {
		console.error('Error checking auth:', error);
		throw error;
	}
}

export async function logout(token: string) {
	try {
		await fetch(`${AUTH_API_URL}/logout`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${token}`
			}
		});
	} catch (error) {
		console.error('Error logging out:', error);
		throw error;
	}
}

export async function login(username: string, password: string) {
	try {
		const response = await fetch(
			`${AUTH_API_URL}/access_token?client_id=x-id&grant_type=password&scope=general:user:personal,general:mark:personal`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username, password })
			}
		);
		return await response.json();
	} catch (error) {
		console.error('Auth error:', error);
		throw error;
	}
}
