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
import { LanguageDataService } from '../../../../core/dataservice/language/language.dataservice';
import {
	Language,
	CreateLanguageDto,
	UpdateLanguageDto,
} from '../../../../core/dataservice/language/language.interface';

interface FilterOptions {
	sortBy: 'name' | 'code' | 'createdAt';
	sortOrder: 'asc' | 'desc';
}

@Component({
	selector: 'app-admin-master-language',
	templateUrl: './admin-master-language.component.html',
	styleUrls: ['./admin-master-language.component.scss'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
	providers: [ConfirmationService],
})
export class AdminMasterLanguageComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	// Data properties
	languages: Language[] = [];
	filteredLanguages: Language[] = [];
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
	showLanguageDetail = false;
	showAddEditDialog = false;
	selectedLanguage: Language | null = null;
	editingLanguage: Language | null = null;
	showValidationErrors = false;

	// Form properties
	languageForm: Partial<Language> = {
		name: '',
		code: '',
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
		{ label: 'Code', value: 'code' },
		{ label: 'Created Date', value: 'createdAt' },
	];

	sortOrderOptions = [
		{ label: 'Ascending', value: 'asc' },
		{ label: 'Descending', value: 'desc' },
	];

	constructor(
		private languageDataService: LanguageDataService,
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
		this.loadLanguages();
	}

	private loadLanguages() {
		this.loading = true;
		this.clearMessages();

		this.languageDataService
			.findAllLanguages()
			.pipe(
				finalize(() => {
					this.loading = false;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (languages) => {
					this.languages = languages;
					this.totalRecords = this.languages.length;
					this.applyFilters();
				},
				error: (error) => {
					console.error('Error loading languages:', error);
					this.setErrorMessage('Failed to load languages. Please try again.');
					this.languages = [];
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
	 * Handle language code input to automatically clean and format
	 */
	onLanguageCodeInput(event: any) {
		const value = event.target.value;
		if (value) {
			// Remove non-alphabetic characters and convert to lowercase
			const cleanValue = value
				.replace(/[^a-zA-Z]/g, '')
				.toLowerCase()
				.slice(0, 2);
			this.languageForm.code = cleanValue;
			event.target.value = cleanValue;
		}
	}

	/**
	 * Apply filters and search
	 */
	applyFilters() {
		let filtered = [...this.languages];

		// Search filter
		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(language) =>
					language.name.toLowerCase().includes(query) ||
					(language.code && language.code.toLowerCase().includes(query))
			);
		}

		// Sort
		filtered.sort((a, b) => {
			let comparison = 0;
			switch (this.filters.sortBy) {
				case 'name':
					comparison = a.name.localeCompare(b.name);
					break;
				case 'code':
					comparison = (a.code || '').localeCompare(b.code || '');
					break;
				case 'createdAt':
					comparison =
						(a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0);
					break;
			}
			return this.filters.sortOrder === 'desc' ? -comparison : comparison;
		});

		this.filteredLanguages = filtered;
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
	 * View language details
	 */
	viewLanguage(language: Language) {
		this.selectedLanguage = language;
		this.showLanguageDetail = true;
	}

	/**
	 * Close language detail dialog
	 */
	closeLanguageDetail() {
		this.showLanguageDetail = false;
		this.selectedLanguage = null;
	}

	/**
	 * Add new language
	 */
	addLanguage() {
		this.editingLanguage = null;
		this.languageForm = {
			name: '',
			code: '',
		};
		this.showValidationErrors = false;
		this.clearMessages();
		this.showAddEditDialog = true;
	}

	/**
	 * Edit language
	 */
	editLanguage(language: Language) {
		this.editingLanguage = language;
		this.languageForm = { ...language };
		this.showValidationErrors = false;
		this.clearMessages();
		this.showAddEditDialog = true;
	}

	/**
	 * Save language (add or edit)
	 */
	saveLanguage() {
		this.showValidationErrors = true;

		if (!this.languageForm.name || !this.languageForm.code) {
			this.setErrorMessage('Name and code are required fields.');
			return;
		}

		// Clean and normalize the language code
		const cleanCode = this.languageForm.code.trim().toLowerCase();

		// Validate language code format
		if (!this.isValidLanguageCode(cleanCode)) {
			this.setErrorMessage(
				'Language code must be exactly 2 lowercase letters (e.g., en, dz, hi).'
			);
			return;
		}

		// Update the form with the cleaned code
		this.languageForm.code = cleanCode;

		this.loading = true;
		this.clearMessages();

		if (this.editingLanguage) {
			// Update existing language
			const updateDto: UpdateLanguageDto = {
				name: this.languageForm.name,
				code: this.languageForm.code,
			};

			this.languageDataService
				.updateLanguage(this.editingLanguage.id, updateDto)
				.pipe(
					finalize(() => {
						this.loading = false;
					}),
					takeUntil(this.destroy$)
				)
				.subscribe({
					next: (response) => {
						console.log('Language updated successfully:', response);
						this.setSuccessMessage('Language updated successfully.');
						this.loadLanguages(); // Reload the list
						this.closeAddEditDialog();
					},
					error: (error) => {
						console.error('Error updating language:', error);
						this.setErrorMessage(
							'Failed to update language. Please try again.'
						);
					},
				});
		} else {
			// Add new language
			const createDto: CreateLanguageDto = {
				name: this.languageForm.name!,
				code: this.languageForm.code!,
			};

			this.languageDataService
				.createLanguage(createDto)
				.pipe(
					finalize(() => {
						this.loading = false;
					}),
					takeUntil(this.destroy$)
				)
				.subscribe({
					next: (response) => {
						console.log('Language created successfully:', response);
						this.setSuccessMessage('Language created successfully.');
						this.loadLanguages(); // Reload the list
						this.closeAddEditDialog();
					},
					error: (error) => {
						console.error('Error creating language:', error);
						this.setErrorMessage(
							'Failed to create language. Please try again.'
						);
					},
				});
		}
	}

	/**
	 * Close add/edit dialog
	 */
	closeAddEditDialog() {
		this.showAddEditDialog = false;
		this.editingLanguage = null;
		this.languageForm = {
			name: '',
			code: '',
		};
		this.showValidationErrors = false;
		this.clearMessages();
	}

	/**
	 * Delete language
	 */
	deleteLanguage(language: Language) {
		this.confirmationService.confirm({
			message: `Are you sure you want to delete the language "${language.name}"? This action cannot be undone.`,
			header: 'Delete Confirmation',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			rejectButtonStyleClass: 'p-button-secondary p-button-outlined',
			acceptLabel: 'Yes, Delete',
			rejectLabel: 'Cancel',
			accept: () => {
				this.performDelete(language);
			},
			reject: () => {
				// User cancelled, do nothing
			},
		});
	}

	/**
	 * Perform the actual delete operation
	 */
	private performDelete(language: Language) {
		this.loading = true;
		this.clearMessages();

		this.languageDataService
			.deleteLanguage(language.id)
			.pipe(
				finalize(() => {
					this.loading = false;
				}),
				takeUntil(this.destroy$)
			)
			.subscribe({
				next: (response) => {
					console.log('Language deleted successfully:', response);
					this.setSuccessMessage(
						`Language "${language.name}" deleted successfully.`
					);
					this.loadLanguages(); // Reload the list
				},
				error: (error) => {
					console.error('Error deleting language:', error);
					this.setErrorMessage('Failed to delete language. Please try again.');
				},
			});
	}

	/**
	 * TrackBy function for *ngFor performance optimization
	 */
	trackByLanguageId(index: number, language: Language): number {
		return language.id;
	}

	/**
	 * Refresh data
	 */
	refreshData() {
		this.loadLanguages();
	}

	/**
	 * Export languages
	 */
	exportLanguages() {
		const dataStr = JSON.stringify(this.languages, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'languages-export.json';
		link.click();

		URL.revokeObjectURL(url);
	}

	/**
	 * Validate language code format
	 */
	isValidLanguageCode(code: string): boolean {
		// Check if code exists and is a string
		if (!code || typeof code !== 'string') {
			return false;
		}

		// Trim whitespace and convert to lowercase
		const cleanCode = code.trim().toLowerCase();

		// Basic validation for ISO 639-1 codes (exactly 2 lowercase letters)
		return /^[a-z]{2}$/.test(cleanCode);
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
