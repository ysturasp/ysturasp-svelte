<script>
	import { onMount } from 'svelte';

	let canvas;
	let ctx;
	let w, h;
	let particles = [];
	let animationFrame;

	class Flake {
		constructor() {
			this.init();
		}

		init() {
			this.x = Math.random() * w;
			this.y = Math.random() * h;
			this.r = Math.random() * 2 + 1;
			this.d = Math.random() * 2 + 1;
			this.vx = Math.sin(this.d) + (Math.random() - 0.5);
			this.vy = Math.random() * 1 + 0.5;
			this.opacity = Math.random() * 0.5 + 0.3;
		}

		update() {
			this.y += this.vy;
			this.x += this.vx;

			if (this.y > h) {
				this.y = -10;
				this.x = Math.random() * w;
			}
			if (this.x > w + 5 || this.x < -5) {
				if (this.x > w + 5) this.x = -5;
				if (this.x < -5) this.x = w + 5;
			}
		}

		draw() {
			ctx.beginPath();
			ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
			ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
			ctx.fill();
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d');

		const resize = () => {
			w = window.innerWidth;
			h = window.innerHeight;
			canvas.width = w;
			canvas.height = h;
		};

		window.addEventListener('resize', resize);
		resize();

		const particleCount = Math.min(100, (w * h) / 10000);
		for (let i = 0; i < particleCount; i++) {
			particles.push(new Flake());
		}

		const loop = () => {
			ctx.clearRect(0, 0, w, h);
			for (const p of particles) {
				p.update();
				p.draw();
			}
			animationFrame = requestAnimationFrame(loop);
		};

		loop();

		return () => {
			window.removeEventListener('resize', resize);
			cancelAnimationFrame(animationFrame);
		};
	});
</script>

<canvas
	bind:this={canvas}
	class="pointer-events-none fixed inset-0 z-50 mix-blend-screen"
	aria-hidden="true"
></canvas>

<style>
	canvas {
		pointer-events: none;
		z-index: 9999;
	}
</style>
