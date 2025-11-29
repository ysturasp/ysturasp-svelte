import type { RequestHandler } from './$types';
import { DEFAULT_FORMAT_PARAMS } from '$lib/config/formatting';
import type { FormatParams } from '$lib/types/formatting';
import { formatDocx } from '$lib/server/formatting/docxFormatter';
import { getPublicFormatHistory, savePublicFormatRecord } from '$lib/db/publicFormatHistory';
import { getSessionContext } from '$lib/server/sessionContext';
import { useFormat, canFormat } from '$lib/db/limits';

type FormatRequestBody = {
	file?: string;
	fileName?: string;
	formatParams?: Partial<FormatParams>;
	userId?: string;
};

export const GET: RequestHandler = async ({ url }) => {
	const userId = url.searchParams.get('userId');
	if (!userId) {
		return buildErrorResponse('ID пользователя не указан', 'InvalidRequest');
	}

	try {
		const records = await getPublicFormatHistory(userId);
		return jsonResponse({
			files: records.map((record) => ({
				timestamp: record.timestamp,
				fileName: record.fileName,
				originalSize: record.originalSize,
				formattedSize: record.formattedSize,
				sizeChange: calculateSizeChange(record.originalSize, record.formattedSize),
				base64: record.formattedBase64
			}))
		});
	} catch (error) {
		console.error('Ошибка получения истории форматирования', error);
		return buildErrorResponse('Не удалось получить историю форматирования', 'HistoryError');
	}
};

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const ipAddress = getClientAddress();
	const context = await getSessionContext(cookies, { ipAddress });
	let body: FormatRequestBody;

	try {
		body = await request.json();
	} catch {
		return buildErrorResponse('Некорректное тело запроса', 'InvalidRequest');
	}

	const base64 = body?.file;
	const fileName = body?.fileName || 'document.docx';
	const publicUserId = body?.userId && body.userId !== 'authenticated' ? body.userId : null;

	if (!base64) {
		return buildErrorResponse(
			'Файл не передан',
			'InvalidRequest',
			undefined,
			publicUserId,
			fileName
		);
	}

	if (!publicUserId && !context) {
		return buildErrorResponse('ID пользователя не указан', 'InvalidRequest');
	}

	let decodedBuffer: Buffer;
	try {
		decodedBuffer = Buffer.from(base64, 'base64');
	} catch {
		return buildErrorResponse('Не удалось декодировать файл', 'DecodeError');
	}

	const mergedParams = mergeFormatParams(body.formatParams);

	if (context) {
		const can = await canFormat(context.user.id);
		if (!can.can) {
			return buildErrorResponse(
				can.reason || 'Лимит форматирований исчерпан',
				'LimitExceeded',
				undefined,
				context.user.id,
				fileName
			);
		}
	}

	try {
		const formattedBuffer = await formatDocx(decodedBuffer, mergedParams);
		const formattedBase64 = formattedBuffer.toString('base64');

		if (context) {
			const used = await useFormat(context.user.id, fileName);
			if (!used) {
				console.error('Не удалось списать форматирование после успешного форматирования', {
					userId: context.user.id,
					fileName
				});
			}
		}

		if (publicUserId) {
			await savePublicFormatRecord({
				userKey: publicUserId,
				fileName,
				originalSize: decodedBuffer.length,
				formattedSize: formattedBuffer.length,
				formattedBase64
			});
		}

		return new Response(formattedBase64, {
			headers: { 'Content-Type': 'text/plain' }
		});
	} catch (error) {
		console.error('Ошибка при форматировании документа', error);
		const message =
			error instanceof Error
				? error.message
				: 'Произошла ошибка при форматировании документа. Попробуйте снова.';
		return buildErrorResponse(
			message,
			error instanceof Error ? error.name : 'FormatError',
			error instanceof Error ? error.stack : undefined,
			publicUserId ?? context?.user.id ?? null,
			fileName
		);
	}
};

function mergeFormatParams(overrides?: Partial<FormatParams>): FormatParams {
	if (!overrides) {
		return DEFAULT_FORMAT_PARAMS;
	}

	return {
		margins: {
			top: overrides.margins?.top ?? DEFAULT_FORMAT_PARAMS.margins.top,
			right: overrides.margins?.right ?? DEFAULT_FORMAT_PARAMS.margins.right,
			bottom: overrides.margins?.bottom ?? DEFAULT_FORMAT_PARAMS.margins.bottom,
			left: overrides.margins?.left ?? DEFAULT_FORMAT_PARAMS.margins.left
		},
		text: {
			font: overrides.text?.font ?? DEFAULT_FORMAT_PARAMS.text.font,
			size: overrides.text?.size ?? DEFAULT_FORMAT_PARAMS.text.size,
			indent: overrides.text?.indent ?? DEFAULT_FORMAT_PARAMS.text.indent,
			lineHeight: overrides.text?.lineHeight ?? DEFAULT_FORMAT_PARAMS.text.lineHeight,
			removeBold: overrides.text?.removeBold ?? DEFAULT_FORMAT_PARAMS.text.removeBold,
			removeItalic: overrides.text?.removeItalic ?? DEFAULT_FORMAT_PARAMS.text.removeItalic,
			removeUnderline:
				overrides.text?.removeUnderline ?? DEFAULT_FORMAT_PARAMS.text.removeUnderline
		},
		headers: {
			h1: {
				spacingBefore:
					overrides.headers?.h1?.spacingBefore ??
					DEFAULT_FORMAT_PARAMS.headers.h1.spacingBefore,
				spacingAfter:
					overrides.headers?.h1?.spacingAfter ??
					DEFAULT_FORMAT_PARAMS.headers.h1.spacingAfter
			},
			h2: {
				spacingBefore:
					overrides.headers?.h2?.spacingBefore ??
					DEFAULT_FORMAT_PARAMS.headers.h2.spacingBefore,
				spacingAfter:
					overrides.headers?.h2?.spacingAfter ??
					DEFAULT_FORMAT_PARAMS.headers.h2.spacingAfter
			},
			h3: {
				spacingBefore:
					overrides.headers?.h3?.spacingBefore ??
					DEFAULT_FORMAT_PARAMS.headers.h3.spacingBefore,
				spacingAfter:
					overrides.headers?.h3?.spacingAfter ??
					DEFAULT_FORMAT_PARAMS.headers.h3.spacingAfter
			}
		}
	};
}

function calculateSizeChange(originalSize: number, formattedSize: number): string {
	if (originalSize === 0) {
		return '0%';
	}
	const delta = Math.round(((formattedSize - originalSize) / originalSize) * 100);
	return `${delta}%`;
}

function jsonResponse(payload: unknown): Response {
	return new Response(JSON.stringify(payload), {
		headers: { 'Content-Type': 'application/json' }
	});
}

function buildErrorResponse(
	message: string,
	type: string,
	stack?: string,
	userId?: string | null,
	fileName?: string
): Response {
	const payload: Record<string, unknown> = {
		error: true,
		message,
		type,
		at: 'api/format',
		userMessage:
			'Произошла ошибка при форматировании документа. Пожалуйста, попробуйте снова или свяжитесь с поддержкой.'
	};

	if (stack) {
		payload.stack = stack.slice(0, 5000);
	}
	if (userId) {
		payload.userId = userId;
	}
	if (fileName) {
		payload.fileName = fileName;
	}

	return jsonResponse(payload);
}
