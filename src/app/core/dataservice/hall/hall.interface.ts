export interface Hall {
	id: string;
	name: string;
	theatreId: string;
	capacity: number;
	status: string;
	createdAt?: Date;
	updatedAt?: Date;
}
