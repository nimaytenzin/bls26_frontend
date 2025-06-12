// Theatre Service for API operations and data management

import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, delay, map } from 'rxjs';
import {
	Theatre,
	Hall,
	CreateTheatreDTO,
	UpdateTheatreDTO,
	CreateHallDTO,
	UpdateHallDTO,
	TheatreStats,
	HallStats,
	TheatreSearchParams,
	HallSearchParams,
	TheatreStatus,
	HallStatus,
	TheatreFilter,
	HallFilter,
} from './theatre.dto';
import {
	getBhutaneseTheatres,
	getBhutaneseHallsByTheatre,
	getTheatreStats,
	BHUTANESE_THEATRE_MOCK_DATA,
	BHUTANESE_HALLS_MOCK_DATA,
} from './theatre.mock';

@Injectable({
	providedIn: 'root',
})
export class TheatreService {
	private theatresSubject = new BehaviorSubject<Theatre[]>(
		getBhutaneseTheatres()
	);
	private hallsSubject = new BehaviorSubject<Hall[]>(BHUTANESE_HALLS_MOCK_DATA);

	public theatres$ = this.theatresSubject.asObservable();
	public halls$ = this.hallsSubject.asObservable();

	constructor() {}

	// Theatre CRUD Operations
	getTheatres(params?: TheatreSearchParams): Observable<{
		data: Theatre[];
		total: number;
		page: number;
		limit: number;
	}> {
		let theatres = getBhutaneseTheatres();

		// Apply search query
		if (params?.query) {
			const query = params.query.toLowerCase();
			theatres = theatres.filter(
				(theatre) =>
					theatre.name.toLowerCase().includes(query) ||
					theatre.location.toLowerCase().includes(query) ||
					theatre.city.toLowerCase().includes(query) ||
					theatre.district.toLowerCase().includes(query)
			);
		}

		// Apply filters
		if (params?.filter) {
			theatres = this.applyTheatreFilters(theatres, params.filter);
		}

		// Apply sorting
		if (params?.sortBy) {
			theatres = this.sortTheatres(
				theatres,
				params.sortBy,
				params.sortOrder || 'asc'
			);
		}

		// Apply pagination
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const startIndex = (page - 1) * limit;
		const paginatedTheatres = theatres.slice(startIndex, startIndex + limit);

		return of({
			data: paginatedTheatres,
			total: theatres.length,
			page,
			limit,
		}).pipe(delay(500)); // Simulate API delay
	}

	getTheatreById(id: string): Observable<Theatre | null> {
		const theatre = getBhutaneseTheatres().find((t) => t.id === id);
		return of(theatre || null).pipe(delay(300));
	}

	createTheatre(dto: CreateTheatreDTO): void {
		// const newTheatre: Theatre = {
		// 	id: `theatre-${Date.now()}`,
		// 	...dto,
		// 	status: TheatreStatus.ACTIVE,
		// 	totalHalls: 0,
		// 	totalSeats: 0,
		// 	createdAt: new Date(),
		// 	updatedAt: new Date(),
		// 	halls: [],
		// };
		// const currentTheatres = this.theatresSubject.value;
		// const updatedTheatres = [...currentTheatres, newTheatre];
		// this.theatresSubject.next(updatedTheatres);
		// return of(newTheatre).pipe(delay(800));
	}

	updateTheatre(dto: UpdateTheatreDTO): Observable<Theatre> {
		const currentTheatres = this.theatresSubject.value;
		const theatreIndex = currentTheatres.findIndex((t) => t.id === dto.id);

		if (theatreIndex === -1) {
			throw new Error('Theatre not found');
		}

		const updatedTheatre: Theatre = {
			...currentTheatres[theatreIndex],
			...dto,
			updatedAt: new Date(),
		};

		const updatedTheatres = [...currentTheatres];
		updatedTheatres[theatreIndex] = updatedTheatre;
		this.theatresSubject.next(updatedTheatres);

		return of(updatedTheatre).pipe(delay(600));
	}

	deleteTheatre(id: string): Observable<boolean> {
		const currentTheatres = this.theatresSubject.value;
		const updatedTheatres = currentTheatres.filter((t) => t.id !== id);
		this.theatresSubject.next(updatedTheatres);

		// Also delete associated halls
		const currentHalls = this.hallsSubject.value;
		const updatedHalls = currentHalls.filter((h) => h.theatreId !== id);
		this.hallsSubject.next(updatedHalls);

		return of(true).pipe(delay(500));
	}

	// Hall CRUD Operations
	getHalls(params?: HallSearchParams): Observable<{
		data: Hall[];
		total: number;
		page: number;
		limit: number;
	}> {
		let halls = [...BHUTANESE_HALLS_MOCK_DATA];

		// Apply search query
		if (params?.query) {
			const query = params.query.toLowerCase();
			halls = halls.filter(
				(hall) =>
					hall.name.toLowerCase().includes(query) ||
					hall.type.toLowerCase().includes(query)
			);
		}

		// Apply filters
		if (params?.filter) {
			halls = this.applyHallFilters(halls, params.filter);
		}

		// Apply sorting
		if (params?.sortBy) {
			halls = this.sortHalls(halls, params.sortBy, params.sortOrder || 'asc');
		}

		// Apply pagination
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const startIndex = (page - 1) * limit;
		const paginatedHalls = halls.slice(startIndex, startIndex + limit);

		return of({
			data: paginatedHalls,
			total: halls.length,
			page,
			limit,
		}).pipe(delay(400));
	}

	getHallsByTheatre(theatreId: string): Observable<Hall[]> {
		const halls = getBhutaneseHallsByTheatre(theatreId);
		return of(halls).pipe(delay(300));
	}

	getHallById(id: string): Observable<Hall | null> {
		const hall = BHUTANESE_HALLS_MOCK_DATA.find((h) => h.id === id);
		return of(hall || null).pipe(delay(250));
	}

	createHall(dto: CreateHallDTO): Observable<Hall> {
		const newHall: Hall = {
			id: `hall-${Date.now()}`,
			...dto,
			status: HallStatus.ACTIVE,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const currentHalls = this.hallsSubject.value;
		const updatedHalls = [...currentHalls, newHall];
		this.hallsSubject.next(updatedHalls);

		// Update theatre total halls and seats
		this.updateTheatreTotals(dto.theatreId);

		return of(newHall).pipe(delay(700));
	}

	updateHall(dto: UpdateHallDTO): Observable<Hall> {
		const currentHalls = this.hallsSubject.value;
		const hallIndex = currentHalls.findIndex((h) => h.id === dto.id);

		if (hallIndex === -1) {
			throw new Error('Hall not found');
		}

		const updatedHall: Hall = {
			...currentHalls[hallIndex],
			...dto,
			updatedAt: new Date(),
		};

		const updatedHalls = [...currentHalls];
		updatedHalls[hallIndex] = updatedHall;
		this.hallsSubject.next(updatedHalls);

		// Update theatre totals if capacity changed
		if (dto.capacity !== undefined) {
			this.updateTheatreTotals(updatedHall.theatreId);
		}

		return of(updatedHall).pipe(delay(550));
	}

	deleteHall(id: string): Observable<boolean> {
		const currentHalls = this.hallsSubject.value;
		const hallToDelete = currentHalls.find((h) => h.id === id);

		if (!hallToDelete) {
			throw new Error('Hall not found');
		}

		const updatedHalls = currentHalls.filter((h) => h.id !== id);
		this.hallsSubject.next(updatedHalls);

		// Update theatre totals
		this.updateTheatreTotals(hallToDelete.theatreId);

		return of(true).pipe(delay(450));
	}

	// Statistics and Analytics
	getTheatreStats(): Observable<TheatreStats> {
		return of(getTheatreStats()).pipe(delay(600));
	}

	getHallStats(hallId: string): Observable<HallStats> {
		// Mock hall statistics
		const mockStats: HallStats = {
			totalShows: Math.floor(Math.random() * 100) + 50,
			totalBookings: Math.floor(Math.random() * 1000) + 500,
			averageOccupancy: Math.floor(Math.random() * 40) + 60,
			revenue: Math.floor(Math.random() * 100000) + 50000,
			popularShowTimes: ['7:00 PM', '9:30 PM', '2:00 PM'],
			seatUtilization: [
				{ category: 'regular' as any, utilization: 75 },
				{ category: 'premium' as any, utilization: 68 },
				{ category: 'vip' as any, utilization: 82 },
			],
		};

		return of(mockStats).pipe(delay(400));
	}

	// Bulk Operations
	bulkUpdateTheatreStatus(
		theatreIds: string[],
		status: TheatreStatus
	): Observable<boolean> {
		const currentTheatres = this.theatresSubject.value;
		const updatedTheatres = currentTheatres.map((theatre) =>
			theatreIds.includes(theatre.id)
				? { ...theatre, status, updatedAt: new Date() }
				: theatre
		);

		this.theatresSubject.next(updatedTheatres);
		return of(true).pipe(delay(800));
	}

	bulkUpdateHallStatus(
		hallIds: string[],
		status: HallStatus
	): Observable<boolean> {
		const currentHalls = this.hallsSubject.value;
		const updatedHalls = currentHalls.map((hall) =>
			hallIds.includes(hall.id)
				? { ...hall, status, updatedAt: new Date() }
				: hall
		);

		this.hallsSubject.next(updatedHalls);
		return of(true).pipe(delay(700));
	}

	bulkDeleteTheatres(theatreIds: string[]): Observable<boolean> {
		const currentTheatres = this.theatresSubject.value;
		const currentHalls = this.hallsSubject.value;

		const updatedTheatres = currentTheatres.filter(
			(t) => !theatreIds.includes(t.id)
		);
		const updatedHalls = currentHalls.filter(
			(h) => !theatreIds.includes(h.theatreId)
		);

		this.theatresSubject.next(updatedTheatres);
		this.hallsSubject.next(updatedHalls);

		return of(true).pipe(delay(900));
	}

	// Utility Methods
	private applyTheatreFilters(
		theatres: Theatre[],
		filter: TheatreFilter
	): Theatre[] {
		return theatres.filter((theatre) => {
			if (filter.status && !filter.status.includes(theatre.status))
				return false;
			if (filter.city && !filter.city.includes(theatre.city)) return false;
			if (filter.district && !filter.district.includes(theatre.district))
				return false;
			if (filter.minHalls && theatre.totalHalls < filter.minHalls) return false;
			if (filter.maxHalls && theatre.totalHalls > filter.maxHalls) return false;
			if (filter.minSeats && theatre.totalSeats < filter.minSeats) return false;
			if (filter.maxSeats && theatre.totalSeats > filter.maxSeats) return false;
			if (
				filter.facilities &&
				!filter.facilities.every((f) => theatre.facilities.includes(f))
			)
				return false;

			return true;
		});
	}

	private applyHallFilters(halls: Hall[], filter: HallFilter): Hall[] {
		return halls.filter((hall) => {
			if (filter.theatreId && hall.theatreId !== filter.theatreId) return false;
			if (filter.type && !filter.type.includes(hall.type)) return false;
			if (filter.status && !filter.status.includes(hall.status)) return false;
			if (filter.minCapacity && hall.capacity < filter.minCapacity)
				return false;
			if (filter.maxCapacity && hall.capacity > filter.maxCapacity)
				return false;
			if (
				filter.features &&
				!filter.features.every((f) => hall.features.includes(f))
			)
				return false;
			if (filter.soundSystem && !filter.soundSystem.includes(hall.soundSystem))
				return false;
			if (
				filter.projectionType &&
				!filter.projectionType.some((p) => hall.projectionType.includes(p))
			)
				return false;
			if (
				filter.accessibility &&
				!filter.accessibility.every((a) => hall.accessibility.includes(a))
			)
				return false;

			return true;
		});
	}

	private sortTheatres(
		theatres: Theatre[],
		sortBy: string,
		sortOrder: 'asc' | 'desc'
	): Theatre[] {
		return theatres.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'location':
					comparison = a.location.localeCompare(b.location);
					break;
				case 'totalHalls':
					comparison = a.totalHalls - b.totalHalls;
					break;
				case 'totalSeats':
					comparison = a.totalSeats - b.totalSeats;
					break;
				case 'createdAt':
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
					break;
				default:
					comparison = 0;
			}

			return sortOrder === 'desc' ? -comparison : comparison;
		});
	}

	private sortHalls(
		halls: Hall[],
		sortBy: string,
		sortOrder: 'asc' | 'desc'
	): Hall[] {
		return halls.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'type':
					comparison = a.type.localeCompare(b.type);
					break;
				case 'capacity':
					comparison = a.capacity - b.capacity;
					break;
				case 'status':
					comparison = a.status.localeCompare(b.status);
					break;
				case 'createdAt':
					comparison = a.createdAt.getTime() - b.createdAt.getTime();
					break;
				default:
					comparison = 0;
			}

			return sortOrder === 'desc' ? -comparison : comparison;
		});
	}

	private updateTheatreTotals(theatreId: string): void {
		const currentTheatres = this.theatresSubject.value;
		const currentHalls = this.hallsSubject.value;

		const theatreHalls = currentHalls.filter((h) => h.theatreId === theatreId);
		const totalHalls = theatreHalls.length;
		const totalSeats = theatreHalls.reduce(
			(sum, hall) => sum + hall.capacity,
			0
		);

		const updatedTheatres = currentTheatres.map((theatre) =>
			theatre.id === theatreId
				? { ...theatre, totalHalls, totalSeats, updatedAt: new Date() }
				: theatre
		);

		this.theatresSubject.next(updatedTheatres);
	}

	// Search suggestions
	getTheatreSearchSuggestions(query: string): Observable<string[]> {
		const theatres = getBhutaneseTheatres();
		const suggestions = new Set<string>();

		theatres.forEach((theatre) => {
			if (theatre.name.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(theatre.name);
			}
			if (theatre.location.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(theatre.location);
			}
			if (theatre.city.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(theatre.city);
			}
		});

		return of(Array.from(suggestions).slice(0, 5)).pipe(delay(200));
	}

	getHallSearchSuggestions(query: string): Observable<string[]> {
		const halls = BHUTANESE_HALLS_MOCK_DATA;
		const suggestions = new Set<string>();

		halls.forEach((hall) => {
			if (hall.name.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(hall.name);
			}
			if (hall.type.toLowerCase().includes(query.toLowerCase())) {
				suggestions.add(hall.type);
			}
		});

		return of(Array.from(suggestions).slice(0, 5)).pipe(delay(200));
	}
}
