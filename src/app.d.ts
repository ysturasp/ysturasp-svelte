declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface Locals {
			user?: {
				id: string;
				email: string | null;
				name?: string | null;
				google_id?: string | null;
				telegram_id?: string | null;
				picture?: string | null;
			};
			session?: {
				id: string;
				user_id: string;
				expires_at: Date;
				revoked_at?: Date | null;
			};
			isTelegram?: boolean;
		}
	}
}

declare module 'animejs' {
	const anime: any;
	export default anime;
}

export {};
