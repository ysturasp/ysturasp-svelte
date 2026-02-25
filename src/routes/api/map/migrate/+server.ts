import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getPool } from '$lib/db/database';

const SECTION_WIDTH = 280;
const SECTION_HEIGHT = 120;
const SECTION_SPACING = 50;
const STAIRS_WIDTH = 30;
const FLOOR_SPACING = 20;
const SECTION_STEP = 15;
const ROOMS_PER_ROW = 7;

const SECTION_PADDING_X = 0;
const SECTION_PADDING_Y = 0;
const CORRIDOR_HEIGHT = 32;

const roomWidth = SECTION_WIDTH / ROOMS_PER_ROW;
const roomHeight = (SECTION_HEIGHT - CORRIDOR_HEIGHT) / 2;

const topRowY = 0;
const corridorTopY = roomHeight;
const corridorBottomY = corridorTopY + CORRIDOR_HEIGHT;
const bottomRowY = corridorBottomY;

export const POST: RequestHandler = async () => {
	const pool = getPool(false);
	if (!pool) return json({ error: 'Database not initialized' }, { status: 500 });

	try {
		console.log('[Migration] Starting wide corridor migration...');

		await pool.query('DELETE FROM map_connections');
		await pool.query('DELETE FROM map_stairs_blocks');
		await pool.query('DELETE FROM map_auditoriums');
		await pool.query('DELETE FROM map_custom_elements');
		await pool.query('DELETE FROM map_sections');

		const TOTAL_FLOORS = 9;
		for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
			for (let sectionId = 1; sectionId <= 3; sectionId++) {
				const sectionDbId = `section-${sectionId}-${floor}`;
				const sectionX = (sectionId - 1) * (SECTION_WIDTH + SECTION_SPACING);
				const sectionY =
					(TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) +
					(sectionId - 1) * SECTION_STEP;

				await pool.query(
					`INSERT INTO map_sections (id, floor, section_id, x, y, width, height) 
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
					[
						sectionDbId,
						floor,
						sectionId,
						sectionX,
						sectionY,
						SECTION_WIDTH,
						SECTION_HEIGHT
					]
				);

				if (floor === 1 && sectionId === 1) {
					await seedFirstFloor(pool, sectionDbId);
					continue;
				}

				if (floor === 6 && sectionId === 2) continue;

				const sectionOffset = (sectionId - 1) * 14;

				const horizontalLines = [
					{ x1: 0, y1: corridorTopY, x2: SECTION_WIDTH, y2: corridorTopY },
					{ x1: 0, y1: corridorBottomY, x2: SECTION_WIDTH, y2: corridorBottomY }
				];

				for (const line of horizontalLines) {
					await pool.query(
						`INSERT INTO map_custom_elements (section_db_id, type, payload) VALUES ($1, $2, $3)`,
						[
							sectionDbId,
							'line',
							JSON.stringify({
								type: 'line',
								points: [
									{ x: line.x1, y: line.y1 },
									{ x: line.x2, y: line.y2 }
								]
							})
						]
					);
				}

				for (let i = 1; i < ROOMS_PER_ROW; i++) {
					const x = i * roomWidth;
					await pool.query(
						`INSERT INTO map_custom_elements (section_db_id, type, payload) VALUES ($1, $2, $3)`,
						[
							sectionDbId,
							'line',
							JSON.stringify({
								type: 'line',
								points: [
									{ x, y: topRowY },
									{ x, y: corridorTopY }
								]
							})
						]
					);
					await pool.query(
						`INSERT INTO map_custom_elements (section_db_id, type, payload) VALUES ($1, $2, $3)`,
						[
							sectionDbId,
							'line',
							JSON.stringify({
								type: 'line',
								points: [
									{ x, y: corridorBottomY },
									{ x, y: corridorBottomY + roomHeight }
								]
							})
						]
					);
				}

				for (let i = 0; i < ROOMS_PER_ROW; i++) {
					const x = i * roomWidth;
					const topRoomNum = floor * 100 + sectionOffset + (i + 1);
					await pool.query(
						`INSERT INTO map_auditoriums (id, section_db_id, name, x, y, width, height, floor, section_id) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
						[
							`${topRoomNum}`,
							sectionDbId,
							`${topRoomNum}`,
							x,
							topRowY,
							roomWidth,
							roomHeight,
							floor,
							sectionId
						]
					);

					const bottomRoomNum = floor * 100 + sectionOffset + (ROOMS_PER_ROW + i + 1);
					await pool.query(
						`INSERT INTO map_auditoriums (id, section_db_id, name, x, y, width, height, floor, section_id) 
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
						[
							`${bottomRoomNum}`,
							sectionDbId,
							`${bottomRoomNum}`,
							x,
							bottomRowY,
							roomWidth,
							roomHeight,
							floor,
							sectionId
						]
					);
				}
			}
		}

		await seedInfrastructure(pool, TOTAL_FLOORS);

		return json({ success: true, message: 'Map migrated with wide corridor' });
	} catch (error) {
		console.error('Migration failed:', error);
		return json({ error: 'Migration failed', detail: String(error) }, { status: 500 });
	}
};

async function seedFirstFloor(pool: any, sectionDbId: string) {
	const firstFloorAuds = [
		{
			id: '102',
			name: '102',
			position: { x: 0, y: 0 },
			width: 40,
			height: 35,
			description: 'Центр карьеры'
		},
		{
			id: '104',
			name: '104',
			position: { x: 40, y: 0 },
			width: 55,
			height: 35,
			description: 'Приём и выдача заявок'
		},
		{
			id: '105',
			name: '105',
			position: { x: 95, y: 0 },
			width: 40,
			height: 35,
			description: 'Копировальный центр'
		},
		{
			id: '103',
			name: '103',
			position: { x: 0, y: 45 },
			width: 75,
			height: 25,
			description: 'Приём и выдача заявок'
		},
		{
			id: 'вход',
			name: 'вход',
			position: { x: 150, y: 108 },
			width: 60,
			height: 12,
			description: 'Главный вход в корпус Г.'
		}
	];

	for (const aud of firstFloorAuds) {
		await pool.query(
			`INSERT INTO map_auditoriums (id, section_db_id, name, x, y, width, height, floor, section_id, description) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
			[
				aud.id,
				sectionDbId,
				aud.name,
				aud.position.x,
				aud.position.y,
				aud.width,
				aud.height,
				1,
				1,
				aud.description
			]
		);
	}

	const firstFloorLines = [
		{
			points: [
				{ x: 40, y: 0 },
				{ x: 40, y: 35 }
			]
		},
		{
			points: [
				{ x: 95, y: 0 },
				{ x: 95, y: 35 }
			]
		},
		{
			points: [
				{ x: 135, y: 0 },
				{ x: 135, y: 50 }
			]
		},
		{
			points: [
				{ x: 135, y: 50 },
				{ x: 240, y: 50 }
			]
		},
		{
			points: [
				{ x: 195, y: 0 },
				{ x: 195, y: 35 }
			]
		},
		{
			points: [
				{ x: 0, y: 35 },
				{ x: 195, y: 35 }
			]
		},
		{
			points: [
				{ x: 0, y: 45 },
				{ x: 75, y: 45 }
			]
		},
		{
			points: [
				{ x: 75, y: 45 },
				{ x: 75, y: 70 }
			]
		},
		{
			points: [
				{ x: 0, y: 70 },
				{ x: 75, y: 70 }
			]
		},
		{
			points: [
				{ x: 0, y: 45 },
				{ x: 0, y: 70 }
			]
		},
		{
			points: [
				{ x: 150, y: 108 },
				{ x: 150, y: 120 }
			]
		},
		{
			points: [
				{ x: 210, y: 108 },
				{ x: 210, y: 120 }
			]
		},
		{
			points: [
				{ x: 150, y: 108 },
				{ x: 210, y: 108 }
			]
		},
		{
			points: [
				{ x: 240, y: 30 },
				{ x: 280, y: 30 }
			]
		},
		{
			points: [
				{ x: 240, y: 30 },
				{ x: 240, y: 70 }
			]
		},
		{
			points: [
				{ x: 240, y: 70 },
				{ x: 280, y: 70 }
			]
		},
		{
			points: [
				{ x: 245, y: 70 },
				{ x: 245, y: 120 }
			]
		}
	];

	for (const line of firstFloorLines) {
		await pool.query(
			`INSERT INTO map_custom_elements (section_db_id, type, payload) VALUES ($1, $2, $3)`,
			[sectionDbId, 'line', JSON.stringify({ type: 'line', points: line.points })]
		);
	}

	const firstFloorCustom = [
		{ type: 'text', text: 'гардероб', x: 165, y: 17, fontSize: 8 },
		{ type: 'text', text: 'банкоматы', x: 106, y: 113, fontSize: 8 }
	];

	for (const ce of firstFloorCustom) {
		await pool.query(
			`INSERT INTO map_custom_elements (section_db_id, type, payload) VALUES ($1, $2, $3)`,
			[sectionDbId, ce.type, JSON.stringify(ce)]
		);
	}
}

async function seedInfrastructure(pool: any, TOTAL_FLOORS: number) {
	for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
		const sx1 = SECTION_WIDTH + (SECTION_SPACING - STAIRS_WIDTH) / 2;
		const sy1 = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) + SECTION_STEP / 2;
		await pool.query(
			`INSERT INTO map_stairs_blocks (floor, x, y, width, height) VALUES ($1, $2, $3, $4, $5)`,
			[floor, sx1, sy1, STAIRS_WIDTH, SECTION_HEIGHT + SECTION_STEP]
		);

		const sx2 = SECTION_WIDTH * 2 + SECTION_SPACING + (SECTION_SPACING - STAIRS_WIDTH) / 2;
		const sy2 = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING) + SECTION_STEP;
		await pool.query(
			`INSERT INTO map_stairs_blocks (floor, x, y, width, height) VALUES ($1, $2, $3, $4, $5)`,
			[floor, sx2, sy2, STAIRS_WIDTH, SECTION_HEIGHT + SECTION_STEP]
		);
	}

	for (let sId = 1; sId <= 3; sId++) {
		for (let floor = 1; floor <= TOTAL_FLOORS - 1; floor++) {
			const sX = (sId - 1) * (SECTION_WIDTH + SECTION_SPACING);
			const cY = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING);
			const pts = [
				{ x: sX + SECTION_WIDTH - 30, y: cY + SECTION_HEIGHT },
				{ x: sX + SECTION_WIDTH - 30, y: cY + SECTION_HEIGHT + FLOOR_SPACING }
			];
			await pool.query(
				`INSERT INTO map_connections ("from", "to", type, points) VALUES ($1, $2, $3, $4)`,
				[
					`section-${sId}-${floor}`,
					`section-${sId}-${floor + 1}`,
					'stairs',
					JSON.stringify(pts)
				]
			);
		}
	}

	for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
		const sY = (TOTAL_FLOORS - floor) * (SECTION_HEIGHT + FLOOR_SPACING);
		const pts1 = [
			{ x: SECTION_WIDTH, y: sY + SECTION_HEIGHT / 2 },
			{ x: SECTION_WIDTH + SECTION_SPACING, y: sY + SECTION_HEIGHT / 2 + SECTION_STEP }
		];
		await pool.query(
			`INSERT INTO map_connections ("from", "to", type, points) VALUES ($1, $2, $3, $4)`,
			[`section-1-${floor}`, `section-2-${floor}`, 'stairs', JSON.stringify(pts1)]
		);

		const pts2 = [
			{ x: SECTION_WIDTH * 2 + SECTION_SPACING, y: sY + SECTION_HEIGHT / 2 + SECTION_STEP },
			{
				x: SECTION_WIDTH * 2 + SECTION_SPACING * 2,
				y: sY + SECTION_HEIGHT / 2 + SECTION_STEP * 2
			}
		];
		await pool.query(
			`INSERT INTO map_connections ("from", "to", type, points) VALUES ($1, $2, $3, $4)`,
			[`section-2-${floor}`, `section-3-${floor}`, 'stairs', JSON.stringify(pts2)]
		);
	}
}
