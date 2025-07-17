import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
	FormsModule,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { takeUntil, forkJoin } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { ScreeningDataService } from '../../../../../core/dataservice/screening/screening.dataservice';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { HallDataService } from '../../../../../core/dataservice/hall/hall.dataservice';
import { TheatreDataService } from '../../../../../core/dataservice/theatre/theatre.dataservice';
import { LanguageDataService } from '../../../../../core/dataservice/language/language.dataservice';
import { BASEAPI_URL } from '../../../../../core/constants/constants';

import {
	CreateScreeningWithPricesDto,
	SeatCategoryPriceDto,
} from '../../../../../core/dataservice/screening/screening.interface';
import { Movie } from '../../../../../core/dataservice/movie/movie.interface';
import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../../core/dataservice/theatre/theatre.interface';
import { Language } from '../../../../../core/dataservice/language/language.interface';
import { SeatCategory } from '../../../../../core/dataservice/seat-category/seat-category.interface';

@Component({
	selector: 'app-admin-screening-create',
	templateUrl: './admin-screening-create.component.html',
	styleUrls: ['./admin-screening-create.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminScreeningCreateComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	// Data
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
	currentStep = 1;
	totalSteps = 3;
	minDate = new Date();

	constructor(
		private fb: FormBuilder,
		private screeningService: ScreeningDataService,
		private movieService: MovieApiDataService,
		private hallService: HallDataService,
		private theatreService: TheatreDataService,
		private languageService: LanguageDataService,
		private messageService: MessageService,
		private dialogRef: DynamicDialogRef
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

	private loadInitialData(): void {
		this.loading = true;

		forkJoin({
			movies: this.movieService.findAllMovies(),
			theatres: this.theatreService.findAllTheatres(),
			languages: this.languageService.findAllLanguages(),
		})
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (data) => {
					this.movies = data.movies;
					this.theatres = data.theatres;
					this.languages = data.languages;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading initial data:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load data. Please try again.',
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

	// Step navigation
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

	// Form submission
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
				const seconds = '00';
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
			}

			return '';
		};

		const screeningData: CreateScreeningWithPricesDto = {
			...formData,
			startTime: formatTimeToMySQLTime(formData.startTime),
			endTime: formatTimeToMySQLTime(formData.endTime),
			seatCategoryPrices,
		};

		this.createScreening(screeningData);
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
					this.resetForms();
					this.dialogRef.close(true);
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

	// Form utilities
	private resetForms(): void {
		this.screeningForm.reset();
		this.priceForm = this.fb.group({});
		this.seatCategories = [];
		this.halls = [];
		this.currentStep = 1;
		this.isSubmitting = false;
	}

	private markAllFormsAsTouched(): void {
		this.screeningForm.markAllAsTouched();
		this.priceForm.markAllAsTouched();
	}

	// Template helper methods
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

	getMediaUrl(uri: string): string {
		return `${BASEAPI_URL}/${uri}`;
	}

	onImageError(event: any): void {
		const imgElement = event.target as HTMLImageElement;
		if (imgElement) {
			imgElement.style.display = 'none';
		}
	}

	// Event handlers
	onCancel(): void {
		this.resetForms();
		this.dialogRef.close(false);
	}

	// Helper properties for template
	Array = Array;
}
