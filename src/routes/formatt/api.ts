import type { FormatResponse } from '$lib/types/document';
import type { FormatParams } from '$lib/types/formatting';

export type { FormatParams };

export interface FormatLimit {
	can: boolean;
	reason?: string;
	remaining?: number;
}

export async function checkFormatLimit(): Promise<FormatLimit> {
	try {
		const response = await fetch('/api/format/check-limit');
		if (!response.ok) {
			return { can: false, reason: 'Ошибка проверки лимита' };
		}
		return await response.json();
	} catch (error) {
		return { can: false, reason: 'Ошибка проверки лимита' };
	}
}

export async function useFormatLimit(fileName: string): Promise<boolean> {
	try {
		const response = await fetch('/api/format/use', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fileName })
		});
		return response.ok;
	} catch (error) {
		return false;
	}
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

export async function formatDocument(
	base64: string,
	formatParams?: FormatParams,
	fileName?: string
): Promise<FormatResponse> {
	try {
		const limit = await checkFormatLimit();
		if (!limit.can) {
			return { success: false, error: limit.reason || 'Лимит форматирований исчерпан' };
		}

		if (!fileName) {
			return { success: false, error: 'Имя файла не указано' };
		}

		const used = await useFormatLimit(fileName);
		if (!used) {
			return {
				success: false,
				error: 'Не удалось зарегистрировать использование форматирования'
			};
		}

		const response = await fetch(FORMAT_API_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: formatParams
				? JSON.stringify({ file: base64, formatParams, fileName })
				: JSON.stringify({ file: base64, fileName })
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
