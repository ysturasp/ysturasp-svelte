<script lang="ts">
	import { onMount } from 'svelte';
	import type { BuildingMap, Auditorium, Point, Route } from '../types';
	import { getAllAuditoriums } from '../data';

	export let buildingMap: BuildingMap;
	export let selectedAuditorium: Auditorium | null = null;
	export let routeStart: Auditorium | null = null;
	export let routeEnd: Auditorium | null = null;
	export let currentRoute: Route | null = null;
	export let onAuditoriumClick: (auditorium: Auditorium) => void = () => {};
	export let onAuditoriumHover: (auditorium: Auditorium | null) => void = () => {};

	let container: HTMLDivElement;
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let offsetX = 0;
	let offsetY = 0;
	let scale = 1;
	let hoveredAuditorium: Auditorium | null = null;
	let isDragging = false;
	let dragStartScreenX = 0;
	let dragStartScreenY = 0;
	let dragStartOffsetX = 0;
	let dragStartOffsetY = 0;
	let isClick = false;
	let clickStartTime = 0;
	let clickStartX = 0;
	let clickStartY = 0;

	let routeAnimStartMs = 0;
	let routeAnimProgress = 1;
	let routeAnimRaf: number | null = null;
	let isRouteDisappearing = false;
	const ROUTE_ANIM_MS = 650;
	const ROUTE_DISAPPEAR_MS = 400;

	let isAnimatingView = false;
	let viewAnimRaf: number | null = null;
	let targetOffsetX = 0;
	let targetOffsetY = 0;
	let targetScale = 1;
	let startOffsetX = 0;
	let startOffsetY = 0;
	let startScale = 1;
	const VIEW_ANIM_MS = 500;

	const MIN_SCALE = 0.2;
	const MAX_SCALE = 4;
	const SCALE_STEP = 0.15;

	function getTransform() {
		return { x: offsetX, y: offsetY, scale };
	}

	function worldToScreen(worldX: number, worldY: number): Point {
		return {
			x: worldX * scale + offsetX,
			y: worldY * scale + offsetY
		};
	}

	function screenToWorld(screenX: number, screenY: number): Point {
		return {
			x: (screenX - offsetX) / scale,
			y: (screenY - offsetY) / scale
		};
	}

	function getAuditoriumAt(x: number, y: number): Auditorium | null {
		const world = screenToWorld(x, y);
		const allAuditoriums = getAllAuditoriums(buildingMap);
		const t = getTransform();

		for (const aud of allAuditoriums) {
			const section = buildingMap.sections.find(
				(s) => s.id === aud.section && s.floor === aud.floor
			);
			if (!section) continue;

			const left = section.position.x + aud.position.x;
			const top = section.position.y + aud.position.y;
			if (
				world.x >= left &&
				world.x <= left + aud.width &&
				world.y >= top &&
				world.y <= top + aud.height
			) {
				return aud;
			}
		}
		return null;
	}

	function drawStairsBlocks() {
		if (!ctx || !buildingMap.stairsBlocks) return;
		const t = getTransform();

		for (const block of buildingMap.stairsBlocks) {
			const screenPos = worldToScreen(block.x, block.y);
			const screenWidth = block.width * t.scale;
			const screenHeight = block.height * t.scale;

			ctx.fillStyle = 'rgba(180, 83, 9, 0.18)';
			ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
			ctx.lineWidth = 1.25 * t.scale;
			const radius = 5 * t.scale;
			ctx.beginPath();
			(ctx as any).roundRect(screenPos.x, screenPos.y, screenWidth, screenHeight, radius);
			ctx.fill();
			ctx.stroke();
		}
	}

	function drawSection(section: any) {
		if (!ctx) return;

		const t = getTransform();
		const screenPos = worldToScreen(section.position.x, section.position.y);
		const screenWidth = section.width * t.scale;
		const screenHeight = section.height * t.scale;

		ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
		ctx.lineWidth = 2.25 * t.scale;
		ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';

		const radius = 10 * t.scale;
		ctx.beginPath();
		(ctx as any).roundRect(screenPos.x, screenPos.y, screenWidth, screenHeight, radius);
		ctx.fill();
		ctx.stroke();

		const fontSize = 10 * t.scale;
		ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		const label = `${section.floor} этаж`;
		const textMetrics = ctx.measureText(label);
		const textWidth = textMetrics.width;
		const labelX = screenPos.x - textWidth - 8 * t.scale;
		const labelY = screenPos.y + 6 * t.scale;
		ctx.fillStyle = 'rgba(226, 232, 240, 0.85)';
		ctx.fillText(label, labelX, labelY);

		if (section.floor === 6 && section.id === 2) {
			const secretSize = 14 * t.scale;
			ctx.font = `700 ${secretSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
			ctx.fillText(
				'Секретный этаж',
				screenPos.x + screenWidth / 2,
				screenPos.y + screenHeight / 2
			);
		}
	}

	function drawAuditorium(auditorium: Auditorium, isSelected: boolean, isHovered: boolean) {
		if (!ctx) return;

		const section = buildingMap.sections.find(
			(s) => s.id === auditorium.section && s.floor === auditorium.floor
		);
		if (!section) return;

		const absX = section.position.x + auditorium.position.x;
		const absY = section.position.y + auditorium.position.y;

		const t = getTransform();
		const screenPos = worldToScreen(absX, absY);
		const screenWidth = auditorium.width * t.scale;
		const screenHeight = auditorium.height * t.scale;

		let fillColor = 'rgba(0, 0, 0, 0)';
		let strokeColor = 'rgba(148, 163, 184, 0.65)';

		if (isSelected) {
			fillColor = 'rgba(59, 130, 246, 0.18)';
			strokeColor = 'rgba(96, 165, 250, 0.95)';
		} else if (isHovered) {
			fillColor = 'rgba(148, 163, 184, 0.10)';
			strokeColor = 'rgba(226, 232, 240, 0.85)';
		} else if (auditorium === routeStart) {
			fillColor = 'rgba(16, 185, 129, 0.16)';
			strokeColor = 'rgba(52, 211, 153, 0.95)';
		} else if (auditorium === routeEnd) {
			fillColor = 'rgba(245, 158, 11, 0.16)';
			strokeColor = 'rgba(251, 191, 36, 0.95)';
		}

		ctx.fillStyle = fillColor;
		ctx.strokeStyle = strokeColor;
		ctx.lineWidth = 1.25 * t.scale;
		const r = Math.min(8 * t.scale, screenWidth / 3, screenHeight / 3);
		ctx.beginPath();
		(ctx as any).roundRect(screenPos.x, screenPos.y, screenWidth, screenHeight, r);
		ctx.fill();
		ctx.stroke();

		const fontSize = 9 * t.scale;
		ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		const centerX = screenPos.x + screenWidth / 2;
		const centerY = screenPos.y + screenHeight / 2;
		ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
		ctx.fillText(auditorium.name, centerX, centerY);
	}

	function drawRoute(route: Route) {
		if (!ctx) return;

		const t = getTransform();
		const opacity = isRouteDisappearing ? 1 - routeAnimProgress : 1;
		ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
		ctx.lineWidth = 5 * t.scale;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';

		let polyline: Point[] = [];
		if (route.polyline && route.polyline.length >= 2) {
			polyline = route.polyline;
		} else if (route.path && route.path.length >= 2) {
			for (const aud of route.path) {
				const section = buildingMap.sections.find(
					(s) => s.id === aud.section && s.floor === aud.floor
				);
				if (!section) continue;
				polyline.push({
					x: section.position.x + aud.position.x + aud.width / 2,
					y: section.position.y + aud.position.y + aud.height / 2
				});
			}
		}

		if (polyline.length < 2) return;

		const screenPts = polyline.map((p) => worldToScreen(p.x, p.y));
		const segLens: number[] = [];
		let totalLen = 0;
		for (let i = 0; i < screenPts.length - 1; i++) {
			const dx = screenPts[i + 1].x - screenPts[i].x;
			const dy = screenPts[i + 1].y - screenPts[i].y;
			const len = Math.sqrt(dx * dx + dy * dy);
			segLens.push(len);
			totalLen += len;
		}
		const drawLen = totalLen * Math.max(0, Math.min(1, routeAnimProgress));

		let remaining = drawLen;
		let lastDrawn: { x: number; y: number } | null = null;
		let lastDir: { x: number; y: number } | null = null;

		ctx.beginPath();
		ctx.moveTo(screenPts[0].x, screenPts[0].y);
		lastDrawn = { x: screenPts[0].x, y: screenPts[0].y };

		for (let i = 0; i < segLens.length; i++) {
			const a = screenPts[i];
			const b = screenPts[i + 1];
			const len = segLens[i];
			if (len <= 0) continue;

			if (remaining >= len) {
				ctx.lineTo(b.x, b.y);
				remaining -= len;
				lastDrawn = { x: b.x, y: b.y };
				lastDir = { x: b.x - a.x, y: b.y - a.y };
			} else {
				const k = remaining / len;
				const x = a.x + (b.x - a.x) * k;
				const y = a.y + (b.y - a.y) * k;
				ctx.lineTo(x, y);
				lastDrawn = { x, y };
				lastDir = { x: b.x - a.x, y: b.y - a.y };
				remaining = 0;
				break;
			}
		}

		ctx.stroke();

		if (lastDrawn && lastDir && (lastDir.x !== 0 || lastDir.y !== 0) && !isRouteDisappearing) {
			const angle = Math.atan2(lastDir.y, lastDir.x);
			const arrowLength = 12 * t.scale;
			const arrowWidth = 8 * t.scale;

			ctx.save();
			ctx.translate(lastDrawn.x, lastDrawn.y);
			ctx.rotate(angle);
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(-arrowLength, -arrowWidth / 2);
			ctx.lineTo(-arrowLength, arrowWidth / 2);
			ctx.closePath();
			ctx.fillStyle = `rgba(59, 130, 246, ${opacity})`;
			ctx.fill();
			ctx.restore();
		}
	}

	function draw() {
		if (!ctx || !canvas) return;

		ctx.fillStyle = '#0f172a';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		drawStairsBlocks();

		for (const section of buildingMap.sections) {
			drawSection(section);
		}

		const allAuditoriums: Array<{
			auditorium: Auditorium;
			isSelected: boolean;
			isHovered: boolean;
		}> = [];
		for (const section of buildingMap.sections) {
			for (const auditorium of section.auditoriums) {
				allAuditoriums.push({
					auditorium,
					isSelected: auditorium === selectedAuditorium,
					isHovered: auditorium === hoveredAuditorium
				});
			}
		}

		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;
		allAuditoriums.sort((a, b) => {
			const aSection = buildingMap.sections.find(
				(s) => s.id === a.auditorium.section && s.floor === a.auditorium.floor
			);
			const bSection = buildingMap.sections.find(
				(s) => s.id === b.auditorium.section && s.floor === b.auditorium.floor
			);
			if (!aSection || !bSection) return 0;

			const aX = aSection.position.x + a.auditorium.position.x + a.auditorium.width / 2;
			const aY = aSection.position.y + a.auditorium.position.y + a.auditorium.height / 2;
			const bX = bSection.position.x + b.auditorium.position.x + b.auditorium.width / 2;
			const bY = bSection.position.y + b.auditorium.position.y + b.auditorium.height / 2;

			const aScreen = worldToScreen(aX, aY);
			const bScreen = worldToScreen(bX, bY);

			const aDist = Math.sqrt(
				Math.pow(aScreen.x - centerX, 2) + Math.pow(aScreen.y - centerY, 2)
			);
			const bDist = Math.sqrt(
				Math.pow(bScreen.x - centerX, 2) + Math.pow(bScreen.y - centerY, 2)
			);

			return bDist - aDist;
		});

		for (const { auditorium, isSelected, isHovered } of allAuditoriums) {
			drawAuditorium(auditorium, isSelected, isHovered);
		}

		if (currentRoute || (lastRoute && isRouteDisappearing)) {
			drawRoute(currentRoute || lastRoute!);
		}
	}

	function getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
		if (!canvas) return { x: 0, y: 0 };
		const rect = canvas.getBoundingClientRect();
		return {
			x: clientX - rect.left,
			y: clientY - rect.top
		};
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const { x: mouseX, y: mouseY } = getCanvasCoords(e.clientX, e.clientY);
		const worldBefore = screenToWorld(mouseX, mouseY);

		if (e.deltaY < 0) {
			scale = Math.min(MAX_SCALE, scale + SCALE_STEP);
		} else {
			scale = Math.max(MIN_SCALE, scale - SCALE_STEP);
		}

		const worldAfter = screenToWorld(mouseX, mouseY);
		offsetX += (worldAfter.x - worldBefore.x) * scale;
		offsetY += (worldAfter.y - worldBefore.y) * scale;
		draw();
	}

	function handleMouseMove(e: MouseEvent) {
		if (!canvas) return;
		const { x: mouseX, y: mouseY } = getCanvasCoords(e.clientX, e.clientY);

		if (isDragging) {
			offsetX = dragStartOffsetX + (mouseX - dragStartScreenX);
			offsetY = dragStartOffsetY + (mouseY - dragStartScreenY);
			draw();
		} else {
			const aud = getAuditoriumAt(mouseX, mouseY);
			if (aud !== hoveredAuditorium) {
				hoveredAuditorium = aud;
				onAuditoriumHover(aud);
				canvas.style.cursor = aud ? 'pointer' : 'grab';
				draw();
			}
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		const { x: mouseX, y: mouseY } = getCanvasCoords(e.clientX, e.clientY);
		isClick = true;
		isDragging = true;
		clickStartTime = Date.now();
		clickStartX = e.clientX;
		clickStartY = e.clientY;
		dragStartScreenX = mouseX;
		dragStartScreenY = mouseY;
		dragStartOffsetX = offsetX;
		dragStartOffsetY = offsetY;
		canvas.style.cursor = 'grabbing';
	}

	function handleMouseUp(e: MouseEvent) {
		if (e.button !== 0) return;
		isDragging = false;
		canvas.style.cursor = hoveredAuditorium ? 'pointer' : 'grab';

		const clickDuration = Date.now() - clickStartTime;
		const clickDistance = Math.sqrt(
			Math.pow(e.clientX - clickStartX, 2) + Math.pow(e.clientY - clickStartY, 2)
		);

		if (isClick && clickDuration < 250 && clickDistance < 8 && canvas) {
			const { x: mouseX, y: mouseY } = getCanvasCoords(e.clientX, e.clientY);
			const aud = getAuditoriumAt(mouseX, mouseY);
			if (aud) {
				onAuditoriumClick(aud);
			}
		}
		isClick = false;
	}

	let lastTouchDistance = 0;

	function handleTouchMove(e: TouchEvent) {
		if (e.touches.length === 2) {
			e.preventDefault();
			const dist = Math.hypot(
				e.touches[1].clientX - e.touches[0].clientX,
				e.touches[1].clientY - e.touches[0].clientY
			);
			const center = getCanvasCoords(
				(e.touches[0].clientX + e.touches[1].clientX) / 2,
				(e.touches[0].clientY + e.touches[1].clientY) / 2
			);
			if (lastTouchDistance > 0) {
				const factor = dist / lastTouchDistance;
				const worldBefore = screenToWorld(center.x, center.y);
				scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
				const worldAfter = screenToWorld(center.x, center.y);
				offsetX += (worldAfter.x - worldBefore.x) * scale;
				offsetY += (worldAfter.y - worldBefore.y) * scale;
				draw();
			}
			lastTouchDistance = dist;
		} else if (e.touches.length === 1 && isDragging) {
			const { x: touchX, y: touchY } = getCanvasCoords(
				e.touches[0].clientX,
				e.touches[0].clientY
			);
			offsetX = dragStartOffsetX + (touchX - dragStartScreenX);
			offsetY = dragStartOffsetY + (touchY - dragStartScreenY);
			draw();
		}
	}

	function handleTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			isClick = true;
			isDragging = true;
			clickStartTime = Date.now();
			clickStartX = e.touches[0].clientX;
			clickStartY = e.touches[0].clientY;
			const { x, y } = getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY);
			dragStartScreenX = x;
			dragStartScreenY = y;
			dragStartOffsetX = offsetX;
			dragStartOffsetY = offsetY;
		} else if (e.touches.length === 2) {
			isClick = false;
			isDragging = false;
			lastTouchDistance = Math.hypot(
				e.touches[1].clientX - e.touches[0].clientX,
				e.touches[1].clientY - e.touches[0].clientY
			);
		}
	}

	function handleTouchEnd(e: TouchEvent) {
		if (e.touches.length === 0) {
			lastTouchDistance = 0;
			isDragging = false;
		}
		if (e.touches.length > 0) return;
		if (!isClick) return;

		const clickDuration = Date.now() - clickStartTime;
		const clickDistance = Math.sqrt(
			Math.pow(e.changedTouches[0].clientX - clickStartX, 2) +
				Math.pow(e.changedTouches[0].clientY - clickStartY, 2)
		);

		if (clickDuration < 300 && clickDistance < 15 && canvas) {
			const { x: touchX, y: touchY } = getCanvasCoords(
				e.changedTouches[0].clientX,
				e.changedTouches[0].clientY
			);
			const aud = getAuditoriumAt(touchX, touchY);
			if (aud) {
				onAuditoriumClick(aud);
			}
		}
		isClick = false;
	}

	function centerOnBuilding() {
		if (!canvas || !container) return;

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const section of buildingMap.sections) {
			minX = Math.min(minX, section.position.x);
			minY = Math.min(minY, section.position.y);
			maxX = Math.max(maxX, section.position.x + section.width);
			maxY = Math.max(maxY, section.position.y + section.height);
		}

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const width = maxX - minX;
		const height = maxY - minY;

		const rect = container.getBoundingClientRect();
		const scaleX = rect.width / (width + 100);
		const scaleY = rect.height / (height + 100);
		scale = Math.min(scaleX, scaleY, 1);

		offsetX = rect.width / 2 - centerX * scale;
		offsetY = rect.height / 2 - centerY * scale;
		draw();
	}

	function centerOnFirstFloor() {
		if (!canvas || !container) return;

		const firstFloorSections = buildingMap.sections.filter((s) => s.floor === 1);
		if (firstFloorSections.length === 0) {
			centerOnBuilding();
			return;
		}

		const firstSection = firstFloorSections.find((s) => s.id === 1) || firstFloorSections[0];

		const centerX = firstSection.position.x + firstSection.width / 2;
		const centerY = firstSection.position.y + firstSection.height / 2;
		const width = firstSection.width;
		const height = firstSection.height;

		const rect = container.getBoundingClientRect();
		const scaleX = rect.width / (width + 100);
		const scaleY = rect.height / (height + 100);
		scale = Math.min(scaleX, scaleY, 1.2);

		offsetX = rect.width / 2 - centerX * scale;
		offsetY = rect.height * 0.7 - centerY * scale;
		draw();
	}

	function centerOnRoute(route: Route, animate = true) {
		if (!canvas || !container || !route) return;

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		let polyline: Point[] = [];
		if (route.polyline && route.polyline.length >= 2) {
			polyline = route.polyline;
		} else if (route.path && route.path.length >= 2) {
			for (const aud of route.path) {
				const section = buildingMap.sections.find(
					(s) => s.id === aud.section && s.floor === aud.floor
				);
				if (!section) continue;
				polyline.push({
					x: section.position.x + aud.position.x + aud.width / 2,
					y: section.position.y + aud.position.y + aud.height / 2
				});
			}
		}

		if (polyline.length >= 2) {
			for (const point of polyline) {
				minX = Math.min(minX, point.x);
				minY = Math.min(minY, point.y);
				maxX = Math.max(maxX, point.x);
				maxY = Math.max(maxY, point.y);
			}
		}

		if (route.path && route.path.length > 0) {
			for (const aud of route.path) {
				const section = buildingMap.sections.find(
					(s) => s.id === aud.section && s.floor === aud.floor
				);
				if (!section) continue;
				const left = section.position.x + aud.position.x;
				const top = section.position.y + aud.position.y;
				const right = left + aud.width;
				const bottom = top + aud.height;

				minX = Math.min(minX, left);
				minY = Math.min(minY, top);
				maxX = Math.max(maxX, right);
				maxY = Math.max(maxY, bottom);
			}
		}

		if (minX === Infinity) return;

		const padding = 80;
		minX -= padding;
		minY -= padding;
		maxX += padding;
		maxY += padding;

		const centerX = (minX + maxX) / 2;
		const centerY = (minY + maxY) / 2;
		const width = maxX - minX;
		const height = maxY - minY;

		const rect = container.getBoundingClientRect();
		const scaleX = rect.width / width;
		const scaleY = rect.height / height;
		targetScale = Math.min(scaleX, scaleY, MAX_SCALE);

		targetOffsetX = rect.width / 2 - centerX * targetScale;
		targetOffsetY = rect.height / 2 - centerY * targetScale;

		if (
			animate &&
			typeof window !== 'undefined' &&
			typeof requestAnimationFrame !== 'undefined'
		) {
			startOffsetX = offsetX;
			startOffsetY = offsetY;
			startScale = scale;
			isAnimatingView = true;

			if (viewAnimRaf !== null) cancelAnimationFrame(viewAnimRaf);
			const viewAnimStartMs = performance.now();
			const tick = (now: number) => {
				const p = Math.min(1, (now - viewAnimStartMs) / VIEW_ANIM_MS);
				const ease = 1 - Math.pow(1 - p, 3);
				offsetX = startOffsetX + (targetOffsetX - startOffsetX) * ease;
				offsetY = startOffsetY + (targetOffsetY - startOffsetY) * ease;
				scale = startScale + (targetScale - startScale) * ease;
				draw();
				if (p < 1) {
					viewAnimRaf = requestAnimationFrame(tick);
				} else {
					viewAnimRaf = null;
					isAnimatingView = false;
				}
			};
			viewAnimRaf = requestAnimationFrame(tick);
		} else {
			offsetX = targetOffsetX;
			offsetY = targetOffsetY;
			scale = targetScale;
			draw();
		}
	}

	onMount(() => {
		if (!container || !canvas) return;
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		if (!(ctx as any).roundRect) {
			(ctx as any).roundRect = function (
				x: number,
				y: number,
				w: number,
				h: number,
				r: number
			) {
				if (w < 2 * r) r = w / 2;
				if (h < 2 * r) r = h / 2;
				this.beginPath();
				this.moveTo(x + r, y);
				this.arcTo(x + w, y, x + w, y + h, r);
				this.arcTo(x + w, y + h, x, y + h, r);
				this.arcTo(x, y + h, x, y, r);
				this.arcTo(x, y, x + w, y, r);
				this.closePath();
			};
		}

		const resizeCanvas = () => {
			if (!ctx) return;
			const rect = container.getBoundingClientRect();
			const dpr = window.devicePixelRatio || 1;

			const oldWidth = canvas.width > 0 ? canvas.width / dpr : 0;
			const oldHeight = canvas.height > 0 ? canvas.height / dpr : 0;

			canvas.width = rect.width * dpr;
			canvas.height = rect.height * dpr;

			canvas.style.width = rect.width + 'px';
			canvas.style.height = rect.height + 'px';

			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.scale(dpr, dpr);

			if (oldWidth > 0 && oldHeight > 0) {
				const scaleX = rect.width / oldWidth;
				const scaleY = rect.height / oldHeight;
				offsetX *= scaleX;
				offsetY *= scaleY;
			}

			if (ctx) {
				draw();
			}
		};

		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);

		canvas.addEventListener('wheel', handleWheel, { passive: false });
		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('mousedown', handleMouseDown);
		canvas.addEventListener('mouseup', handleMouseUp);
		canvas.addEventListener('mouseleave', () => {
			isDragging = false;
			if (hoveredAuditorium) {
				hoveredAuditorium = null;
				onAuditoriumHover(null);
				canvas.style.cursor = 'grab';
				draw();
			}
		});

		canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
		canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
		canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

		setTimeout(centerOnFirstFloor, 100);

		return () => {
			window.removeEventListener('resize', resizeCanvas);
			canvas.removeEventListener('wheel', handleWheel);
			canvas.removeEventListener('mousemove', handleMouseMove);
			canvas.removeEventListener('mousedown', handleMouseDown);
			canvas.removeEventListener('mouseup', handleMouseUp);
			canvas.removeEventListener('touchstart', handleTouchStart);
			canvas.removeEventListener('touchend', handleTouchEnd);
			canvas.removeEventListener('touchmove', handleTouchMove);
			if (routeAnimRaf !== null) {
				cancelAnimationFrame(routeAnimRaf);
				routeAnimRaf = null;
			}
			if (viewAnimRaf !== null) {
				cancelAnimationFrame(viewAnimRaf);
				viewAnimRaf = null;
			}
		};
	});

	$: if (selectedAuditorium !== null || routeStart !== null || routeEnd !== null) {
		draw();
	}

	let prevRouteId: string | null = null;
	let lastRoute: Route | null = null;
	$: if (currentRoute) {
		const routeId = `${currentRoute.path[0]?.id || ''}-${currentRoute.path[currentRoute.path.length - 1]?.id || ''}`;
		if (routeId !== prevRouteId) {
			prevRouteId = routeId;
			isRouteDisappearing = false;
			lastRoute = currentRoute;

			setTimeout(() => {
				if (currentRoute) {
					centerOnRoute(currentRoute, true);
				}
			}, 100);

			if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
				routeAnimProgress = 1;
				draw();
			} else {
				routeAnimStartMs = performance.now();
				routeAnimProgress = 0.001;

				if (routeAnimRaf !== null) cancelAnimationFrame(routeAnimRaf);
				const tick = (now: number) => {
					const p = Math.min(1, (now - routeAnimStartMs) / ROUTE_ANIM_MS);
					routeAnimProgress = p;
					draw();
					if (p < 1) {
						routeAnimRaf = requestAnimationFrame(tick);
					} else {
						routeAnimRaf = null;
					}
				};
				routeAnimRaf = requestAnimationFrame(tick);
			}
		}
	} else {
		if (lastRoute && prevRouteId !== null) {
			isRouteDisappearing = true;
			routeAnimStartMs = performance.now();
			const startProgress = routeAnimProgress;

			if (routeAnimRaf !== null) cancelAnimationFrame(routeAnimRaf);
			const tick = (now: number) => {
				const elapsed = now - routeAnimStartMs;
				const p = Math.max(0, 1 - elapsed / ROUTE_DISAPPEAR_MS);
				routeAnimProgress = startProgress * p;
				draw();
				if (p > 0) {
					routeAnimRaf = requestAnimationFrame(tick);
				} else {
					routeAnimRaf = null;
					routeAnimProgress = 0;
					lastRoute = null;
					prevRouteId = null;
					isRouteDisappearing = false;
					draw();
				}
			};
			routeAnimRaf = requestAnimationFrame(tick);
		} else {
			prevRouteId = null;
			lastRoute = null;
			isRouteDisappearing = false;
			if (routeAnimRaf !== null) {
				cancelAnimationFrame(routeAnimRaf);
				routeAnimRaf = null;
			}
			routeAnimProgress = 0;
			draw();
		}
	}
</script>

<div bind:this={container} class="relative h-full w-full overflow-hidden">
	<canvas
		bind:this={canvas}
		class="h-full w-full cursor-default"
		style="touch-action: none; display: block;"
	></canvas>
</div>

<style>
	div :global(canvas) {
		touch-action: none;
		-webkit-user-select: none;
		user-select: none;
	}
</style>
