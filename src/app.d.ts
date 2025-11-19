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
				email: string;
				name?: string;
			};
		}
	}
}

declare module 'animejs' {
	const anime: any;
	export default anime;
}

export {};
