import type { FormatResponse } from '$lib/types/document';

const GOOGLE_SCRIPT_URL =
	'https://script.google.com/macros/s/AKfycbyC_cSUs-aLUddgdTSWMKqr2-X_oFEQeR6J0O6wgbX2d9Qq6_YqMw5pa87OdUKlFHYVAA/exec';

export async function formatDocument(base64: string): Promise<FormatResponse> {
	try {
		const response = await fetch(GOOGLE_SCRIPT_URL, {
			method: 'POST',
			body: base64
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
