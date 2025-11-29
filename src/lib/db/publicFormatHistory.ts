import { getPool } from './database';

export interface PublicFormatRecord {
	fileName: string;
	originalSize: number;
	formattedSize: number;
	formattedBase64: string;
	timestamp: string;
}

export async function savePublicFormatRecord(params: {
	userKey: string;
	fileName: string;
	originalSize: number;
	formattedSize: number;
	formattedBase64: string;
}): Promise<void> {
	const pool = getPool();
	if (!pool) return;
	await pool.query(
		`INSERT INTO public_format_history (user_key, file_name, original_size, formatted_size, formatted_base64)
		 VALUES ($1, $2, $3, $4, $5)`,
		[
			params.userKey,
			params.fileName,
			params.originalSize,
			params.formattedSize,
			params.formattedBase64
		]
	);
}

export async function getPublicFormatHistory(userKey: string): Promise<PublicFormatRecord[]> {
	const pool = getPool();
	if (!pool) return [];
	const result = await pool.query(
		`SELECT file_name, original_size, formatted_size, formatted_base64, created_at
		 FROM public_format_history
		 WHERE user_key = $1
		 ORDER BY created_at DESC
		 LIMIT 50`,
		[userKey]
	);

	return result.rows.map((row) => ({
		fileName: row.file_name as string,
		originalSize: row.original_size as number,
		formattedSize: row.formatted_size as number,
		formattedBase64: row.formatted_base64 as string,
		timestamp: row.created_at.toISOString()
	}));
}
