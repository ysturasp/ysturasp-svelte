export interface SupportMessage {
	message: string;
	createdAt: string;
	isAdmin: boolean;
}

export interface SupportRequest {
	id: string;
	messages: SupportMessage[];
	status: 'pending' | 'answered';
	lastMessageAt: string;
}
