// Hall interface based on the Sequelize entity structure
export interface Hall {
	id: number;
	name: string;
	description?: string;
	capacity: number;
	rows: number;
	columns: number;
	screenStart: number;
	screenSpan: number;
	theatreId: number;
}
