import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntil, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../primeng.modules';
import { ScreeningDataService } from '../../../../core/dataservice/screening/screening.dataservice';
import { MovieApiDataService } from '../../../../core/dataservice/movie/movie-api.dataservice';
import { HallDataService } from '../../../../core/dataservice/hall/hall.dataservice';
import { TheatreDataService } from '../../../../core/dataservice/theatre/theatre.dataservice';
import { LanguageDataService } from '../../../../core/dataservice/language/language.dataservice';
import { BASEAPI_URL } from '../../../../core/constants/constants';
import { AdminScreeningCreateComponent } from '../components/admin-screening-create/admin-screening-create.component';
import { AdminScreeningEditComponent } from '../components/admin-screening-edit/admin-screening-edit.component';
import { AdminScreeningDetailedViewComponent } from '../components/admin-screening-detailed-view/admin-screening-detailed-view.component';

import { Screening } from '../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../core/dataservice/theatre/theatre.interface';
import { Language } from '../../../../core/dataservice/language/language.interface';
import { SeatCategory } from '../../../../core/dataservice/seat-category/seat-category.interface';
import { PaginatedData } from '../../../../core/utility/pagination.interface';
import { AdminScreeningsByMovieComponent } from '../components/admin-screenings-by-movie/admin-screenings-by-movie.component';
import { AdminScreeningsByTheatreComponent } from '../components/admin-screenings-by-theatre/admin-screenings-by-theatre.component';

@Component({
	selector: 'app-admin-master-screening',
	templateUrl: './admin-master-screening.component.html',
	styleUrls: ['./admin-master-screening.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminMasterScreeningComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	ref: DynamicDialogRef | undefined;
	// Data
	screenings: Screening[] = [];
	movies: Movie[] = [];
	theatres: Theatre[] = [];
	halls: Hall[] = [];
	languages: Language[] = [];
	seatCategories: SeatCategory[] = [];

	//form
	searchMovieId: number | null = null;
	searchTheatreId: number | null = null;

	// Form
	screeningForm!: FormGroup;
	priceForm!: FormGroup;

	minDate = new Date();

	// UI State
	loading = false;
	showCreateDialog = false;
	showEditDialog = false;
	isSubmitting = false;
	selectedScreening: Screening | null = null;
	currentStep = 1;
	totalSteps = 3;

	// Filters
	filterForm!: FormGroup;
	filteredScreenings: Screening[] = [];

	// Tab management
	activeTabIndex = 0; // 0 = Current & Upcoming, 1 = Past

	// Pagination for current/upcoming screenings
	currentScreeningsPagination: PaginatedData<Screening> | null = null;
	currentScreeningsPage = 1;
	currentScreeningsPageSize = 10;

	// Pagination for past screenings
	pastScreeningsPagination: PaginatedData<Screening> | null = null;
	pastScreeningsPage = 1;
	pastScreeningsPageSize = 10;

	// View options
	viewMode: 'list' | 'calendar' = 'list';

	constructor(
		private fb: FormBuilder,
		private screeningService: ScreeningDataService,
		private movieService: MovieApiDataService,
		private hallService: HallDataService,
		private theatreService: TheatreDataService,
		private languageService: LanguageDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {
		this.initializeForms();
	}

	ngOnInit(): void {
		this.loadInitialData();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeForms(): void {
		this.screeningForm = this.fb.group({
			movieId: ['', [Validators.required]],
			theatreId: ['', [Validators.required]],
			hallId: ['', [Validators.required]],
			date: ['', [Validators.required]],
			startTime: ['', [Validators.required]],
			endTime: ['', [Validators.required]],
			audioLanguageId: [''],
			subtitleLanguageId: [''],
		});

		this.priceForm = this.fb.group({});

		this.filterForm = this.fb.group({
			movieId: [''],
			theatreId: [''],
			hallId: [''],
			date: [''],
			searchTerm: [''],
		});

		// Watch filter changes
		this.filterForm.valueChanges
			.pipe(takeUntil(this.destroy$))
			.subscribe(() => {
				this.applyFilters();
			});

		// Watch theatre selection to load halls
		this.screeningForm
			.get('theatreId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((theatreId) => {
				if (theatreId) {
					this.loadHallsForTheatre(theatreId);
					this.screeningForm.patchValue({ hallId: '' });
				}
			});

		// Watch hall selection to load seat categories
		this.screeningForm
			.get('hallId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((hallId) => {
				if (hallId) {
					this.loadSeatCategoriesForHall(hallId);
				}
			});
	}

	loadInitialData(): void {
		this.loading = true;

		forkJoin({
			movies: this.movieService.findAllMoviesScreeningNow(),
			theatres: this.theatreService.findAllTheatres(),
			languages: this.languageService.findAllLanguages(),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					console.log('Initial data loaded');
					this.movies = data.movies;
					this.theatres = data.theatres;
					this.languages = data.languages;

					// Load screenings based on active tab
					if (this.activeTabIndex === 0) {
						this.loadCurrentScreenings();
					} else {
						this.loadPastScreenings();
					}
				},
				error: (error) => {
					console.error('Error loading initial data:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load data. Please refresh the page.',
					});
				},
			});
	}

	private loadHallsForTheatre(theatreId: number): void {
		this.hallService
			.findHallsByTheatreId(theatreId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (halls) => {
					this.halls = halls;
				},
				error: (error) => {
					console.error('Error loading halls:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load halls for selected theatre.',
					});
				},
			});
	}

	private loadSeatCategoriesForHall(hallId: number): void {
		this.screeningService
			.getHallSeatCategories(hallId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (categories) => {
					this.seatCategories = categories;
					this.setupPriceForm();
				},
				error: (error) => {
					console.error('Error loading seat categories:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load seat categories for selected hall.',
					});
				},
			});
	}

	private setupPriceForm(): void {
		const priceControls: any = {};
		this.seatCategories.forEach((category) => {
			priceControls[`price_${category.id}`] = [
				'',
				[Validators.required, Validators.min(0)],
			];
		});
		this.priceForm = this.fb.group(priceControls);
	}

	private applyFilters(): void {
		// Reset page numbers when filters change
		this.currentScreeningsPage = 1;
		this.pastScreeningsPage = 1;

		// Reload data based on active tab
		if (this.activeTabIndex === 0) {
			this.loadCurrentScreenings();
		} else {
			this.loadPastScreenings();
		}
	}

	/**
	 * Get current and upcoming screenings
	 */
	getCurrentAndUpcomingScreenings(): Screening[] {
		return this.currentScreeningsPagination?.data || [];
	}

	/**
	 * Get past screenings
	 */
	getPastScreenings(): Screening[] {
		return this.pastScreeningsPagination?.data || [];
	}

	/**
	 * Load current screenings with pagination
	 */
	loadCurrentScreenings(): void {
		this.loading = true;
		this.screeningService
			.getCurrentScreeningsPaginated(
				this.currentScreeningsPage,
				this.currentScreeningsPageSize
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.currentScreeningsPagination = response;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading current screenings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load current screenings.',
					});
					this.loading = false;
				},
			});
	}

	/**
	 * Load past screenings with pagination
	 */
	loadPastScreenings(): void {
		this.loading = true;
		this.screeningService
			.getPastScreeningsPaginated(
				this.pastScreeningsPage,
				this.pastScreeningsPageSize
			)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.pastScreeningsPagination = response;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading past screenings:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load past screenings.',
					});
					this.loading = false;
				},
			});
	}

	/**
	 * Handle page change for current screenings
	 */
	onCurrentPageChange(event: any): void {
		this.currentScreeningsPage = event.page + 1; // PrimeNG uses 0-based index
		this.currentScreeningsPageSize = event.rows;
		this.loadCurrentScreenings();
	}

	/**
	 * Handle page change for past screenings
	 */
	onPastPageChange(event: any): void {
		this.pastScreeningsPage = event.page + 1; // PrimeNG uses 0-based index
		this.pastScreeningsPageSize = event.rows;
		this.loadPastScreenings();
	}

	/**
	 * Handle tab change
	 */
	onTabChange(event: any): void {
		this.activeTabIndex = event.index;

		// Load appropriate data based on selected tab
		if (this.activeTabIndex === 0) {
			// Reset page and load current screenings if not already loaded
			if (!this.currentScreeningsPagination) {
				this.currentScreeningsPage = 1;
				this.loadCurrentScreenings();
			}
		} else {
			// Reset page and load past screenings if not already loaded
			if (!this.pastScreeningsPagination) {
				this.pastScreeningsPage = 1;
				this.loadPastScreenings();
			}
		}
	}

	/**
	 * Handle movie filter change
	 */
	onMovieFilterChange(movieId: number | null): void {
		this.searchMovieId = movieId;

		// If a movie is selected, you could filter the screenings
		// For now, we'll just store the selection for the "View Screening by Movie" button
		if (movieId) {
			console.log('Selected movie ID:', movieId);
			// TODO: Implement filtering logic if needed
		}
	}

	/**
	 * Combine date and time into a single Date object
	 */
	private combineDateTime(dateStr: string, timeStr: any): Date {
		const date = new Date(dateStr);

		// Handle different time formats
		let timeString: string;
		if (typeof timeStr === 'string') {
			timeString = timeStr;
		} else if (timeStr instanceof Date) {
			timeString = timeStr.toTimeString().split(' ')[0];
		} else {
			timeString = '00:00:00';
		}

		const [hours, minutes, seconds = '00'] = timeString.split(':');
		date.setHours(
			parseInt(hours, 10),
			parseInt(minutes, 10),
			parseInt(seconds, 10),
			0
		);

		return date;
	}

	private getScreeningColor(screening: Screening): string {
		// Color code by movie or hall
		const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
		return colors[screening.movieId % colors.length];
	}

	// Public methods for template
	openCreateDialog(): void {
		const ref = this.dialogService.open(AdminScreeningCreateComponent, {
			header: 'Create New Screening',

			maximizable: true,
			modal: true,
			closable: true,
			styleClass: '!rounded-3xl !border-none !shadow-2xl',
		});

		ref.onClose.subscribe((result) => {
			if (result) {
				// Reload screenings if screening was created successfully
				this.loadInitialData();
			}
		});
	}

	openDetailDialog(screening: Screening): void {
		const ref = this.dialogService.open(AdminScreeningDetailedViewComponent, {
			header: `${screening.movie.name} - Screening Details`,
			data: { screening },
			maximizable: true,
			modal: true,
			closable: true,
			styleClass: '!rounded-2xl !border-none !shadow-2xl',
		});

		ref.onClose.subscribe((result) => {
			if (result?.action === 'edit') {
				// Open edit dialog if user clicked edit from detail view
				this.openEditDialog(result.screening);
			}
		});
	}

	openEditDialog(screening: Screening): void {
		const ref = this.dialogService.open(AdminScreeningEditComponent, {
			header: `Edit ${screening.movie.name} Screening`,
			data: { screeningId: screening.id },
			maximizable: true,
			modal: true,
			closable: true,
			styleClass: '!rounded-3xl !border-none !shadow-2xl',
		});

		ref.onClose.subscribe((result) => {
			if (result) {
				// Reload screenings if screening was updated successfully
				this.loadInitialData();
			}
		});
	}

	private populateFormForEdit(screening: Screening): void {
		// Convert TIME format to Date objects for the form
		const convertTimeToDate = (timeStr: string): Date | null => {
			if (!timeStr) return null;

			// Handle TIME format (HH:MM:SS)
			if (timeStr.includes(':')) {
				const timeParts = timeStr.split(':');
				if (timeParts.length >= 2) {
					const hours = parseInt(timeParts[0], 10);
					const minutes = parseInt(timeParts[1], 10);
					const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
					const date = new Date();
					date.setHours(hours, minutes, seconds, 0);
					return date;
				}
			}

			// Handle legacy 4-digit format (HHMM)
			if (timeStr.length === 4 && /^\d{4}$/.test(timeStr)) {
				const hours = parseInt(timeStr.substring(0, 2), 10);
				const minutes = parseInt(timeStr.substring(2, 4), 10);
				const date = new Date();
				date.setHours(hours, minutes, 0, 0);
				return date;
			}

			return null;
		};

		this.screeningForm.patchValue({
			movieId: screening.movieId,
			theatreId: screening.hall?.theatreId,
			hallId: screening.hallId,
			date: screening.date,
			startTime: convertTimeToDate(screening.startTime),
			endTime: convertTimeToDate(screening.endTime),
			audioLanguageId: screening.audioLanguageId,
			subtitleLanguageId: screening.subtitleLanguageId,
		});

		// Load halls for the theatre
		if (screening.hall?.theatreId) {
			this.loadHallsForTheatre(screening.hall.theatreId);
		}

		// Load seat categories and populate prices
		if (screening.hallId) {
			this.loadSeatCategoriesForHall(screening.hallId);
			// Populate existing prices when categories are loaded
			setTimeout(() => {
				this.populateExistingPrices(screening);
			}, 500);
		}
	}

	private populateExistingPrices(screening: Screening): void {
		if (screening.screeningSeatPrices) {
			const priceValues: any = {};
			screening.screeningSeatPrices.forEach((sp) => {
				priceValues[`price_${sp.seatCategoryId}`] = sp.price;
			});
			this.priceForm.patchValue(priceValues);
		}
	}

	deleteScreening(screening: Screening, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Are you sure you want to delete the screening for "${screening.movie?.name}" on ${screening.date}?`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {},
		});
	}

	openViewScreeningsByMovie(): void {
		if (!this.searchMovieId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Movie Selected',
				detail: 'Please select a movie from the dropdown first.',
			});
			return;
		}

		this.ref = this.dialogService.open(AdminScreeningsByMovieComponent, {
			header: `Screenings for Selected Movie`,
			modal: true,
			closable: true,
			maximizable: true,
			styleClass: '!rounded-2xl !border-none !shadow-2xl',
			data: {
				movieId: this.searchMovieId,
			},
		});
	}

	openViewScreeningsByTheatre(): void {
		if (!this.searchTheatreId) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Theatre Selected',
				detail: 'Please select a theatre from the dropdown first.',
			});
			return;
		}

		this.ref = this.dialogService.open(AdminScreeningsByTheatreComponent, {
			header: `Screenings for Selected Theatre`,
			modal: true,
			closable: true,
			maximizable: true,
			styleClass: '!rounded-2xl !border-none !shadow-2xl',
			data: {
				theatreId: this.searchTheatreId,
			},
		});
	}

	// Template helper methods
	getScreeningSeverity(screening: Screening): string {
		const now = new Date();

		// Parse the screening date and time
		const screeningDate = new Date(screening.date);

		// Ensure startTime is a string
		const startTimeString =
			typeof screening.startTime === 'string'
				? screening.startTime
				: String(screening.startTime || '');

		// Handle TIME format (HH:MM:SS or HH:MM)
		if (startTimeString && startTimeString.includes(':')) {
			const timeParts = startTimeString.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = parseInt(timeParts[1], 10);
				const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
				screeningDate.setHours(hours, minutes, seconds, 0);
			}
		} else if (
			startTimeString &&
			startTimeString.length === 4 &&
			/^\d{4}$/.test(startTimeString)
		) {
			// Handle legacy 4-digit time format
			const hours = parseInt(startTimeString.substring(0, 2), 10);
			const minutes = parseInt(startTimeString.substring(2, 4), 10);
			screeningDate.setHours(hours, minutes, 0, 0);
		}

		if (screeningDate < now) return 'secondary';
		if (screeningDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000)
			return 'warning';
		return 'success';
	}

	formatTime(time: string): string {
		if (!time) return '';

		// Handle HH:MM:SS format (preferred format)
		if (time.includes(':')) {
			const timeParts = time.split(':');
			if (timeParts.length >= 2) {
				const hours = parseInt(timeParts[0], 10);
				const minutes = timeParts[1];

				// Convert to 12-hour format for display
				const period = hours >= 12 ? 'PM' : 'AM';
				const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
				return `${displayHours}:${minutes} ${period}`;
			}
		}

		// Handle legacy 4-digit format (HHMM)
		if (time.length === 4 && /^\d{4}$/.test(time)) {
			const hours = parseInt(time.substring(0, 2), 10);
			const minutes = time.substring(2, 4);
			const period = hours >= 12 ? 'PM' : 'AM';
			const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
			return `${displayHours}:${minutes} ${period}`;
		}

		// Fallback: return as-is
		return time;
	}

	formatDate(date: string): string {
		return new Date(date).toLocaleDateString();
	}

	getSeatCategoryPrices(screening: Screening): string {
		if (
			!screening.screeningSeatPrices ||
			screening.screeningSeatPrices.length === 0
		) {
			return 'No pricing set';
		}

		return screening.screeningSeatPrices
			.map((sp) => `${sp.seatCategory?.name}: ${sp.price}`)
			.join(', ');
	}

	// Helper methods for template
	Array = Array;
	trackByScreeningId = (index: number, screening: Screening) => screening.id;

	/**
	 * Get the first portrait image from the movie's media
	 */
	getFirstPortraitImage(movie: Movie): any {
		if (!movie?.media || !Array.isArray(movie.media)) {
			return null;
		}

		return movie.media.find(
			(media) => media.type === 'IMAGE' && media.orientation === 'PORTRAIT'
		);
	}

	/**
	 * Get media URL
	 */
	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}${uri}`;
	}

	/**
	 * Handle image load error
	 */
	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}
}
