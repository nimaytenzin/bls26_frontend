import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import {
	Movie,
	Screening,
	Theatre,
	Seat,
	BookingDetails,
	Ticket,
} from '../models/movie.interface';
import { Hall } from '../models/hall.interface';

@Injectable({
	providedIn: 'root',
})
export class MovieService {
	private movies: Movie[] = [
		{
			id: 1,
			title: 'Inception',
			description:
				'A skilled thief, the absolute best in the dangerous art of extraction, steals valuable secrets from deep within the subconscious during the dream state.',
			image: 'posters/inception1.png',
			rating: 'PG-13',
			duration: '2h 28min',
			genre: ['Action', 'Sci-Fi', 'Thriller'],
			trailerUrl: 'https://www.youtube.com/watch?v=YoHD9XEInc0',
			status: 'screening',
			releaseDate: new Date('2023-07-15'),
			language: 'English',
			cast: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy'],
			director: 'Christopher Nolan',
			price: 250,
		},
		{
			id: 2,
			title: 'With love from Bhutan',
			description:
				'A heartfelt journey through the breathtaking landscapes of Bhutan, exploring love, tradition, and the pursuit of happiness.',
			image: 'posters/movie1.png',
			rating: 'PG',
			duration: '1h 55min',
			genre: ['Drama', 'Romance'],
			trailerUrl: 'https://youtu.be/eZHC0HkA4e8',
			status: 'screening',
			releaseDate: new Date('2024-03-10'),
			language: 'Dzongkha',
			cast: ['Tenzin Norbu', 'Pema Lhamo', 'Karma Wangchuk'],
			director: 'Sonam Tashi',
			price: 200,
		},
		{
			id: 3,
			title: 'Oppenheimer',
			description:
				'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
			image: 'movies/oppenheimer.jpg',
			rating: 'R',
			duration: '3h 0min',
			genre: ['Biography', 'Drama', 'History'],
			trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
			status: 'screening',
			releaseDate: new Date('2023-07-21'),
			language: 'English',
			cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'],
			director: 'Christopher Nolan',
			price: 300,
		},
		{
			id: 4,
			title: 'Dune: Part Two',
			description:
				'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
			image: 'movies/dune.jpg',
			rating: 'PG-13',
			duration: '2h 46min',
			genre: ['Action', 'Adventure', 'Drama'],
			trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
			status: 'coming-soon',
			releaseDate: new Date('2024-03-01'),
			language: 'English',
			cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'],
			director: 'Denis Villeneuve',
			price: 280,
		},
	];

	private theatres: Theatre[] = [
		{
			id: 1,
			name: 'Lugar Theatre',
			location: 'Thimphu',
			city: 'Thimphu',
			capacity: 300, // Total capacity across all halls
			amenities: ['3D', 'Dolby Atmos', 'Recliner Seats', 'Food Court'],
		},
		{
			id: 2,
			name: 'City Cinema',
			location: 'Norzin Lam',
			city: 'Thimphu',
			capacity: 240, // Total capacity across all halls
			amenities: ['2D', '3D', 'Air Conditioning', 'Parking'],
		},
		{
			id: 3,
			name: 'Royal Cinema',
			location: 'Bumthang',
			city: 'Bumthang',
			capacity: 160, // Total capacity across all halls
			amenities: ['2D', 'Traditional Decor', 'Local Snacks'],
		},
	];

	private halls: Hall[] = [
		// Lugar Theatre Halls
		{
			id: 1,
			name: 'Hall A',
			description: 'Premium hall with Dolby Atmos and recliner seats',
			capacity: 150,
			rows: 10,
			columns: 15,
			screenStart: 5,
			screenSpan: 5,
			theatreId: 1,
		},
		{
			id: 2,
			name: 'Hall B',
			description: 'Standard hall with 3D capabilities',
			capacity: 120,
			rows: 8,
			columns: 15,
			screenStart: 4,
			screenSpan: 7,
			theatreId: 1,
		},
		{
			id: 3,
			name: 'VIP Hall',
			description: 'Luxury hall with premium seating',
			capacity: 30,
			rows: 3,
			columns: 10,
			screenStart: 3,
			screenSpan: 4,
			theatreId: 1,
		},
		// City Cinema Halls
		{
			id: 4,
			name: 'Screen 1',
			description: 'Large screen with 3D capabilities',
			capacity: 120,
			rows: 8,
			columns: 15,
			screenStart: 4,
			screenSpan: 7,
			theatreId: 2,
		},
		{
			id: 5,
			name: 'Screen 2',
			description: 'Standard screening room',
			capacity: 120,
			rows: 8,
			columns: 15,
			screenStart: 4,
			screenSpan: 7,
			theatreId: 2,
		},
		// Royal Cinema Halls
		{
			id: 6,
			name: 'Main Hall',
			description: 'Traditional cinema hall with local charm',
			capacity: 80,
			rows: 8,
			columns: 10,
			screenStart: 3,
			screenSpan: 4,
			theatreId: 3,
		},
		{
			id: 7,
			name: 'Heritage Hall',
			description: 'Smaller hall with traditional decor',
			capacity: 80,
			rows: 8,
			columns: 10,
			screenStart: 3,
			screenSpan: 4,
			theatreId: 3,
		},
	];

	private screenings: Screening[] = [];

	constructor() {
		this.generateScreenings();
	}

	private generateScreenings(): void {
		const today = new Date();
		const screenings: Screening[] = [];
		let screeningId = 1;

		// Generate screenings for the next 7 days
		for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
			const screeningDate = new Date(today);
			screeningDate.setDate(today.getDate() + dayOffset);

			// Generate screenings for each movie
			this.movies
				.filter((movie) => movie.status === 'screening')
				.forEach((movie) => {
					// Generate multiple screenings per day for each movie
					const times = ['10:00 AM', '02:00 PM', '05:00 PM', '08:30 PM'];

					times.forEach((time, timeIndex) => {
						// Distribute across different halls
						const hallIndex = (screeningId + timeIndex) % this.halls.length;
						const hall = this.halls[hallIndex];
						const theatre = this.theatres.find((t) => t.id === hall.theatreId)!;

						screenings.push({
							id: screeningId++,
							movieId: movie.id,
							theatreId: theatre.id,
							theatreName: theatre.name,
							hallId: hall.id,
							hallName: hall.name,
							date: new Date(screeningDate),
							time: time,
							availableSeats: Math.floor(hall.capacity * 0.7), // 70% availability
							totalSeats: hall.capacity,
							seatPricing: {
								basic: 399,
								premium: 499,
							},
						});
					});
				});
		}

		this.screenings = screenings;
	}

	private bookingsSubject = new BehaviorSubject<BookingDetails | null>(null);
	public currentBooking$ = this.bookingsSubject.asObservable();

	// Movie methods
	getAllMovies(): Observable<Movie[]> {
		return of(this.movies);
	}

	getMovieById(id: number): Observable<Movie | undefined> {
		const movie = this.movies.find((m) => m.id === id);
		return of(movie);
	}

	getMoviesByStatus(
		status: 'screening' | 'coming-soon' | 'ended'
	): Observable<Movie[]> {
		const filteredMovies = this.movies.filter((m) => m.status === status);
		return of(filteredMovies);
	}

	// Screening methods
	getScreeningsByMovieId(movieId: number): Observable<Screening[]> {
		const screenings = this.screenings.filter((s) => s.movieId === movieId);
		return of(screenings);
	}

	getScreeningById(id: number): Observable<Screening | undefined> {
		const screening = this.screenings.find((s) => s.id === id);
		return of(screening);
	}

	getScreeningsByDate(date: Date): Observable<Screening[]> {
		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);

		const screenings = this.screenings.filter((s) => {
			const screeningDate = new Date(s.date);
			screeningDate.setHours(0, 0, 0, 0);
			return screeningDate.getTime() === targetDate.getTime();
		});
		return of(screenings);
	}

	// Theatre methods
	getAllTheatres(): Observable<Theatre[]> {
		return of(this.theatres);
	}

	getTheatreById(id: number): Observable<Theatre | undefined> {
		const theatre = this.theatres.find((t) => t.id === id);
		return of(theatre);
	}

	// Hall methods
	getAllHalls(): Observable<Hall[]> {
		return of(this.halls);
	}

	getHallById(id: number): Observable<Hall | undefined> {
		const hall = this.halls.find((h) => h.id === id);
		return of(hall);
	}

	getHallsByTheatreId(theatreId: number): Observable<Hall[]> {
		const halls = this.halls.filter((h) => h.theatreId === theatreId);
		return of(halls);
	}

	// Seat methods
	getSeatsForScreening(screeningId: number): Observable<Seat[]> {
		// Generate seats based on hall configuration
		const screening = this.screenings.find((s) => s.id === screeningId);
		if (!screening) return of([]);

		const hall = this.halls.find((h) => h.id === screening.hallId);
		if (!hall) return of([]);

		const seats: Seat[] = [];
		const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

		for (let i = 0; i < Math.min(hall.rows, rows.length); i++) {
			for (let j = 1; j <= hall.columns; j++) {
				// Determine seat type based on hall and position
				// Front 3 rows are premium, rest are basic
				const seatType: 'basic' | 'premium' = i < 3 ? 'premium' : 'basic';

				const seatPrice =
					seatType === 'premium'
						? screening.seatPricing.premium
						: screening.seatPricing.basic;

				seats.push({
					id: `${rows[i]}${j}`,
					row: rows[i],
					number: j,
					type: seatType,
					price: seatPrice,
					isAvailable: Math.random() > 0.3, // 70% availability
					isSelected: false,
				});
			}
		}

		return of(seats.slice(0, hall.capacity));
	}

	// Booking methods
	setCurrentBooking(booking: BookingDetails): void {
		this.bookingsSubject.next(booking);
	}

	getCurrentBooking(): BookingDetails | null {
		return this.bookingsSubject.value;
	}

	clearCurrentBooking(): void {
		this.bookingsSubject.next(null);
	}

	// Payment simulation
	processPayment(
		bookingDetails: BookingDetails
	): Observable<{ success: boolean; transactionId?: string; error?: string }> {
		// Simulate payment processing
		return new Observable((observer) => {
			setTimeout(() => {
				const success = Math.random() > 0.1; // 90% success rate
				if (success) {
					observer.next({
						success: true,
						transactionId: 'TXN' + Date.now(),
					});
				} else {
					observer.next({
						success: false,
						error: 'Payment failed. Please try again.',
					});
				}
				observer.complete();
			}, 2000); // Simulate 2 second processing time
		});
	}

	// Ticket generation
	generateTicket(
		bookingDetails: BookingDetails,
		transactionId: string
	): Observable<Ticket> {
		return new Observable((observer) => {
			const movie = this.movies.find((m) => m.id === bookingDetails.movieId);
			const screening = this.screenings.find(
				(s) => s.id === bookingDetails.screeningId
			);

			if (movie && screening) {
				const ticket: Ticket = {
					id: 'TKT' + Date.now(),
					bookingId: transactionId,
					movieTitle: movie.title,
					theatreName: screening.theatreName,
					hallName: screening.hallName,
					date: screening.date,
					time: screening.time,
					seats: bookingDetails.selectedSeats.map((seat) => seat.id),
					totalAmount: bookingDetails.totalAmount,
					qrCode: this.generateQRCode(transactionId),
					status: 'confirmed',
				};
				observer.next(ticket);
			}
			observer.complete();
		});
	}

	private generateQRCode(data: string): string {
		// In a real app, you would use a QR code library
		return `data:image/svg+xml;base64,${btoa(
			`<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="black"/><text x="50" y="50" fill="white" text-anchor="middle">${data}</text></svg>`
		)}`;
	}

	// Search and filter methods
	searchMovies(query: string): Observable<Movie[]> {
		const lowerQuery = query.toLowerCase();
		const results = this.movies.filter(
			(movie) =>
				movie.title.toLowerCase().includes(lowerQuery) ||
				movie.description.toLowerCase().includes(lowerQuery) ||
				movie.genre.some((g) => g.toLowerCase().includes(lowerQuery)) ||
				movie.cast.some((c) => c.toLowerCase().includes(lowerQuery))
		);
		return of(results);
	}

	getMoviesByGenre(genre: string): Observable<Movie[]> {
		const results = this.movies.filter((movie) => movie.genre.includes(genre));
		return of(results);
	}

	// Utility methods for scheduling
	getAvailableDates(): Observable<Date[]> {
		const today = new Date();
		const dates: Date[] = [];

		for (let i = 0; i < 7; i++) {
			const date = new Date(today);
			date.setDate(today.getDate() + i);
			dates.push(date);
		}

		return of(dates);
	}

	getScreeningsByMovieAndDate(
		movieId: number,
		date: Date
	): Observable<Screening[]> {
		const targetDate = new Date(date);
		targetDate.setHours(0, 0, 0, 0);

		const screenings = this.screenings.filter((s) => {
			const screeningDate = new Date(s.date);
			screeningDate.setHours(0, 0, 0, 0);
			return (
				s.movieId === movieId &&
				screeningDate.getTime() === targetDate.getTime()
			);
		});

		return of(screenings);
	}

	getTheatresForMovie(movieId: number): Observable<Theatre[]> {
		const movieScreenings = this.screenings.filter(
			(s) => s.movieId === movieId
		);
		const theatreIds = [...new Set(movieScreenings.map((s) => s.theatreId))];
		const theatres = this.theatres.filter((t) => theatreIds.includes(t.id));
		return of(theatres);
	}
}
