import type { FormatParams } from './api';

export const defaultFormatParams: FormatParams = {
	margins: {
		top: 2,
		right: 1,
		bottom: 2,
		left: 3
	},
	text: {
		font: 'Times New Roman',
		size: 14,
		indent: 1.25,
		lineHeight: 1
	},
	headers: {
		h1: { spacingBefore: 0, spacingAfter: 36 },
		h2: { spacingBefore: 24, spacingAfter: 24 },
		h3: { spacingBefore: 12, spacingAfter: 0 }
	}
};
