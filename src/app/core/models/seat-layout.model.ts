export type LayoutItemType = 'seat' | 'walkway' | 'label' | 'space';
export type LabelDirection = 'horizontal' | 'vertical';

export interface LayoutLabel {
	type: 'label';
	text: string;
	direction: LabelDirection;
	span?: number; // How many grid cells to span
	className?: string;
}

export interface LayoutSeat {
	type: 'seat';
	id: string;
	label: string;
	seatType: 'regular' | 'premium' | 'vip' | 'recliner';
	status: 'available' | 'selected' | 'occupied';
	price: number;
}

export interface LayoutWalkway {
	type: 'walkway';
	span?: number; // How many grid cells to span
	label?: string;
}

export interface LayoutSpace {
	type: 'space';
	span?: number; // How many grid cells to span
}

export type LayoutItem = LayoutLabel | LayoutSeat | LayoutWalkway | LayoutSpace;

export interface LayoutSection {
	name: string;
	columns: number;
	rows: LayoutRow[];
}

export interface LayoutRow {
	items: LayoutItem[];
}
