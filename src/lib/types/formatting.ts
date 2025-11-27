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
		removeBold: boolean;
		removeItalic: boolean;
		removeUnderline: boolean;
	};
	headers: {
		h1: { spacingBefore: number; spacingAfter: number };
		h2: { spacingBefore: number; spacingAfter: number };
		h3: { spacingBefore: number; spacingAfter: number };
	};
}
