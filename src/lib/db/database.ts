import { Pool, type Pool as PoolType } from 'pg';
import { env } from '$env/dynamic/private';

let mainPool: PoolType | null = null;
let botPool: PoolType | null = null;

function createConnectionString(databaseName?: string): string {
	if (!env.DATABASE_URL) {
		throw new Error('DATABASE_URL не задан');
	}

	if (!databaseName) {
		return env.DATABASE_URL;
	}

	try {
		const url = new URL(env.DATABASE_URL);
		url.pathname = `/${databaseName}`;
		return url.toString();
	} catch (error) {
		return env.DATABASE_URL.replace(/\/[^\/]+$/, `/${databaseName}`);
	}
}

export function getPool(isTelegram: boolean = false): PoolType | null {
	if (isTelegram) {
		if (!botPool) {
			if (!env.DATABASE_URL) {
				return null;
			}

			const botDatabase = env.BOT_DATABASE;
			const connectionString = createConnectionString(botDatabase);

			botPool = new Pool({
				connectionString,
				ssl: false
			});
		}
		return botPool;
	} else {
		if (!mainPool) {
			if (!env.DATABASE_URL) {
				return null;
			}

			const connectionString = createConnectionString();

			mainPool = new Pool({
				connectionString,
				ssl: false
			});
		}
		return mainPool;
	}
}

async function waitForDatabase(pool: PoolType, maxRetries = 10, delayMs = 1000): Promise<void> {
	for (let i = 0; i < maxRetries; i++) {
		try {
			await pool.query('SELECT 1');
			console.log(`[waitForDatabase] Подключение к БД успешно (попытка ${i + 1})`);
			return;
		} catch (error) {
			console.log(
				`[waitForDatabase] Попытка ${i + 1}/${maxRetries} не удалась:`,
				error instanceof Error ? error.message : error
			);
			if (i === maxRetries - 1) {
				throw error;
			}
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
}

export async function initDatabase(isTelegram: boolean = false) {
	const pool = getPool(isTelegram);
	if (!pool) {
		console.log(
			`[initDatabase] DATABASE_URL не задан, инициализация БД ${isTelegram ? 'бота' : 'основной'} пропущена`
		);
		return;
	}

	try {
		await waitForDatabase(pool);
		console.log(`Подключение к БД ${isTelegram ? 'бота' : 'основной'} установлено`);
	} catch (error) {
		console.error(`Ошибка подключения к БД ${isTelegram ? 'бота' : 'основной'}:`, error);
		throw error;
	}

	try {
		if (isTelegram) {
			console.log('Создание таблиц в БД бота...');

			const usersTableExists = await pool.query(`
				SELECT EXISTS (
					SELECT FROM information_schema.tables 
					WHERE table_name = 'users'
				)
			`);

			if (!usersTableExists.rows[0]?.exists) {
				console.log(
					'Таблица users не найдена в БД бота. Убедитесь, что бот запущен и создал таблицы через TypeORM.'
				);
				return;
			}

			await pool.query(`
				CREATE TABLE IF NOT EXISTS user_limits (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					free_formats_used INTEGER DEFAULT 0,
					paid_formats_used INTEGER DEFAULT 0,
					paid_formats_purchased INTEGER DEFAULT 0,
					updated_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(user_id)
				)
			`);
			console.log('Таблица user_limits создана/проверена в БД бота');

			await pool.query(`
				CREATE TABLE IF NOT EXISTS format_history (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					file_name TEXT NOT NULL,
					is_paid BOOLEAN DEFAULT false,
					created_at TIMESTAMP DEFAULT NOW()
				)
			`);
			console.log('Таблица format_history создана/проверена в БД бота');

			await pool.query(`
				CREATE TABLE IF NOT EXISTS payments (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					yookassa_payment_id TEXT UNIQUE NOT NULL,
					amount DECIMAL(10, 2) NOT NULL,
					currency TEXT DEFAULT 'RUB',
					status TEXT NOT NULL,
					formats_count INTEGER NOT NULL,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`);
			console.log('Таблица payments создана/проверена в БД бота');

			await pool.query(`
				CREATE TABLE IF NOT EXISTS user_sessions (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					token_hash TEXT NOT NULL,
					device_name TEXT,
					ip_address TEXT,
					user_agent TEXT,
					metadata JSONB,
					created_at TIMESTAMP DEFAULT NOW(),
					last_seen TIMESTAMP DEFAULT NOW(),
					expires_at TIMESTAMP NOT NULL,
					revoked_at TIMESTAMP
				)
			`);
			console.log('Таблица user_sessions создана/проверена в БД бота');

			await pool.query(`
				CREATE TABLE IF NOT EXISTS stat_views (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					discipline TEXT NOT NULL,
					institute TEXT NOT NULL,
					created_at TIMESTAMP DEFAULT NOW()
				)
			`);
			console.log('Таблица stat_views создана/проверена в БД бота');

			await pool.query(`
				CREATE TABLE IF NOT EXISTS stat_limits (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
					monthly_limit INTEGER DEFAULT 10,
					referral_bonus INTEGER DEFAULT 0,
					updated_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(user_id)
				)
			`);
			console.log('Таблица stat_limits создана/проверена в БД бота');

			await pool.query(`
				CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
				CREATE INDEX IF NOT EXISTS idx_format_history_user_id ON format_history(user_id);
				CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
				CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
				CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
				CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
				CREATE INDEX IF NOT EXISTS idx_stat_views_user_id ON stat_views(user_id);
				CREATE INDEX IF NOT EXISTS idx_stat_views_created_at ON stat_views(created_at);
				CREATE INDEX IF NOT EXISTS idx_stat_limits_user_id ON stat_limits(user_id);
			`);
			console.log('Индексы созданы/проверены в БД бота');
			console.log('Инициализация БД бота завершена успешно');
			return;
		}

		const tableExists = await pool.query(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_name = 'users'
			)
		`);

		const usersTableExists = tableExists.rows[0]?.exists || false;

		if (!usersTableExists) {
			await pool.query(`
				CREATE TABLE users (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					google_id TEXT UNIQUE,
					email TEXT NOT NULL,
					name TEXT,
					picture TEXT,
					referral_code TEXT UNIQUE,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				)
			`);
			console.log('Таблица users создана в основной БД');
		} else {
			console.log('Таблица users уже существует в основной БД');
		}

		try {
			await pool.query(`
				DO $$
				BEGIN
					-- Добавляем referral_code если его нет
					IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
						WHERE table_name='users' AND column_name='referral_code') THEN
						ALTER TABLE users ADD COLUMN referral_code TEXT UNIQUE;
						CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
					END IF;
					
					-- Генерируем referral_code для пользователей без него
					UPDATE users SET referral_code = gen_random_uuid()::TEXT 
					WHERE referral_code IS NULL;
				END $$;
			`);
			console.log('Миграция основной БД выполнена');
		} catch (error) {
			console.log('Миграция основной БД пропущена:', error);
		}

		await pool.query(`
			CREATE TABLE IF NOT EXISTS user_limits (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				free_formats_used INTEGER DEFAULT 0,
				paid_formats_used INTEGER DEFAULT 0,
				paid_formats_purchased INTEGER DEFAULT 0,
				updated_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(user_id)
			)
		`);
		console.log('Таблица user_limits создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS format_history (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				file_name TEXT NOT NULL,
				is_paid BOOLEAN DEFAULT false,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);
		console.log('Таблица format_history создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS public_format_history (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_key TEXT NOT NULL,
				file_name TEXT NOT NULL,
				original_size INTEGER NOT NULL,
				formatted_size INTEGER NOT NULL,
				formatted_base64 TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);
		console.log('Таблица public_format_history создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS payments (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				yookassa_payment_id TEXT UNIQUE NOT NULL,
				amount DECIMAL(10, 2) NOT NULL,
				currency TEXT DEFAULT 'RUB',
				status TEXT NOT NULL,
				formats_count INTEGER NOT NULL,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			)
		`);
		console.log('Таблица payments создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS user_sessions (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				token_hash TEXT NOT NULL,
				device_name TEXT,
				ip_address TEXT,
				user_agent TEXT,
				metadata JSONB,
				created_at TIMESTAMP DEFAULT NOW(),
				last_seen TIMESTAMP DEFAULT NOW(),
				expires_at TIMESTAMP NOT NULL,
				revoked_at TIMESTAMP
			)
		`);
		console.log('Таблица user_sessions создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS referrals (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				created_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(referred_id)
			)
		`);
		console.log('Таблица referrals создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS stat_views (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				discipline TEXT NOT NULL,
				institute TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT NOW()
			)
		`);
		console.log('Таблица stat_views создана/проверена');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS stat_limits (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				monthly_limit INTEGER DEFAULT 10,
				referral_bonus INTEGER DEFAULT 0,
				updated_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(user_id)
			)
		`);
		console.log('Таблица stat_limits создана/проверена');

		try {
			await pool.query(`
				DO $$
				BEGIN
					IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
						WHERE table_name='stat_limits' AND column_name='monthly_limit') THEN
						ALTER TABLE stat_limits ADD COLUMN monthly_limit INTEGER DEFAULT 10;
					END IF;
					IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
						WHERE table_name='stat_limits' AND column_name='referral_bonus') THEN
						ALTER TABLE stat_limits ADD COLUMN referral_bonus INTEGER DEFAULT 0;
					END IF;
				END $$;
			`);
			console.log('Миграция stat_limits выполнена');
		} catch (error) {
			console.log('Миграция stat_limits пропущена (возможно, колонки уже существуют)');
		}

		await pool.query(`
			DO $$
			BEGIN
				IF EXISTS (SELECT 1 FROM information_schema.columns 
					WHERE table_name='users' AND column_name='google_id') THEN
					CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
				END IF;
				
				IF EXISTS (SELECT 1 FROM information_schema.columns 
					WHERE table_name='users' AND column_name='telegram_id') THEN
					CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
				END IF;
				
				IF EXISTS (SELECT 1 FROM information_schema.columns 
					WHERE table_name='users' AND column_name='chatId') THEN
					CREATE INDEX IF NOT EXISTS idx_users_chatId ON users("chatId");
				END IF;
				
				IF EXISTS (SELECT 1 FROM information_schema.columns 
					WHERE table_name='users' AND column_name='referral_code') THEN
					CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
				END IF;
			END $$;
		`);

		await pool.query(`
			CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
			CREATE INDEX IF NOT EXISTS idx_format_history_user_id ON format_history(user_id);
			CREATE INDEX IF NOT EXISTS idx_public_format_history_user_key ON public_format_history(user_key);
			CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
			CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
			CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
			CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
			CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
			CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
			CREATE INDEX IF NOT EXISTS idx_stat_views_user_id ON stat_views(user_id);
			CREATE INDEX IF NOT EXISTS idx_stat_views_created_at ON stat_views(created_at);
			CREATE INDEX IF NOT EXISTS idx_stat_limits_user_id ON stat_limits(user_id);
		`);
		console.log('Индексы созданы/проверены');
		console.log('Инициализация БД завершена успешно');
	} catch (error) {
		console.error('Ошибка при создании таблиц:', error);
		throw error;
	}
}
