export interface Promotion {
	isActive: boolean;
	discountPercent: number;
	name: string;
	description: string;
	startDate: Date;
	endDate: Date;
}

export function getCurrentPromotion(): Promotion | null {
	const now = new Date();
	const currentYear = now.getFullYear();

	const preNewYearStart = new Date(currentYear, 11, 20);
	const preNewYearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

	const postNewYearStart = new Date(currentYear, 0, 1);
	const postNewYearEnd = new Date(currentYear, 0, 15, 23, 59, 59);

	if (now >= preNewYearStart && now <= preNewYearEnd) {
		return {
			isActive: true,
			discountPercent: 80,
			name: 'Предновогодняя акция',
			description: 'Скидка на всё!',
			startDate: preNewYearStart,
			endDate: preNewYearEnd
		};
	}

	if (now >= postNewYearStart && now <= postNewYearEnd) {
		return {
			isActive: true,
			discountPercent: 75,
			name: 'Новогодняя акция',
			description: 'Скидка на всё!',
			startDate: postNewYearStart,
			endDate: postNewYearEnd
		};
	}

	return null;
}

export function applyDiscount(price: number, discountPercent: number): number {
	return Math.round(price * (1 - discountPercent / 100));
}

export function getPriceWithPromotion(basePrice: number): {
	finalPrice: number;
	originalPrice: number;
	discount: number;
	promotion: Promotion | null;
} {
	const promotion = getCurrentPromotion();

	if (promotion && promotion.isActive) {
		const finalPrice = applyDiscount(basePrice, promotion.discountPercent);
		return {
			finalPrice,
			originalPrice: basePrice,
			discount: promotion.discountPercent,
			promotion
		};
	}

	return {
		finalPrice: basePrice,
		originalPrice: basePrice,
		discount: 0,
		promotion: null
	};
}

export function formatPromotionEndDate(promotion: Promotion): string {
	const endDate = promotion.endDate;
	const day = endDate.getDate();
	const month = endDate.toLocaleDateString('ru-RU', { month: 'long' });
	const monthGenitive = month === 'декабрь' ? 'декабря' : month === 'январь' ? 'января' : month;
	return `${day} ${monthGenitive}`;
}
