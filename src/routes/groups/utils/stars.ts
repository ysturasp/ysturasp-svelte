export function createStars(container: HTMLElement) {
	const starCount = 100;

	for (let i = 0; i < starCount; i++) {
		const star = document.createElement('div');
		star.className = 'star';

		star.style.left = `${Math.random() * 100}%`;
		star.style.top = `${Math.random() * 100}%`;

		const size = Math.random() * 3;
		star.style.width = `${size}px`;
		star.style.height = `${size}px`;

		star.style.setProperty('--delay', `${Math.random() * 3}s`);
		star.style.setProperty('--duration', `${2 + Math.random() * 3}s`);

		container.appendChild(star);
	}
}
