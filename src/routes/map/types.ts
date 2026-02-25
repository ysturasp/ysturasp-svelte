export interface Point {
	x: number;
	y: number;
}

export interface CustomMapElement {
	type: 'line' | 'rect' | 'text';
	x?: number;
	y?: number;
	width?: number;
	height?: number;
	points?: Point[];
	text?: string;
	rotation?: number;
	fontSize?: number;
}

export interface Auditorium {
	id: string;
	name: string;
	position: Point;
	width: number;
	height: number;
	floor: number;
	section: number;
	capacity?: number;
	currentOccupancy?: number;
	scheduleLink?: string;
	description?: string;
}

export interface Connection {
	from: string;
	to: string;
	type: 'corridor' | 'stairs' | 'elevator';
	points: Point[];
}

export interface Section {
	id: number;
	floor: number;
	position: Point;
	width: number;
	height: number;
	auditoriums: Auditorium[];
	connections: Connection[];
	customElements?: CustomMapElement[];
}

export interface BuildingMap {
	sections: Section[];
	connections: Connection[];
	stairsBlocks?: Array<{ x: number; y: number; width: number; height: number; floor: number }>;
}

export interface Route {
	path: Auditorium[];
	polyline?: Point[];
	totalDistance: number;
	instructions: string[];
}

export interface AuditoriumStatus {
	isFree: boolean;
	lessonName?: string;
	teacherName?: string;
	groups?: string[];
	timeRange?: string;
}
