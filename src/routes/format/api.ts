import type { FormatResponse } from '$lib/types/document';
import type { FormatParams } from '$lib/types/formatting';

export type { FormatParams };

function generateUserId(): string {
	return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function getUserId(): string {
	let userId = localStorage.getItem('format_user_id');
	if (!userId) {
		userId = generateUserId();
		localStorage.setItem('format_user_id', userId);
	}
	return userId;
}

export interface FormattedFile {
	timestamp: string;
	fileName: string;
	originalSize: number;
	formattedSize: number;
	sizeChange: string;
	base64: string;
}

const FORMAT_API_URL = '/api/format';

export async function getUserFiles(): Promise<FormattedFile[]> {
	try {
		const userId = getUserId();
		const response = await fetch(`${FORMAT_API_URL}?userId=${userId}`, {
			method: 'GET'
		});

		if (!response.ok) {
			throw new Error('Ошибка при получении файлов');
		}

		const data = await response.json();
		return data.files || [];
	} catch (error) {
		console.error('Ошибка при получении файлов:', error);
		return [];
	}
}

export async function formatDocument(
	base64: string,
	formatParams?: FormatParams,
	fileName?: string
): Promise<FormatResponse> {
	try {
		const userId = getUserId();
		const response = await fetch(FORMAT_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: formatParams
				? JSON.stringify({ file: base64, formatParams, fileName, userId })
				: JSON.stringify({ file: base64, fileName, userId })
		});

		if (!response.ok) {
			throw new Error('Ошибка при обработке файла');
		}

		const responseText = await response.text();

		try {
			const parsed = JSON.parse(responseText);
			if (parsed && parsed.error) {
				const type = parsed.type ? String(parsed.type) : 'Error';
				const message = parsed.message ? String(parsed.message) : 'Неизвестная ошибка';
				const at = parsed.at ? ` @ ${parsed.at}` : '';
				return { success: false, error: `${type}: ${message}${at}` };
			}
		} catch {
			return { success: true, formattedBase64: responseText };
		}

		return { success: false, error: 'Неизвестная ошибка' };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Неизвестная ошибка'
		};
	}
}
