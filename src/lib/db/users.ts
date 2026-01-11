import { getPool } from './database';
import { randomBytes } from 'crypto';

export interface User {
	id: string;
	google_id: string | null;
	telegram_id: string | null;
	email: string | null;
	name: string | null;
	picture: string | null;
	referral_code: string | null;
	createdAt: Date;
	updatedAt: Date;
	chatId?: string | null;
	username?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	state?: string | null;
	preferredGroup?: string | null;
	stateData?: Record<string, any> | null;
	isAdmin?: boolean;
}

function generateReferralCode(): string {
	return randomBytes(8).toString('base64url').substring(0, 12).toUpperCase();
}

export async function getUserByGoogleId(
	googleId: string,
	isTelegram: boolean = false
): Promise<User | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
	return result.rows[0] || null;
}

export async function getUserByTelegramId(
	telegramId: string,
	isTelegram: boolean = true
): Promise<User | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	if (isTelegram) {
		const result = await pool.query('SELECT * FROM users WHERE "chatId" = $1', [telegramId]);
		return result.rows[0] || null;
	} else {
		const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
		return result.rows[0] || null;
	}
}

export async function createUser(
	params: {
		googleId?: string;
		telegramId?: string;
		email?: string;
		name?: string;
		picture?: string;
		username?: string;
		firstName?: string;
		lastName?: string;
	},
	isTelegram: boolean = false
): Promise<User> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	if (!params.googleId && !params.telegramId) {
		throw new Error('Необходимо указать либо googleId, либо telegramId');
	}

	if (isTelegram) {
		if (params.telegramId) {
			const chatIdCheck = await pool.query('SELECT * FROM users WHERE "chatId" = $1', [
				params.telegramId
			]);
			if (chatIdCheck.rows.length > 0) {
				const existing = chatIdCheck.rows[0];

				const columnCheck = await pool.query(`
					SELECT column_name 
					FROM information_schema.columns 
					WHERE table_name='users' 
					AND column_name IN ('email', 'name', 'picture', 'username', 'firstName', 'lastName', 'updatedAt')
				`);
				const existingColumns = new Set(columnCheck.rows.map((r: any) => r.column_name));

				const updateFields: string[] = [];
				const updateParams: any[] = [];

				if (existingColumns.has('email') && params.email && !existing.email) {
					updateFields.push('email = $' + (updateParams.length + 1));
					updateParams.push(params.email);
				}

				if (existingColumns.has('name') && params.name && !existing.name) {
					updateFields.push('name = $' + (updateParams.length + 1));
					updateParams.push(params.name);
				}

				if (existingColumns.has('picture') && params.picture && !existing.picture) {
					updateFields.push('picture = $' + (updateParams.length + 1));
					updateParams.push(params.picture);
				}

				if (existingColumns.has('username') && params.username) {
					const currentUsername = (existing as any).username;
					if (
						currentUsername === null ||
						currentUsername === undefined ||
						currentUsername !== params.username
					) {
						updateFields.push('username = $' + (updateParams.length + 1));
						updateParams.push(params.username);
					}
				}

				if (existingColumns.has('firstName') && params.firstName) {
					const currentFirstName = (existing as any).firstName;
					if (
						currentFirstName === null ||
						currentFirstName === undefined ||
						currentFirstName !== params.firstName
					) {
						updateFields.push('"firstName" = $' + (updateParams.length + 1));
						updateParams.push(params.firstName);
					}
				}

				if (existingColumns.has('lastName') && params.lastName) {
					const currentLastName = (existing as any).lastName;
					if (
						currentLastName === null ||
						currentLastName === undefined ||
						currentLastName !== params.lastName
					) {
						updateFields.push('"lastName" = $' + (updateParams.length + 1));
						updateParams.push(params.lastName);
					}
				}

				if (updateFields.length > 0) {
					if (existingColumns.has('updatedAt')) {
						updateFields.push('"updatedAt" = NOW()');
					}
					updateParams.push(existing.id);
					await pool.query(
						`UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateParams.length}`,
						updateParams
					);
				}

				const updated = await pool.query('SELECT * FROM users WHERE id = $1', [
					existing.id
				]);
				return updated.rows[0];
			}
		}

		const columnCheck = await pool.query(`
			SELECT column_name 
			FROM information_schema.columns 
			WHERE table_name='users' 
			AND column_name IN ('email', 'name', 'picture', 'username', 'firstName', 'lastName')
		`);
		const existingColumns = new Set(columnCheck.rows.map((r: any) => r.column_name));

		const columns: string[] = ['"chatId"'];
		const values: any[] = [params.telegramId];

		if (existingColumns.has('email') && params.email) {
			columns.push('email');
			values.push(params.email);
		}
		if (existingColumns.has('name') && params.name) {
			columns.push('name');
			values.push(params.name);
		}
		if (existingColumns.has('picture') && params.picture) {
			columns.push('picture');
			values.push(params.picture);
		}
		if (existingColumns.has('username') && params.username) {
			columns.push('username');
			values.push(params.username);
		}
		if (existingColumns.has('firstName') && params.firstName) {
			columns.push('"firstName"');
			values.push(params.firstName);
		}
		if (existingColumns.has('lastName') && params.lastName) {
			columns.push('"lastName"');
			values.push(params.lastName);
		}

		const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
		const columnsStr = columns.join(', ');

		const result = await pool.query(
			`INSERT INTO users (${columnsStr}) VALUES (${placeholders}) RETURNING *`,
			values
		);
		return result.rows[0];
	} else {
		let referralCode = generateReferralCode();
		let attempts = 0;

		while (attempts < 10) {
			const existing = await pool.query('SELECT id FROM users WHERE referral_code = $1', [
				referralCode
			]);

			if (existing.rows.length === 0) {
				break;
			}

			referralCode = generateReferralCode();
			attempts++;
		}

		const columns: string[] = ['google_id', 'email', 'name', 'picture', 'referral_code'];
		const values: any[] = [
			params.googleId || null,
			params.email || null,
			params.name || null,
			params.picture || null,
			referralCode
		];

		const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
		const columnsStr = columns.join(', ');

		const result = await pool.query(
			`INSERT INTO users (${columnsStr}) VALUES (${placeholders}) RETURNING *`,
			values
		);
		return result.rows[0];
	}
}

export async function getUserById(id: string, isTelegram: boolean = false): Promise<User | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;
	const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
	return result.rows[0] || null;
}

export async function getUserByReferralCode(
	referralCode: string,
	isTelegram: boolean = false
): Promise<User | null> {
	const pool = getPool(isTelegram);
	if (!pool) return null;

	if (isTelegram) {
		const columnCheck = await pool.query(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name='users' AND column_name='referral_code'
			)
		`);
		if (!columnCheck.rows[0]?.exists) {
			return null;
		}
	}

	const result = await pool.query('SELECT * FROM users WHERE referral_code = $1', [referralCode]);
	return result.rows[0] || null;
}

export async function ensureReferralCode(
	userId: string,
	isTelegram: boolean = false
): Promise<string> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	if (isTelegram) {
		const columnCheck = await pool.query(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name='users' AND column_name='referral_code'
			)
		`);
		if (!columnCheck.rows[0]?.exists) {
			throw new Error('Колонка referral_code не существует в БД бота');
		}
	}

	const user = await getUserById(userId, isTelegram);
	if (!user) throw new Error('Пользователь не найден');

	if (user.referral_code) {
		return user.referral_code;
	}

	let referralCode = generateReferralCode();
	let attempts = 0;

	while (attempts < 10) {
		const existing = await pool.query('SELECT id FROM users WHERE referral_code = $1', [
			referralCode
		]);

		if (existing.rows.length === 0) {
			break;
		}

		referralCode = generateReferralCode();
		attempts++;
	}

	await pool.query('UPDATE users SET referral_code = $1 WHERE id = $2', [referralCode, userId]);

	return referralCode;
}

export async function getOrCreateUser(
	params: {
		googleId?: string;
		telegramId?: string;
		email?: string;
		name?: string;
		picture?: string;
		username?: string;
		firstName?: string;
		lastName?: string;
	},
	isTelegram: boolean = false
): Promise<User> {
	if (!params.googleId && !params.telegramId) {
		throw new Error('Необходимо указать либо googleId, либо telegramId');
	}

	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	let existing: User | null = null;

	if (isTelegram && params.telegramId) {
		existing = await getUserByTelegramId(params.telegramId, true);
	} else if (!isTelegram && params.googleId) {
		existing = await getUserByGoogleId(params.googleId, false);
	} else if (params.telegramId) {
		existing = await getUserByTelegramId(params.telegramId, isTelegram);
	}

	if (existing) {
		const updateParams: any[] = [];
		const updateFields: string[] = [];

		if (isTelegram) {
			const columnCheck = await pool.query(`
				SELECT column_name 
				FROM information_schema.columns 
				WHERE table_name='users' 
				AND column_name IN ('email', 'name', 'picture', 'username', 'firstName', 'lastName')
			`);
			const existingColumns = new Set(columnCheck.rows.map((r: any) => r.column_name));

			if (existingColumns.has('email') && params.email) {
				const currentEmail = (existing as any).email;
				if (
					currentEmail === null ||
					currentEmail === undefined ||
					currentEmail !== params.email
				) {
					updateFields.push('email = $' + (updateParams.length + 1));
					updateParams.push(params.email);
				}
			}

			if (existingColumns.has('name') && params.name) {
				const currentName = (existing as any).name;
				if (
					currentName === null ||
					currentName === undefined ||
					currentName !== params.name
				) {
					updateFields.push('name = $' + (updateParams.length + 1));
					updateParams.push(params.name || null);
				}
			}

			if (existingColumns.has('picture') && params.picture) {
				const currentPicture = (existing as any).picture;
				if (
					currentPicture === null ||
					currentPicture === undefined ||
					currentPicture !== params.picture
				) {
					updateFields.push('picture = $' + (updateParams.length + 1));
					updateParams.push(params.picture || null);
				}
			}

			if (existingColumns.has('username') && params.username) {
				const currentUsername = (existing as any).username;
				if (
					currentUsername === null ||
					currentUsername === undefined ||
					currentUsername !== params.username
				) {
					updateFields.push('username = $' + (updateParams.length + 1));
					updateParams.push(params.username);
				}
			}

			if (existingColumns.has('firstName') && params.firstName) {
				const currentFirstName = (existing as any).firstName;
				if (
					currentFirstName === null ||
					currentFirstName === undefined ||
					currentFirstName !== params.firstName
				) {
					updateFields.push('"firstName" = $' + (updateParams.length + 1));
					updateParams.push(params.firstName);
				}
			}

			if (existingColumns.has('lastName') && params.lastName) {
				const currentLastName = (existing as any).lastName;
				if (
					currentLastName === null ||
					currentLastName === undefined ||
					currentLastName !== params.lastName
				) {
					updateFields.push('"lastName" = $' + (updateParams.length + 1));
					updateParams.push(params.lastName);
				}
			}
		} else {
			if (params.email && !existing.email) {
				updateFields.push('email = $' + (updateParams.length + 1));
				updateParams.push(params.email);
			}

			if (params.name !== undefined && params.name !== existing.name) {
				updateFields.push('name = $' + (updateParams.length + 1));
				updateParams.push(params.name || null);
			}

			if (params.picture !== undefined && params.picture !== existing.picture) {
				updateFields.push('picture = $' + (updateParams.length + 1));
				updateParams.push(params.picture || null);
			}
		}

		if (updateFields.length > 0) {
			if (isTelegram) {
				const columnCheck = await pool.query(`
					SELECT EXISTS (
						SELECT 1 FROM information_schema.columns 
						WHERE table_name='users' AND column_name='updatedAt'
					)
				`);
				if (columnCheck.rows[0]?.exists) {
					updateFields.push('"updatedAt" = NOW()');
				}
			} else {
				updateFields.push('"updatedAt" = NOW()');
			}
			updateParams.push(existing.id);
			await pool.query(
				`UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateParams.length}`,
				updateParams
			);
		}

		const updated = await pool.query('SELECT * FROM users WHERE id = $1', [existing.id]);
		return updated.rows[0];
	}

	return await createUser(params, isTelegram);
}

export async function linkYstuAccount(
	userId: string,
	ystuId: number,
	ystuData: any,
	isTelegram: boolean = false
): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	try {
		const ystuIdColumnCheck = await pool.query(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'users' AND column_name = 'ystu_id'
			)
		`);

		if (!ystuIdColumnCheck.rows[0]?.exists) {
			await pool.query(`ALTER TABLE users ADD COLUMN ystu_id INTEGER UNIQUE`);
		} else {
			const uniqueCheck = await pool.query(`
				SELECT EXISTS (
					SELECT 1 FROM pg_constraint 
					WHERE conrelid = 'users'::regclass 
					AND conname LIKE '%ystu_id%'
					AND contype = 'u'
				)
			`);
			if (!uniqueCheck.rows[0]?.exists) {
				try {
					await pool.query(
						`ALTER TABLE users ADD CONSTRAINT users_ystu_id_unique UNIQUE (ystu_id)`
					);
				} catch (constraintError: any) {
					if (
						!constraintError.message?.includes('duplicate') &&
						!constraintError.message?.includes('violates')
					) {
						console.error(
							'[Migration Error]: Failed to add UNIQUE constraint:',
							constraintError
						);
					}
				}
			}
		}

		const ystuDataColumnCheck = await pool.query(`
			SELECT EXISTS (
				SELECT 1 FROM information_schema.columns 
				WHERE table_name = 'users' AND column_name = 'ystu_data'
			)
		`);

		if (!ystuDataColumnCheck.rows[0]?.exists) {
			try {
				await pool.query(`ALTER TABLE users ADD COLUMN ystu_data JSONB`);
			} catch (e: any) {
				if (e.message?.includes('type "jsonb" does not exist')) {
					await pool.query(`ALTER TABLE users ADD COLUMN ystu_data TEXT`);
				} else {
					throw e;
				}
			}
		}

		await pool.query(
			`ALTER TABLE users ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP DEFAULT NOW()`
		);
		await pool.query(
			`ALTER TABLE users ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW()`
		);
		await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_ystu_id ON users(ystu_id)`);
	} catch (e: any) {
		console.error('[Migration Error]: Failed robust migration in linkYstuAccount:', e);
		if (e.message?.includes('type "jsonb" does not exist')) {
			try {
				await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ystu_data TEXT`);
			} catch (e2) {
				console.error('[Migration Error]: Fallback migration also failed:', e2);
			}
		}
	}

	try {
		await pool.query(
			'UPDATE users SET ystu_id = $1, ystu_data = $2, "updatedAt" = NOW() WHERE id = $3',
			[ystuId, typeof ystuData === 'object' ? JSON.stringify(ystuData) : ystuData, userId]
		);
	} catch (error: any) {
		console.error('[Database Error in linkYstuAccount]:', error);
		throw new Error(`Ошибка сохранения данных ЯГТУ: ${error.message}`);
	}
}

export async function unlinkYstuAccount(
	userId: string,
	isTelegram: boolean = false
): Promise<void> {
	const pool = getPool(isTelegram);
	if (!pool) throw new Error('База данных недоступна');

	await pool.query(
		'UPDATE users SET ystu_id = NULL, ystu_data = NULL, "updatedAt" = NOW() WHERE id = $1',
		[userId]
	);
}
