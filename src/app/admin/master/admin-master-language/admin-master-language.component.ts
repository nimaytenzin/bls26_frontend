import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { PrimeNgModules } from '../../../primeng.modules';

export interface Language {
	id: number;
	name: string;
	code: string;
	createdAt?: Date;
	updatedAt?: Date;
}

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
})
export class AdminMasterLanguageComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();
	private searchSubject = new Subject<string>();

	// Data properties
	languages: Language[] = [];
	filteredLanguages: Language[] = [];
	loading = false;
	searchQuery = '';

	// UI State
	viewMode: 'grid' | 'list' | 'table' = 'table';
	showFilters = true;
	showViewModeToggle = true;
	showAddButton = true;
	currentPage = 1;
	totalRecords = 0;
	pageSize = 20;

	// Dialog states
	showLanguageDetail = false;
	showAddEditDialog = false;
	selectedLanguage: Language | null = null;
	editingLanguage: Language | null = null;

	// Form properties
	languageForm: Partial<Language> = {
		name: '',
		code: '',
	};

	// View Options
	viewModeOptions = [
		{ label: 'Grid', value: 'grid', icon: 'pi pi-th-large' },
		{ label: 'List', value: 'list', icon: 'pi pi-list' },
		{ label: 'Table', value: 'table', icon: 'pi pi-table' },
	];

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

	constructor() {}

	ngOnInit() {
		this.initializeData();
		this.setupSearch();
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private initializeData() {
		this.loading = true;
		// Load initial data - replace with actual service call
		this.loadLanguages();
		this.loading = false;
	}

	private loadLanguages() {
		// Mock data - replace with actual service call
		this.languages = [
			{
				id: 1,
				name: 'English',
				code: 'en',
				createdAt: new Date('2024-01-01'),
				updatedAt: new Date('2024-01-01'),
			},
			{
				id: 2,
				name: 'Dzongkha',
				code: 'dz',
				createdAt: new Date('2024-01-02'),
				updatedAt: new Date('2024-01-02'),
			},
			{
				id: 3,
				name: 'Hindi',
				code: 'hi',
				createdAt: new Date('2024-01-03'),
				updatedAt: new Date('2024-01-03'),
			},
			{
				id: 4,
				name: 'Nepali',
				code: 'ne',
				createdAt: new Date('2024-01-04'),
				updatedAt: new Date('2024-01-04'),
			},
		];

		this.totalRecords = this.languages.length;
		this.applyFilters();
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
		let filtered = [...this.languages];

		// Search filter
		if (this.searchQuery) {
			const query = this.searchQuery.toLowerCase();
			filtered = filtered.filter(
				(language) =>
					language.name.toLowerCase().includes(query) ||
					language.code.toLowerCase().includes(query)
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
					comparison = a.code.localeCompare(b.code);
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
	 * Handle view mode change
	 */
	onViewModeChange() {
		localStorage.setItem('languageViewMode', this.viewMode);
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
		this.showAddEditDialog = true;
	}

	/**
	 * Edit language
	 */
	editLanguage(language: Language) {
		this.editingLanguage = language;
		this.languageForm = { ...language };
		this.showAddEditDialog = true;
	}

	/**
	 * Save language (add or edit)
	 */
	saveLanguage() {
		if (!this.languageForm.name || !this.languageForm.code) {
			return;
		}

		if (this.editingLanguage) {
			// Update existing language
			const index = this.languages.findIndex(
				(l) => l.id === this.editingLanguage!.id
			);
			if (index > -1) {
				this.languages[index] = {
					...this.languages[index],
					...this.languageForm,
					updatedAt: new Date(),
				};
			}
		} else {
			// Add new language
			const newLanguage: Language = {
				id: Math.max(...this.languages.map((l) => l.id)) + 1,
				name: this.languageForm.name!,
				code: this.languageForm.code!,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			this.languages.unshift(newLanguage);
		}

		this.applyFilters();
		this.closeAddEditDialog();
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
	}

	/**
	 * Delete language
	 */
	deleteLanguage(language: Language) {
		if (confirm(`Are you sure you want to delete "${language.name}"?`)) {
			const index = this.languages.findIndex((l) => l.id === language.id);
			if (index > -1) {
				this.languages.splice(index, 1);
				this.applyFilters();
			}
		}
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
		this.initializeData();
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
		// Basic validation for ISO 639-1 codes (2 letters)
		return /^[a-z]{2}$/.test(code);
	}
}
