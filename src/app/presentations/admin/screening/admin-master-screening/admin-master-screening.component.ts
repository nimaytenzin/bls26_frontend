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

import {
	Screening,
	CreateScreeningWithPricesDto,
	SeatCategoryPriceDto,
	ScreeningFilter,
} from '../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../core/dataservice/theatre/theatre.interface';
import { Language } from '../../../../core/dataservice/language/language.interface';
import { SeatCategory } from '../../../../core/dataservice/seat-category/seat-category.interface';

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

	// Data
	screenings: Screening[] = [];
	movies: Movie[] = [];
	theatres: Theatre[] = [];
	halls: Hall[] = [];
	languages: Language[] = [];
	seatCategories: SeatCategory[] = [];

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

	// View options
	viewMode: 'list' | 'calendar' = 'list';
	calendarEvents: any[] = [];

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
			screenings: this.screeningService.findAllScreenings(),
			movies: this.movieService.findAllMovies(),
			theatres: this.theatreService.findAllTheatres(),
			languages: this.languageService.findAllLanguages(),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					console.log('Initial data loaded:', data.screenings);
					this.screenings = data.screenings;
					this.movies = data.movies;
					this.theatres = data.theatres;
					this.languages = data.languages;
					this.filteredScreenings = [...this.screenings];
					this.updateCalendarEvents();
					this.loading = false;
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
		const filters = this.filterForm.value;
		let filtered = [...this.screenings];

		if (filters.movieId) {
			filtered = filtered.filter(
				(s) => s.movieId === parseInt(filters.movieId)
			);
		}

		if (filters.theatreId) {
			filtered = filtered.filter(
				(s) => s.hall?.theatreId === parseInt(filters.theatreId)
			);
		}

		if (filters.hallId) {
			filtered = filtered.filter((s) => s.hallId === parseInt(filters.hallId));
		}

		if (filters.date) {
			filtered = filtered.filter((s) => s.date === filters.date);
		}

		if (filters.searchTerm) {
			const term = filters.searchTerm.toLowerCase();
			filtered = filtered.filter(
				(s) =>
					s.movie?.name?.toLowerCase().includes(term) ||
					s.hall?.name?.toLowerCase().includes(term)
			);
		}

		this.filteredScreenings = filtered;
	}

	private updateCalendarEvents(): void {
		// Helper function to convert TIME format to Date object
		const parseTimeToDate = (dateStr: string, timeStr: any): Date => {
			const baseDate = new Date(dateStr);

			// Ensure timeStr is a string
			const timeString =
				typeof timeStr === 'string' ? timeStr : String(timeStr || '');

			if (timeString && timeString.includes(':')) {
				// Handle TIME format (HH:MM:SS or HH:MM)
				const timeParts = timeString.split(':');
				if (timeParts.length >= 2) {
					const hours = parseInt(timeParts[0], 10);
					const minutes = parseInt(timeParts[1], 10);
					const seconds = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
					baseDate.setHours(hours, minutes, seconds, 0);
				}
			} else if (
				timeString &&
				timeString.length === 4 &&
				/^\d{4}$/.test(timeString)
			) {
				// Handle legacy 4-digit format (HHMM)
				const hours = parseInt(timeString.substring(0, 2), 10);
				const minutes = parseInt(timeString.substring(2, 4), 10);
				baseDate.setHours(hours, minutes, 0, 0);
			}

			return baseDate;
		};

		this.calendarEvents = this.screenings.map((screening) => ({
			title: `${screening.movie?.name} - ${screening.hall?.name}`,
			start: parseTimeToDate(screening.date, screening.startTime),
			end: parseTimeToDate(screening.date, screening.endTime),
			backgroundColor: this.getScreeningColor(screening),
			extendedProps: { screening },
		}));
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

	openEditDialog(screening: Screening): void {
		this.selectedScreening = screening;
		this.populateFormForEdit(screening);
		this.showEditDialog = true;
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

	nextStep(): void {
		if (this.currentStep < this.totalSteps) {
			this.currentStep++;
		}
	}

	previousStep(): void {
		if (this.currentStep > 1) {
			this.currentStep--;
		}
	}

	canProceedToNextStep(): boolean {
		switch (this.currentStep) {
			case 1:
				return !!(
					this.screeningForm.get('movieId')?.valid &&
					this.screeningForm.get('theatreId')?.valid &&
					this.screeningForm.get('hallId')?.valid
				);
			case 2:
				return !!(
					this.screeningForm.get('date')?.valid &&
					this.screeningForm.get('startTime')?.valid &&
					this.screeningForm.get('endTime')?.valid
				);
			case 3:
				return !!this.priceForm.valid;
			default:
				return false;
		}
	}

	submitScreening(): void {
		if (this.screeningForm.invalid || this.priceForm.invalid) {
			this.markAllFormsAsTouched();
			return;
		}

		this.isSubmitting = true;
		const formData = this.screeningForm.value;
		const priceData = this.priceForm.value;

		const seatCategoryPrices: SeatCategoryPriceDto[] = this.seatCategories.map(
			(category) => ({
				seatCategoryId: category.id,
				price: parseFloat(priceData[`price_${category.id}`]),
			})
		);

		// Convert start and end times to MySQL TIME format (HH:MM:SS)
		const formatTimeToMySQLTime = (timeValue: any): string => {
			if (!timeValue) return '';

			// Handle Date objects (from p-datepicker)
			if (timeValue instanceof Date) {
				const hours = timeValue.getHours().toString().padStart(2, '0');
				const minutes = timeValue.getMinutes().toString().padStart(2, '0');
				const seconds = timeValue.getSeconds().toString().padStart(2, '0');
				return `${hours}:${minutes}:${seconds}`;
			}

			// Handle string values
			if (typeof timeValue === 'string') {
				// Handle ISO date strings (e.g., "2024-01-01T14:30:00.000Z")
				if (timeValue.includes('T') || timeValue.includes('Z')) {
					const date = new Date(timeValue);
					if (!isNaN(date.getTime())) {
						const hours = date.getHours().toString().padStart(2, '0');
						const minutes = date.getMinutes().toString().padStart(2, '0');
						const seconds = date.getSeconds().toString().padStart(2, '0');
						return `${hours}:${minutes}:${seconds}`;
					}
				}

				// Handle existing time string formats (HH:MM or HH:MM:SS)
				if (timeValue.includes(':')) {
					const timeParts = timeValue.split(':');
					if (timeParts.length >= 2) {
						const hours = timeParts[0].padStart(2, '0');
						const minutes = timeParts[1].padStart(2, '0');
						const seconds = timeParts[2] ? timeParts[2].padStart(2, '0') : '00';
						return `${hours}:${minutes}:${seconds}`;
					}
				}

				// Handle 4-digit format (HHMM) - legacy support
				if (timeValue.length === 4 && /^\d{4}$/.test(timeValue)) {
					const hours = timeValue.substring(0, 2);
					const minutes = timeValue.substring(2, 4);
					return `${hours}:${minutes}:00`;
				}
			}

			return '';
		};

		const screeningData: CreateScreeningWithPricesDto = {
			...formData,
			startTime: formatTimeToMySQLTime(formData.startTime),
			endTime: formatTimeToMySQLTime(formData.endTime),
			seatCategoryPrices,
		};

		if (this.selectedScreening) {
			// Update existing screening
			this.updateScreening(screeningData);
		} else {
			// Create new screening
			this.createScreening(screeningData);
		}
	}

	private createScreening(screeningData: CreateScreeningWithPricesDto): void {
		this.screeningService
			.createScreeningWithPrices(screeningData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Screening created successfully!',
					});
					this.closeDialogs();
					this.loadInitialData();
				},
				error: (error) => {
					console.error('Error creating screening:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create screening.',
					});
				},
			});
	}

	private updateScreening(screeningData: CreateScreeningWithPricesDto): void {
		if (!this.selectedScreening) return;

		this.screeningService
			.updateScreening(this.selectedScreening.id, screeningData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Screening updated successfully!',
					});
					this.closeDialogs();
					this.loadInitialData();
				},
				error: (error) => {
					console.error('Error updating screening:', error);
					this.isSubmitting = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to update screening.',
					});
				},
			});
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
			accept: () => {
				this.performDelete(screening);
			},
		});
	}

	private performDelete(screening: Screening): void {
		this.screeningService
			.deleteScreening(screening.id)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Screening deleted successfully!',
					});
					this.loadInitialData();
				},
				error: (error) => {
					console.error('Error deleting screening:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to delete screening.',
					});
				},
			});
	}

	private closeDialogs(): void {
		this.showCreateDialog = false;
		this.showEditDialog = false;
		this.isSubmitting = false;
		this.resetForms();
	}

	private resetForms(): void {
		this.screeningForm.reset();
		this.priceForm = this.fb.group({});
		this.seatCategories = [];
		this.halls = [];
		this.currentStep = 1;
	}

	private markAllFormsAsTouched(): void {
		this.screeningForm.markAllAsTouched();
		this.priceForm.markAllAsTouched();
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

	isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
		const field = formGroup.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(formGroup: FormGroup, fieldName: string): string {
		const field = formGroup.get(fieldName);
		if (field?.errors && field.touched) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['min']) return `${fieldName} must be greater than 0`;
		}
		return '';
	}

	onCalendarEventClick(event: any): void {
		if (event.extendedProps?.screening) {
			this.openEditDialog(event.extendedProps.screening);
		}
	}

	onViewModeChange(): void {
		if (this.viewMode === 'calendar') {
			this.updateCalendarEvents();
		}
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
		return `${BASEAPI_URL}/${uri}`;
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
