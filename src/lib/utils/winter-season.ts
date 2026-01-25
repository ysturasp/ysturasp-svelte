export function isWinterSeason(): boolean {
	const now = new Date();
	const month = now.getMonth();
	const day = now.getDate();

	if (month === 11) {
		return true;
	}

	if (month === 0 && day <= 15) {
		return true;
	}

	return false;
}
