import type { FormatResponse } from '$lib/types/document';

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

export async function getUserFiles(): Promise<FormattedFile[]> {
	try {
		const userId = getUserId();
		const response = await fetch(`${GOOGLE_SCRIPT_URL}?userId=${userId}`, {
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

export interface FormatParams {
	margins: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	text: {
		font: string;
		size: number;
		indent: number;
		lineHeight: number;
	};
	headers: {
		h1: { spacingBefore: number; spacingAfter: number };
		h2: { spacingBefore: number; spacingAfter: number };
		h3: { spacingBefore: number; spacingAfter: number };
	};
}

const GOOGLE_SCRIPT_URL =
	'https://script.google.com/macros/s/AKfycbwxghJ_mDSQpozD5aDOrhCCpLK-Z9Q07i7NgUYFwOPddi23L2kthzOsvbCM8zaKubvVGQ/exec';

export async function formatDocument(
	base64: string,
	formatParams?: FormatParams,
	fileName?: string
): Promise<FormatResponse> {
	try {
		const userId = getUserId();
		const response = await fetch(GOOGLE_SCRIPT_URL, {
			method: 'POST',
			body: formatParams
				? JSON.stringify({ file: base64, formatParams, fileName, userId })
				: JSON.stringify({ file: base64, fileName, userId })
		});

		if (!response.ok) {
			throw new Error('Ошибка при обработке файла');
		}

		const responseText = await response.text();

		try {
			const errorResponse = JSON.parse(responseText);
			if (errorResponse.error) {
				return { success: false, error: errorResponse.error };
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
