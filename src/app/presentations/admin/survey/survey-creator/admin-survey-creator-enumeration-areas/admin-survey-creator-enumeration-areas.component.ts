import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { Dzongkhag } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.interface';
import { AdministrativeZone } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dto';
import { SubAdministrativeZone } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dto';
import { EnumerationArea } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';
import { DzongkhagDataService } from '../../../../../core/dataservice/location/dzongkhag/dzongkhag.dataservice';
import { AdministrativeZoneDataService } from '../../../../../core/dataservice/location/administrative-zone/administrative-zone.dataservice';
import { SubAdministrativeZoneDataService } from '../../../../../core/dataservice/location/sub-administrative-zone/sub-administrative-zone.dataservice';
import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import { SurveyEnumerationAreaDataService } from '../../../../../core/dataservice/survey-enumeration-area/survey-enumeration-area.dataservice';
import { finalize } from 'rxjs/operators';

interface BulkUploadError {
	row: number;
	codes: string;
	error: string;
}

interface BulkUploadResult {
	totalRows: number;
	matched: number;
	notFound: number;
	errors: BulkUploadError[];
}

@Component({
	selector: 'app-admin-survey-creator-enumeration-areas',
	templateUrl: './admin-survey-creator-enumeration-areas.component.html',
	styleUrls: ['./admin-survey-creator-enumeration-areas.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSurveyCreatorEnumerationAreasComponent implements OnInit {
	@Input() selectedEAIds: number[] = [];
	@Output() completed = new EventEmitter<number[]>();
	@Output() back = new EventEmitter<void>();

	// Dropdown data
	dzongkhags: Dzongkhag[] = [];
	administrativeZones: AdministrativeZone[] = [];
	subAdministrativeZones: SubAdministrativeZone[] = [];
	enumerationAreas: EnumerationArea[] = [];

	// Selected values
	selectedDzongkhag: Dzongkhag | null = null;
	selectedAdminZone: AdministrativeZone | null = null;
	selectedSubAdminZone: SubAdministrativeZone | null = null;
	selectedEAs: EnumerationArea[] = [];

	// Loading states
	loadingDzongkhags = false;
	loadingAdminZones = false;
	loadingSubAdminZones = false;
	loadingEAs = false;

	// Bulk Upload Dialog
	showBulkUploadDialog = false;
	bulkUploadFile: File | null = null;
	uploading = false;
	uploadResult: BulkUploadResult | null = null;

	// All enumeration areas for matching (across all sub-admin zones)
	allEnumerationAreas: EnumerationArea[] = [];

	constructor(
		private dzongkhagService: DzongkhagDataService,
		private adminZoneService: AdministrativeZoneDataService,
		private subAdminZoneService: SubAdministrativeZoneDataService,
		private eaService: EnumerationAreaDataService,
		private surveyEAService: SurveyEnumerationAreaDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	/**
	 * Load all dzongkhags
	 */
	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService
			.findAllDzongkhags()
			.pipe(finalize(() => (this.loadingDzongkhags = false)))
			.subscribe({
				next: (data) => {
					this.dzongkhags = data;
				},
				error: (error) => {
					console.error('Error loading dzongkhags:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load dzongkhags',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle dzongkhag selection
	 */
	onDzongkhagChange(): void {
		// Reset dependent dropdowns (but keep selectedEAs)
		this.selectedAdminZone = null;
		this.selectedSubAdminZone = null;
		this.administrativeZones = [];
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedDzongkhag) {
			this.loadAdministrativeZones(this.selectedDzongkhag.id);
		}
	}

	/**
	 * Load administrative zones by dzongkhag
	 */
	loadAdministrativeZones(dzongkhagId: number): void {
		this.loadingAdminZones = true;
		this.adminZoneService
			.findAdministrativeZonesByDzongkhag(dzongkhagId)
			.pipe(finalize(() => (this.loadingAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.administrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load administrative zones',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle administrative zone selection
	 */
	onAdminZoneChange(): void {
		// Reset dependent dropdowns (but keep selectedEAs)
		this.selectedSubAdminZone = null;
		this.subAdministrativeZones = [];
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedAdminZone) {
			this.loadSubAdministrativeZones(this.selectedAdminZone.id);
		}
	}

	/**
	 * Load sub-administrative zones by administrative zone
	 */
	loadSubAdministrativeZones(adminZoneId: number): void {
		this.loadingSubAdminZones = true;
		this.subAdminZoneService
			.findSubAdministrativeZonesByAdministrativeZone(adminZoneId)
			.pipe(finalize(() => (this.loadingSubAdminZones = false)))
			.subscribe({
				next: (data) => {
					this.subAdministrativeZones = data;
				},
				error: (error) => {
					console.error('Error loading sub-administrative zones:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load sub-administrative zones',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Handle sub-administrative zone selection
	 */
	onSubAdminZoneChange(): void {
		// Reset enumeration areas (but keep selectedEAs)
		this.enumerationAreas = [];
		// Don't clear selectedEAs - they should persist across zone changes

		if (this.selectedSubAdminZone) {
			this.loadEnumerationAreas(this.selectedSubAdminZone.id);
		}
	}

	/**
	 * Load enumeration areas by sub-administrative zone
	 */
	loadEnumerationAreas(subAdminZoneId: number): void {
		this.loadingEAs = true;
		this.eaService
			.findEnumerationAreasBySubAdministrativeZone(subAdminZoneId)
			.pipe(finalize(() => (this.loadingEAs = false)))
			.subscribe({
				next: (data) => {
					this.enumerationAreas = data;
					// Pre-select EAs that were previously selected
					if (this.selectedEAIds.length > 0) {
						this.selectedEAs = this.enumerationAreas.filter((ea) =>
							this.selectedEAIds.includes(ea.id)
						);
					}
				},
				error: (error) => {
					console.error('Error loading enumeration areas:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumeration areas',
						life: 3000,
					});
				},
			});
	}

	/**
	 * Get selected EA IDs
	 */
	getSelectedEAIds(): number[] {
		return this.selectedEAs.map((ea) => ea.id);
	}

	/**
	 * Handle next button click
	 */
	onNext(): void {
		const selectedIds = this.getSelectedEAIds();
		if (selectedIds.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Warning',
				detail: 'Please select at least one enumeration area',
				life: 3000,
			});
			return;
		}
		this.completed.emit(selectedIds);
	}

	/**
	 * Handle back button click
	 */
	onBack(): void {
		this.back.emit();
	}

	// ==================== Bulk Upload ====================

	/**
	 * Open bulk upload dialog
	 */
	openBulkUploadDialog(): void {
		this.showBulkUploadDialog = true;
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
		// Load all enumeration areas for matching
		this.loadAllEnumerationAreas();
	}

	/**
	 * Close bulk upload dialog
	 */
	closeBulkUploadDialog(): void {
		this.showBulkUploadDialog = false;
		this.bulkUploadFile = null;
		this.uploadResult = null;
		this.uploading = false;
	}

	/**
	 * Load all enumeration areas for matching (across all sub-admin zones)
	 * For bulk upload, we need to search across all EAs, not just the current zone
	 */
	loadAllEnumerationAreas(): void {
		// Load all enumeration areas for bulk upload matching
		this.eaService.findAllEnumerationAreas(false, undefined, true).subscribe({
			next: (data) => {
				this.allEnumerationAreas = data;
			},
			error: (error) => {
				console.error('Error loading all enumeration areas:', error);
				// Fallback to currently loaded EAs
				this.allEnumerationAreas = [...this.enumerationAreas];
			},
		});
	}

	/**
	 * Remove EA from selection
	 */
	removeEA(ea: EnumerationArea): void {
		this.selectedEAs = this.selectedEAs.filter((selected) => selected.id !== ea.id);
	}

	/**
	 * Get location hierarchy for an EA
	 */
	getEALocation(ea: EnumerationArea): string {
		if (ea.subAdministrativeZones && ea.subAdministrativeZones.length > 0) {
			const saz = ea.subAdministrativeZones[0];
			const parts: string[] = [];
			if (saz.administrativeZone?.dzongkhag?.name) {
				parts.push(saz.administrativeZone.dzongkhag.name);
			}
			if (saz.administrativeZone?.name) {
				parts.push(saz.administrativeZone.name);
			}
			if (saz.name) {
				parts.push(saz.name);
			}
			return parts.join(' > ');
		}
		return 'N/A';
	}

	/**
	 * Handle file selection
	 */
	onBulkFileSelect(event: any): void {
		const files = event.files;
		if (files && files.length > 0) {
			this.bulkUploadFile = files[0];
			this.uploadResult = null; // Reset previous results
		}
	}

	/**
	 * Download CSV template
	 */
	downloadTemplate(): void {
		this.surveyEAService.downloadTemplate().subscribe({
			next: (blob: Blob) => {
				const url = window.URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = 'enumeration_area_upload_template.csv';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				window.URL.revokeObjectURL(url);
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Template downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to download template',
					life: 3000,
				});
			},
		});
	}

	/**
	 * Execute bulk upload - parse CSV and match enumeration areas
	 */
	executeBulkUpload(): void {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No File',
				detail: 'Please select a file to upload',
				life: 3000,
			});
			return;
		}

		this.uploading = true;
		this.uploadResult = null;

		const reader = new FileReader();
		reader.onload = (e: any) => {
			try {
				const csv = e.target.result;
				const result = this.parseCSVAndMatchEAs(csv);
				this.uploadResult = result;
				this.uploading = false;

				// Add matched EAs to selectedEAs
				if (result.matched > 0) {
					const matchedEAs = this.findEAsByCodes(csv);
					// Add to selectedEAs if not already selected
					matchedEAs.forEach((ea) => {
						if (!this.selectedEAs.find((selected) => selected.id === ea.id)) {
							// Load full EA details with location info if not already loaded
							if (!ea.subAdministrativeZones || ea.subAdministrativeZones.length === 0) {
								this.eaService.findEnumerationAreaById(ea.id, false, true).subscribe({
									next: (fullEA) => {
										if (!this.selectedEAs.find((selected) => selected.id === fullEA.id)) {
											this.selectedEAs.push(fullEA);
										}
									},
									error: () => {
										// If loading fails, still add the EA
										if (!this.selectedEAs.find((selected) => selected.id === ea.id)) {
											this.selectedEAs.push(ea);
										}
									},
								});
							} else {
								this.selectedEAs.push(ea);
							}
						}
					});

					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: `Matched ${result.matched} enumeration areas and added to selection`,
						life: 5000,
					});
				} else {
					this.messageService.add({
						severity: 'warn',
						summary: 'No Matches',
						detail: 'No enumeration areas were matched. Please check your CSV file.',
						life: 5000,
					});
				}
			} catch (error) {
				this.uploading = false;
				console.error('Error parsing CSV:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Parse Error',
					detail: 'Failed to parse CSV file. Please check the format.',
					life: 5000,
				});
			}
		};

		reader.onerror = () => {
			this.uploading = false;
			this.messageService.add({
				severity: 'error',
				summary: 'Read Error',
				detail: 'Failed to read file',
				life: 5000,
			});
		};

		reader.readAsText(this.bulkUploadFile);
	}

	/**
	 * Parse CSV line handling quoted fields
	 */
	private parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					// Escaped quote
					current += '"';
					i++; // Skip next quote
				} else {
					// Toggle quote state
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				// Field separator
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}

		// Add last field
		result.push(current.trim());
		return result;
	}

	/**
	 * Parse CSV and match enumeration areas
	 */
	private parseCSVAndMatchEAs(csv: string): BulkUploadResult {
		const lines = csv.split('\n').filter((line) => line.trim());
		if (lines.length < 2) {
			return {
				totalRows: 0,
				matched: 0,
				notFound: 0,
				errors: [],
			};
		}

		// Parse header
		const header = this.parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/"/g, ''));
		const dzongkhagIndex = header.findIndex((h) => h.includes('dzongkhag') || h.includes('dzongkhagcode'));
		const adminZoneIndex = header.findIndex((h) => (h.includes('admin') && h.includes('zone')) || h.includes('administrativezonecode'));
		const subAdminZoneIndex = header.findIndex((h) => (h.includes('sub') && h.includes('admin')) || h.includes('subadministrativezonecode'));
		const eaCodeIndex = header.findIndex((h) => h.includes('enumeration') || h.includes('eacode') || h.includes('enumerationcode'));

		if (eaCodeIndex === -1) {
			return {
				totalRows: lines.length - 1,
				matched: 0,
				notFound: lines.length - 1,
				errors: [
					{
						row: 0,
						codes: 'Header',
						error: 'Invalid CSV format. Required column: Enumeration Code (or EA Code)',
					},
				],
			};
		}

		const result: BulkUploadResult = {
			totalRows: lines.length - 1,
			matched: 0,
			notFound: 0,
			errors: [],
		};

		// Process data rows
		for (let i = 1; i < lines.length; i++) {
			const row = this.parseCSVLine(lines[i]).map((cell) => cell.trim().replace(/"/g, ''));
			if (row.length <= eaCodeIndex) {
				result.errors.push({
					row: i + 1,
					codes: row.join(', '),
					error: 'Incomplete row data',
				});
				result.notFound++;
				continue;
			}

			const dzongkhagCode = dzongkhagIndex >= 0 ? row[dzongkhagIndex] : '';
			const adminZoneCode = adminZoneIndex >= 0 ? row[adminZoneIndex] : '';
			const subAdminZoneCode = subAdminZoneIndex >= 0 ? row[subAdminZoneIndex] : '';
			const eaCode = row[eaCodeIndex];

			if (!eaCode) {
				result.errors.push({
					row: i + 1,
					codes: row.join(', '),
					error: 'Enumeration code is required',
				});
				result.notFound++;
				continue;
			}

			const codes = [dzongkhagCode, adminZoneCode, subAdminZoneCode, eaCode].filter(Boolean).join(', ');

			const normalizedEaCode = eaCode.toLowerCase();

			// Find matching EA by code (areaCode or eaCode), case-insensitive
			const matchedEA = this.allEnumerationAreas.find((ea) => {
				const areaCode = (ea.areaCode || '').toLowerCase();
				const altCode = (ea as any).eaCode ? String((ea as any).eaCode).toLowerCase() : '';
				return areaCode === normalizedEaCode || altCode === normalizedEaCode;
			});

			if (matchedEA) {
				result.matched++;
			} else {
				result.notFound++;
				result.errors.push({
					row: i + 1,
					codes: codes,
					error: 'Enumeration area not found in current selection',
				});
			}
		}

		return result;
	}

	/**
	 * Find enumeration areas by parsing CSV codes
	 */
	private findEAsByCodes(csv: string): EnumerationArea[] {
		const lines = csv.split('\n').filter((line) => line.trim());
		if (lines.length < 2) return [];

		const header = this.parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/"/g, ''));
		const eaCodeIndex = header.findIndex((h) => h.includes('enumeration') || h.includes('eacode') || h.includes('enumerationcode'));

		if (eaCodeIndex === -1) return [];

		const matchedEAs: EnumerationArea[] = [];

		for (let i = 1; i < lines.length; i++) {
			const row = this.parseCSVLine(lines[i]).map((cell) => cell.trim().replace(/"/g, ''));
			if (row.length <= eaCodeIndex) continue;

			const eaCode = row[eaCodeIndex];
			if (!eaCode) continue;

			const normalizedEaCode = eaCode.toLowerCase();

			const matchedEA = this.allEnumerationAreas.find((ea) => {
				const areaCode = (ea.areaCode || '').toLowerCase();
				const altCode = (ea as any).eaCode ? String((ea as any).eaCode).toLowerCase() : '';
				return areaCode === normalizedEaCode || altCode === normalizedEaCode;
			});

			if (matchedEA && !matchedEAs.find((ea) => ea.id === matchedEA.id)) {
				matchedEAs.push(matchedEA);
			}
		}

		return matchedEAs;
	}
}
