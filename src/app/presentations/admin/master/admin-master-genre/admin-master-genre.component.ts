import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
	Subject,
	takeUntil,
	debounceTime,
	distinctUntilChanged,
	finalize,
} from 'rxjs';
import { ConfirmationService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import { GenreDataService } from '../../../../core/dataservice/genre/genre.dataservice';
import {
	Genre,
	CreateGenreDto,
	UpdateGenreDto,
} from '../../../../core/dataservice/genre/genre.interface';

interface FilterOptions {
	sortBy: 'name' | 'createdAt';
	sortOrder: 'asc' | 'desc';
}

@Component({
	selector: 'app-admin-master-genre',
	templateUrl: './admin-master-genre.component.html',
	styleUrls: ['./admin-master-genre.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [ConfirmationService],
})
export class AdminMasterGenreComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	// Data properties
	genres: Genre[] = [];
	filteredGenres: Genre[] = [];
	loading = false;
	searchQuery = '';
	errorMessage = '';
	successMessage = '';

	// UI State
	showFilters = true;
	showAddButton = true;
	currentPage = 1;
	totalRecords = 0;
	pageSize = 20;

	// Dialog states
	showGenreDetail = false;
	showAddEditDialog = false;
	selectedGenre: Genre | null = null;
	editingGenre: Genre | null = null;
	showValidationErrors = false;

	// Form properties
	genreForm: Partial<Genre> = {
		name: '',
	};

	// View Options - removed, keeping only table view

	// Filter options
	filters: FilterOptions = {
		sortBy: 'name',
		sortOrder: 'asc',
	};

	// Dropdown options
	sortOptions = [
		{ label: 'Name', value: 'name' },
		{ label: 'Created Date', value: 'createdAt' },
	];

	sortOrderOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' },
	];

	constructor(
		private genreDataService: GenreDataService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit() {
		this.initializeData();
		this.setupSearch();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeData() {
		this.loadGenres();
	}

	private loadGenres() {
		this.loading = true;
		this.clearMessages();

		this.genreDataService
			.findAllGenres()
			.pipe(
				finalize(() => {
					this.loading = false;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (genres) => {
					this.genres = genres;
					console.log('Genres loaded successfully:', this.genres);
					this.totalRecords = this.genres.length;
					this.applyFilters();
				},
				error: (error) => {
					console.error('Error loading genres:', error);
					this.setErrorMessage('Failed to load genres. Please try again.');
					this.genres = [];
					this.totalRecords = 0;
					this.applyFilters();
				},
			});
	}

	/**
	 * Setup search functionality with debounce
	 */
	private setupSearch() {
		this.searchSubject
			.pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
			.subscribe((searchTerm) => {
				this.searchQuery = searchTerm;
				this.applyFilters();
			});
	}

	/**
	 * Handle search input
	 */
	onSearch(event: any) {
		this.searchSubject.next(event.target.value);
	}

	/**
	 * Apply filters and search
	 */
	applyFilters() {
		let filtered = [...this.genres];

		// Search filter
		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter((genre) =>
				genre.name.toLowerCase().includes(query)
			);
		}

		// Sort
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (this.filters.sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'createdAt':
					comparison =
						(a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
					break;
			}
			return this.filters.sortOrder === 'desc' ? -comparison : comparison;
		});

		this.filteredGenres = filtered;
	}

	/**
	 * Toggle filters visibility
	 */
	toggleFilters() {
		this.showFilters = !this.showFilters;
	}

	/**
	 * Clear search
	 */
	clearSearch() {
		this.searchQuery = '';
		this.applyFilters();
	}

	/**
	 * Handle search input change
	 */
	onSearchChange() {
		this.applyFilters();
	}

	/**
	 * View genre details
	 */
	viewGenre(genre: Genre) {
		this.selectedGenre = genre;
		this.showGenreDetail = true;
	}

	/**
	 * Close genre detail dialog
	 */
	closeGenreDetail() {
		this.showGenreDetail = false;
		this.selectedGenre = null;
	}

	/**
	 * Add new genre
	 */
	addGenre() {
		this.editingGenre = null;
		this.genreForm = {
			name: '',
		};
		this.showValidationErrors = false;
		this.clearMessages();
		this.showAddEditDialog = true;
	}

	/**
	 * Edit genre
	 */
	editGenre(genre: Genre) {
		this.editingGenre = genre;
		this.genreForm = { ...genre };
		this.showValidationErrors = false;
		this.clearMessages();
		this.showAddEditDialog = true;
	}

	/**
	 * Save genre (add or edit)
	 */
	saveGenre() {
		this.showValidationErrors = true;

		if (!this.genreForm.name?.trim()) {
			this.setErrorMessage('Genre name is required.');
			return;
		}

		// Clean and normalize the genre name
		const cleanName = this.genreForm.name.trim();
		this.genreForm.name = cleanName;

		this.loading = true;
		this.clearMessages();

		if (this.editingGenre) {
			// Update existing genre
			const updateDto: UpdateGenreDto = {
				name: this.genreForm.name,
			};

			this.genreDataService
				.updateGenre(this.editingGenre.id, updateDto)
				.pipe(
					finalize(() => {
						this.loading = false;
					}),
					takeUntil(this.destroy$)
				)
				.subscribe({
					next: (response) => {
						console.log('Genre updated successfully:', response);
						this.setSuccessMessage('Genre updated successfully.');
						this.loadGenres(); // Reload the list
						this.closeAddEditDialog();
					},
					error: (error) => {
						console.error('Error updating genre:', error);
						this.setErrorMessage('Failed to update genre. Please try again.');
					},
				});
		} else {
			// Add new genre
			const createDto: CreateGenreDto = {
				name: this.genreForm.name!,
			};

			this.genreDataService
				.createGenre(createDto)
				.pipe(
					finalize(() => {
						this.loading = false;
					}),
					takeUntil(this.destroy$)
				)
				.subscribe({
					next: (response) => {
						console.log('Genre created successfully:', response);
						this.setSuccessMessage('Genre created successfully.');
						this.loadGenres(); // Reload the list
						this.closeAddEditDialog();
					},
					error: (error) => {
						console.error('Error creating genre:', error);
						this.setErrorMessage('Failed to create genre. Please try again.');
					},
				});
		}
	}

	/**
	 * Close add/edit dialog
	 */
	closeAddEditDialog() {
		this.showAddEditDialog = false;
		this.editingGenre = null;
		this.genreForm = {
			name: '',
		};
		this.showValidationErrors = false;
		this.clearMessages();
	}

	/**
	 * Delete genre
	 */
	deleteGenre(genre: Genre) {
		this.confirmationService.confirm({
			message: `Are you sure you want to delete the genre "${genre.name}"? This action cannot be undone.`,
			header: 'Delete Confirmation',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
			acceptLabel: 'Yes, Delete',
			rejectLabel: 'Cancel',
			accept: () => {
				this.performDelete(genre);
			},
			reject: () => {
				// User cancelled, do nothing
			},
		});
	}

	/**
	 * Perform the actual delete operation
	 */
	private performDelete(genre: Genre) {
		this.loading = true;
		this.clearMessages();

		this.genreDataService
			.deleteGenre(genre.id)
			.pipe(
				finalize(() => {
					this.loading = false;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (response) => {
					console.log('Genre deleted successfully:', response);
					this.setSuccessMessage(`Genre "${genre.name}" deleted successfully.`);
					this.loadGenres(); // Reload the list
				},
				error: (error) => {
					console.error('Error deleting genre:', error);
					this.setErrorMessage('Failed to delete genre. Please try again.');
				},
			});
	}

	/**
	 * TrackBy function for *ngFor performance optimization
	 */
	trackByGenreId(index: number, genre: Genre): number {
		return genre.id;
	}

	/**
	 * Refresh data
	 */
	refreshData() {
		this.loadGenres();
	}

	/**
	 * Export genres
	 */
	exportGenres() {
		const dataStr = JSON.stringify(this.genres, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'genres-export.json';
		link.click();

		URL.revokeObjectURL(url);
	}

	/**
	 * Clear all messages
	 */
	private clearMessages() {
		this.errorMessage = '';
		this.successMessage = '';
	}

	/**
	 * Set error message
	 */
	private setErrorMessage(message: string) {
		this.errorMessage = message;
		this.successMessage = '';
	}

	/**
	 * Set success message
	 */
	private setSuccessMessage(message: string) {
		this.successMessage = message;
		this.errorMessage = '';
	}
}
