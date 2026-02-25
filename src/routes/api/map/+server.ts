import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { getPool } from '$lib/db/database';
import type {
	BuildingMap,
	Section,
	Auditorium,
	Connection,
	CustomMapElement
} from '../../map/types';

export const GET: RequestHandler = async () => {
	const pool = getPool(false);
	if (!pool) {
		return json({ error: 'Database not initialized' }, { status: 500 });
	}

	try {
		const sectionsRes = await pool.query(
			'SELECT * FROM map_sections ORDER BY floor ASC, section_id ASC'
		);
		const dbSections = sectionsRes.rows;

		const auditoriumsRes = await pool.query('SELECT * FROM map_auditoriums');
		const dbAuditoriums = auditoriumsRes.rows;

		const customElementsRes = await pool.query('SELECT * FROM map_custom_elements');
		const dbCustomElements = customElementsRes.rows;

		const connectionsRes = await pool.query('SELECT * FROM map_connections');
		const dbConnections = connectionsRes.rows;

		const stairsRes = await pool.query('SELECT * FROM map_stairs_blocks');
		const dbStairs = stairsRes.rows;

		const sections: Section[] = dbSections.map((s) => {
			const sectionAuds = dbAuditoriums
				.filter((a) => a.section_db_id === s.id)
				.map((a) => ({
					id: a.id,
					name: a.name,
					position: { x: a.x, y: a.y },
					width: a.width,
					height: a.height,
					floor: a.floor,
					section: a.section_id,
					capacity: a.capacity,
					description: a.description
				}));

			const sectionCustom = dbCustomElements
				.filter((ce) => ce.section_db_id === s.id)
				.map((ce) => ce.payload as unknown as CustomMapElement);

			return {
				id: s.section_id,
				floor: s.floor,
				position: { x: s.x, y: s.y },
				width: s.width,
				height: s.height,
				auditoriums: sectionAuds,
				connections: [],
				customElements: sectionCustom.length > 0 ? sectionCustom : undefined
			};
		});

		const connections: Connection[] = dbConnections.map((c) => ({
			from: c.from,
			to: c.to,
			type: c.type as any,
			points: c.points as any
		}));

		const stairsBlocks = dbStairs.map((sb) => ({
			x: sb.x,
			y: sb.y,
			width: sb.width,
			height: sb.height,
			floor: sb.floor
		}));

		const buildingMap: BuildingMap = {
			sections,
			connections,
			stairsBlocks
		};

		return json(buildingMap);
	} catch (error) {
		console.error('Failed to fetch map data:', error);
		return json({ error: 'Internal Server Error' }, { status: 500 });
	}
};
