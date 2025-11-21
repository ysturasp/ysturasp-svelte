import { Pool, type Pool as PoolType } from 'pg';
import { env } from '$env/dynamic/private';

let pool: PoolType | null = null;

export function getPool(): PoolType {
	if (!pool) {
		if (!env.DATABASE_URL) {
			throw new Error('DATABASE_URL не задан в переменных окружения');
		}
		pool = new Pool({
			connectionString: env.DATABASE_URL,
			ssl: false
		});
	}
	return pool;
}

async function waitForDatabase(maxRetries = 10, delayMs = 1000): Promise<void> {
	const pool = getPool();

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

export async function initDatabase() {
	try {
		await waitForDatabase();
		console.log('Подключение к БД установлено');
	} catch (error) {
		console.error('Ошибка подключения к БД:', error);
		throw error;
	}

	const pool = getPool();

	try {
		await pool.query(`
			CREATE TABLE IF NOT EXISTS users (
				id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
				google_id TEXT UNIQUE NOT NULL,
				email TEXT NOT NULL,
				name TEXT,
				picture TEXT,
				created_at TIMESTAMP DEFAULT NOW(),
				updated_at TIMESTAMP DEFAULT NOW()
			)
		`);
		console.log('Таблица users создана/проверена');

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
			CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
			CREATE INDEX IF NOT EXISTS idx_user_limits_user_id ON user_limits(user_id);
			CREATE INDEX IF NOT EXISTS idx_format_history_user_id ON format_history(user_id);
			CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
			CREATE INDEX IF NOT EXISTS idx_payments_yookassa_id ON payments(yookassa_payment_id);
			CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
			CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
		`);
		console.log('Индексы созданы/проверены');
		console.log('Инициализация БД завершена успешно');
	} catch (error) {
		console.error('Ошибка при создании таблиц:', error);
		throw error;
	}
}
