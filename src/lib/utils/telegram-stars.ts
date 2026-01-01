const STARS_EXCHANGE_RATE = 1.71;

export function convertRubToStars(rubAmount: number): number {
	const starsAmount = Math.round(rubAmount / STARS_EXCHANGE_RATE);
	return Math.max(1, starsAmount);
}

export function convertStarsToRub(starsAmount: number): number {
	return Math.round(starsAmount * STARS_EXCHANGE_RATE * 100) / 100;
}
