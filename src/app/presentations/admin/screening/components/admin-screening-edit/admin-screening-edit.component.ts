import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { takeUntil, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { BookingDataService } from '../../../../../core/dataservice/booking/booking.dataservice';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { HallDataService } from '../../../../../core/dataservice/hall/hall.dataservice';
import { TheatreDataService } from '../../../../../core/dataservice/theatre/theatre.dataservice';
import { LanguageDataService } from '../../../../../core/dataservice/language/language.dataservice';

import {
	Screening,
	UpdateScreeningDto,
	ScreeningSeatPrice,
} from '../../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../../core/dataservice/theatre/theatre.interface';
import { Language } from '../../../../../core/dataservice/language/language.interface';
import { SeatCategory } from '../../../../../core/dataservice/seat-category/seat-category.interface';

@Component({
	selector: 'app-admin-screening-edit',
	templateUrl: './admin-screening-edit.component.html',
	styleUrls: ['./admin-screening-edit.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminScreeningEditComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
	screening: Screening | null = null;
	movies: Movie[] = [];
	theatres: Theatre[] = [];
	halls: Hall[] = [];
	languages: Language[] = [];
	seatCategories: SeatCategory[] = [];

	// Forms
	screeningForm!: FormGroup;
	priceForm!: FormGroup;

	// UI State
	loading = false;
	isSubmitting = false;
	hasConfirmedBookings = false;
	isReadOnly = false;
	currentStep = 1;
	totalSteps = 3;
	minDate = new Date();

	constructor(
		private fb: FormBuilder,
		private screeningService: ScreeningDataService,
		private bookingService: BookingDataService,
		private movieService: MovieApiDataService,
		private hallService: HallDataService,
		private theatreService: TheatreDataService,
		private languageService: LanguageDataService,
		private messageService: MessageService,
		private dialogRef: DynamicDialogRef,
		private config: DynamicDialogConfig
	) {
		this.initializeForms();
	}

	ngOnInit(): void {
		const screeningId = this.config.data?.screeningId;
		if (screeningId) {
			this.loadScreeningData(screeningId);
		}
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

		// Watch theatre selection to load halls
		this.screeningForm
			.get('theatreId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((theatreId) => {
				if (theatreId) {
					this.loadHallsByTheatre(theatreId);
				}
			});

		// Watch hall selection to load seat categories
		this.screeningForm
			.get('hallId')
			?.valueChanges.pipe(takeUntil(this.destroy$))
			.subscribe((hallId) => {
				if (hallId) {
					this.loadSeatCategories(hallId);
				}
			});
	}

	private loadScreeningData(screeningId: number): void {
		this.loading = true;

		forkJoin({
			screening: this.screeningService.findScreeningById(screeningId),
			bookings:
				this.bookingService.findAllConfirmedBookingsByScreeningId(screeningId),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: ({ screening, bookings }) => {
					this.screening = screening;
					this.hasConfirmedBookings = bookings.length > 0;
					this.isReadOnly = this.hasConfirmedBookings;
					this.populateForm();
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading screening data:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load screening data',
					});
					this.loading = false;
				},
			});
	}

	private populateForm(): void {
		if (!this.screening) return;

		this.screeningForm.patchValue({
			movieId: this.screening.movieId,
			theatreId: this.screening.hall?.theatre?.id || '',
			hallId: this.screening.hallId,
			date: new Date(this.screening.date),
			startTime: this.parseTimeString(this.screening.startTime),
			endTime: this.parseTimeString(this.screening.endTime),
			audioLanguageId: this.screening.audioLanguageId || '',
			subtitleLanguageId: this.screening.subtitleLanguageId || '',
		});

		// Load halls for the selected theatre
		if (this.screening.hall?.theatre?.id) {
			this.loadHallsByTheatre(this.screening.hall.theatre.id);
		}

		// Load seat categories and populate pricing form
		if (this.screening.hallId) {
			this.loadSeatCategories(this.screening.hallId.toString());
		}

		// Disable form if read-only
		if (this.isReadOnly) {
			this.screeningForm.disable();
		}
	}

	private parseTimeString(timeString: string): Date | null {
		if (!timeString) return null;
		const today = new Date();
		const [hours, minutes] = timeString.split(':').map(Number);
		const date = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
			hours,
			minutes
		);
		return date;
	}

	private loadInitialData(): void {
		this.loading = true;

		forkJoin({
			movies: this.movieService.findAllMovies(),
			theatres: this.theatreService.findAllTheatres(),
			languages: this.languageService.findAllLanguages(),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: ({ movies, theatres, languages }) => {
					this.movies = movies;
					this.theatres = theatres;
					this.languages = languages;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading initial data:', error);
					this.loading = false;
				},
			});
	}

	private loadHallsByTheatre(theatreId: string): void {
		this.hallService
			.findHallsByTheatreId(parseInt(theatreId))
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (halls: Hall[]) => {
					this.halls = halls;
				},
				error: (error: any) => {
					console.error('Error loading halls:', error);
				},
			});
	}

	private loadSeatCategories(hallId: string): void {
		this.screeningService
			.getHallSeatCategories(parseInt(hallId))
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (categories: SeatCategory[]) => {
					this.seatCategories = categories;
					this.setupPriceForm();
				},
				error: (error: any) => {
					console.error('Error loading seat categories:', error);
				},
			});
	}

	private setupPriceForm(): void {
		const priceControls: { [key: string]: any } = {};

		this.seatCategories.forEach((category) => {
			const existingPrice = this.screening?.screeningSeatPrices?.find(
				(sp: any) => sp.seatCategoryId === category.id
			);
			priceControls[`price_${category.id}`] = [
				existingPrice?.price || 0,
				[Validators.required, Validators.min(0)],
			];
		});

		this.priceForm = this.fb.group(priceControls);

		if (this.isReadOnly) {
			this.priceForm.disable();
		}
	}

	// Navigation methods
	nextStep(): void {
		if (this.canProceedToNextStep()) {
			this.currentStep++;
		}
	}

	previousStep(): void {
		if (this.currentStep > 1) {
			this.currentStep--;
		}
	}

	canProceedToNextStep(): boolean {
		if (this.currentStep === 1) {
			return !!(
				this.screeningForm.get('movieId')?.valid &&
				this.screeningForm.get('theatreId')?.valid &&
				this.screeningForm.get('hallId')?.valid
			);
		} else if (this.currentStep === 2) {
			return !!(
				this.screeningForm.get('date')?.valid &&
				this.screeningForm.get('startTime')?.valid &&
				this.screeningForm.get('endTime')?.valid
			);
		} else if (this.currentStep === 3) {
			return this.priceForm.valid;
		}
		return false;
	}

	// Form validation helpers
	isFieldInvalid(form: FormGroup, fieldName: string): boolean {
		const field = form.get(fieldName);
		return !!(field && field.invalid && field.touched);
	}

	getFieldError(form: FormGroup, fieldName: string): string {
		const field = form.get(fieldName);
		if (field && field.errors && field.touched) {
			if (field.errors['required']) {
				return 'This field is required';
			}
			if (field.errors['min']) {
				return 'Value must be greater than 0';
			}
		}
		return '';
	}

	// Actions
	submitScreening(): void {
		if (!this.screening || this.isReadOnly || !this.canProceedToNextStep()) {
			return;
		}

		this.isSubmitting = true;

		const updateData: UpdateScreeningDto = {
			movieId: this.screeningForm.value.movieId,
			hallId: parseInt(this.screeningForm.value.hallId),
			date: this.formatDate(this.screeningForm.value.date),
			startTime: this.formatTime(this.screeningForm.value.startTime),
			endTime: this.formatTime(this.screeningForm.value.endTime),
			audioLanguageId: this.screeningForm.value.audioLanguageId || undefined,
			subtitleLanguageId:
				this.screeningForm.value.subtitleLanguageId || undefined,
		};

		this.screeningService
			.updateScreening(this.screening.id, updateData)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Screening updated successfully',
					});
					this.dialogRef.close(true);
				},
				error: (error) => {
					console.error('Error updating screening:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to update screening',
					});
					this.isSubmitting = false;
				},
			});
	}

	onCancel(): void {
		this.dialogRef.close(false);
	}

	private formatDate(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	private formatTime(date: Date): string {
		return date.toTimeString().split(' ')[0];
	}
}
