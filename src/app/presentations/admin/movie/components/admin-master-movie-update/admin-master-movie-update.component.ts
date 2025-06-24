import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	FormBuilder,
	FormGroup,
	Validators,
	ReactiveFormsModule,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { MovieApiDataService } from '../../../../../core/dataservice/movie/movie-api.dataservice';
import { GenreDataService } from '../../../../../core/dataservice/genre/genre.dataservice';
import { LanguageDataService } from '../../../../../core/dataservice/language/language.dataservice';
import { UserDataService } from '../../../../../core/dataservice/user/user.dataservice';
import { Genre } from '../../../../../core/dataservice/genre/genre.interface';
import { Language } from '../../../../../core/dataservice/language/language.interface';
import { User } from '../../../../../core/dataservice/user/user.interface';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
	ScreeningStatusEnum,
	UpdateMovieDto,
	Movie,
} from '../../../../../core/dataservice/movie/movie.interface';

@Component({
	selector: 'app-admin-master-movie-update',
	templateUrl: './admin-master-movie-update.component.html',
	styleUrls: ['./admin-master-movie-update.component.css'],
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule, PrimeNgModules],
})
export class AdminMasterMovieUpdateComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	movieForm!: FormGroup;
	loading = false;
	submitted = false;
	movie: Movie;

	// Form options
	pgRatingOptions = [
		{ label: 'G - General Audiences', value: 'G' },
		{ label: 'PG - Parental Guidance', value: 'PG' },
		{ label: 'PG-13 - Parents Strongly Cautioned', value: 'PG-13' },
		{ label: 'R - Restricted', value: 'R' },
		{ label: 'NC-17 - Adults Only', value: 'NC-17' },
	];

	screeningStatusOptions = [
		{ label: 'Upcoming', value: ScreeningStatusEnum.UPCOMING },
		{ label: 'Now Showing', value: ScreeningStatusEnum.NOW_SHOWING },
		{ label: 'Ended', value: ScreeningStatusEnum.ENDED },
		{ label: 'Cancelled', value: ScreeningStatusEnum.CANCELLED },
	];

	genreOptions: { label: string; value: number }[] = [];
	languageOptions: { label: string; value: number }[] = [];
	producerOptions: { label: string; value: number }[] = [];

	constructor(
		private fb: FormBuilder,
		private movieApiService: MovieApiDataService,
		private genreDataService: GenreDataService,
		private languageDataService: LanguageDataService,
		private userDataService: UserDataService,
		private config: DynamicDialogConfig,
		private ref: DynamicDialogRef
	) {
		this.initializeForm();
		this.movie = this.config.data?.movie;
	}

	ngOnInit() {
		// Load additional data from API
		this.loadGenres();
		this.loadLanguages();
		this.loadProducers();

		// Populate form after data is loaded
		if (this.movie) {
			this.populateForm();
		}
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load genres from backend
	 */
	private loadGenres() {
		this.genreDataService
			.findAllGenres()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (genres: Genre[]) => {
					this.genreOptions = genres.map((genre) => ({
						label: genre.name,
						value: genre.id,
					}));
					// Re-populate form if movie exists and genres are loaded
					if (this.movie) {
						this.populateForm();
					}
				},
				error: (error) => {
					console.error('Error loading genres:', error);
					this.showError('Failed to load genres. Please try again.');
				},
			});
	}

	/**
	 * Load languages from backend
	 */
	private loadLanguages() {
		this.languageDataService
			.findAllLanguages()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (languages: Language[]) => {
					this.languageOptions = languages.map((language) => ({
						label: language.name,
						value: language.id,
					}));
					// Re-populate form if movie exists and languages are loaded
					if (this.movie) {
						this.populateForm();
					}
				},
				error: (error) => {
					console.error('Error loading languages:', error);
					this.showError('Failed to load languages. Please try again.');
				},
			});
	}

	/**
	 * Load producers from backend
	 */
	private loadProducers() {
		this.userDataService
			.findAllProducers()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (producers: User[]) => {
					this.producerOptions = producers.map((producer) => ({
						label: `${producer.firstName} ${producer.lastName}`,
						value: producer.id,
					}));
					console.log(producers, producers);
					// Re-populate form if movie exists and producers are loaded
					if (this.movie) {
						this.populateForm();
					}
				},
				error: (error) => {
					console.error('Error loading producers:', error);
					this.showError('Failed to load producers. Please try again.');
				},
			});
	}

	private initializeForm() {
		this.movieForm = this.fb.group({
			name: [
				'',
				[
					Validators.required,
					Validators.minLength(2),
					Validators.maxLength(100),
				],
			],
			description: ['', [Validators.required]],
			casts: ['', [Validators.required]],
			pgRating: ['', Validators.required],
			durationMin: [
				'',
				[Validators.required, Validators.min(1), Validators.max(600)],
			],
			releaseDate: ['', Validators.required],
			trailerURL: ['', [Validators.pattern(/^https?:\/\/.+/)]],
			productionHouse: ['', Validators.maxLength(100)],
			producerId: ['', Validators.required],
			screeningStatus: [ScreeningStatusEnum.UPCOMING, Validators.required],
			genreIds: [[], Validators.required],
			languageIds: [[], Validators.required],
			subtitleLanguageIds: [[]],
		});
	}

	/**
	 * Populate form with movie data
	 */
	private populateForm() {
		if (this.movie) {
			this.movieForm.patchValue({
				name: this.movie.name,
				description: this.movie.description,
				casts: this.movie.casts,
				pgRating: this.movie.pgRating,
				durationMin: this.movie.durationMin,
				releaseDate: this.movie.releaseDate
					? new Date(this.movie.releaseDate)
					: null,
				trailerURL: this.movie.trailerURL,
				productionHouse: this.movie.productionHouse,
				producerId: this.movie.producerId,
				screeningStatus: this.movie.screeningStatus,
				genreIds: this.movie.genres?.map((g) => g.id) || [],
				languageIds: this.movie.languages?.map((l) => l.id) || [],
				subtitleLanguageIds:
					this.movie.subtitleLanguages?.map((l) => l.id) || [],
			});
		}
	}

	get f() {
		return this.movieForm.controls;
	}

	onSubmit() {
		this.submitted = true;

		if (this.movieForm.invalid || !this.movie) {
			this.markFormGroupTouched();
			return;
		}

		this.loading = true;
		const formValue = this.movieForm.value;

		// Format the date properly
		const updateMovieDto: UpdateMovieDto = {
			...formValue,
			releaseDate: this.formatDate(formValue.releaseDate),
		};

		this.movieApiService
			.updateMovie(this.movie.id, updateMovieDto)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					console.log('Movie updated successfully:', response);
					this.showSuccess('Movie updated successfully!');
					// Close dialog and return updated movie
					this.ref.close(response.data || response);
				},
				error: (error) => {
					console.error('Error updating movie:', error);
					this.loading = false;
					this.showError('Failed to update movie. Please try again.');
				},
			});
	}

	onCancel() {
		this.ref.close();
	}

	private markFormGroupTouched() {
		Object.keys(this.movieForm.controls).forEach((key) => {
			const control = this.movieForm.get(key);
			control?.markAsTouched();
		});
	}

	private formatDate(date: Date | string): string {
		if (!date) return '';
		const d = new Date(date);
		return d.toISOString().split('T')[0];
	}

	private showSuccess(message: string) {
		// In a real app, you'd use a toast service
		alert(message);
	}

	private showError(message: string) {
		// In a real app, you'd use a toast service
		alert(message);
	}

	// Form validation helpers
	isFieldInvalid(fieldName: string): boolean {
		const field = this.movieForm.get(fieldName);
		return !!(
			field &&
			field.invalid &&
			(field.dirty || field.touched || this.submitted)
		);
	}

	getFieldError(fieldName: string): string {
		const field = this.movieForm.get(fieldName);
		if (
			field &&
			field.errors &&
			(field.dirty || field.touched || this.submitted)
		) {
			if (field.errors['required']) return `${fieldName} is required`;
			if (field.errors['minlength'])
				return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
			if (field.errors['maxlength'])
				return `${fieldName} must not exceed ${field.errors['maxlength'].requiredLength} characters`;
			if (field.errors['min'])
				return `${fieldName} must be at least ${field.errors['min'].min}`;
			if (field.errors['max'])
				return `${fieldName} must not exceed ${field.errors['max'].max}`;
			if (field.errors['pattern']) return `${fieldName} format is invalid`;
		}
		return '';
	}
}
