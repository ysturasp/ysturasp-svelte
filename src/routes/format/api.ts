import type { FormatResponse } from '$lib/types/document';

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
	'https://script.google.com/macros/s/AKfycbwSJqjHcNDtqMxqMvhAVBnZgBPN2l-K84hvTe_93YyO97cCRosHSoakNmozUR8XDA4yRg/exec';

export async function formatDocument(
	base64: string,
	formatParams?: FormatParams
): Promise<FormatResponse> {
	try {
		const response = await fetch(GOOGLE_SCRIPT_URL, {
			method: 'POST',
			body: formatParams ? JSON.stringify({ file: base64, formatParams }) : base64
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
