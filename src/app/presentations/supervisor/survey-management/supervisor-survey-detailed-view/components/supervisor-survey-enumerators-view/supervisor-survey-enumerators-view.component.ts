import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService, ConfirmationService } from 'primeng/api';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import { SurveyEnumeratorDataService } from '../../../../../../core/dataservice/survey-enumerator/survey-enumerator.dataservice';
import {
	SurveyEnumerator,
	EnumeratorCSVData,
	BulkAssignCSVDto,
} from '../../../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';

interface ParsedCSVResult {
	valid: EnumeratorCSVData[];
	invalid: Array<{ row: number; data: any; errors: string[] }>;
}

@Component({
	selector: 'app-supervisor-survey-enumerators-view',
	templateUrl: './supervisor-survey-enumerators-view.component.html',
	styleUrls: ['./supervisor-survey-enumerators-view.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class SupervisorSurveyEnumeratorsViewComponent implements OnInit {
	@Input() surveyId!: number;

	// Supervisors
	supervisors: any[] = [];
	loadingSupervisors = false;

	// Enumerators
	enumerators: SurveyEnumerator[] = [];
	loadingEnumerators = false;
	selectedEnumerators: SurveyEnumerator[] = [];

	// Upload dialog
	showUploadDialog = false;
	selectedFile: File | null = null;
	parsedData: ParsedCSVResult | null = null;
	showPreview = false;
	parsing = false;
	uploading = false;

	// Table columns
	enumeratorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.cid', header: 'CID' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'user.phoneNumber', header: 'Phone' },
		{ field: 'assignedAt', header: 'Assigned Date' },
	];

	supervisorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'dzongkhags', header: 'Assigned Dzongkhags' },
	];

	constructor(
		private surveyService: SurveyDataService,
		private surveyEnumeratorService: SurveyEnumeratorDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService
	) {}

	ngOnInit() {
		if (this.surveyId) {
			this.loadData();
		}
	}

	/**
	 * Load all data
	 */
	loadData() {
		this.loadSupervisors();
		this.loadEnumerators();
	}

	/**
	 * Load supervisors for this survey
	 */
	loadSupervisors() {
		this.loadingSupervisors = true;
		this.surveyService.getSupervisorsForSurvey(this.surveyId).subscribe({
			next: (data) => {
				this.supervisors = data;
				this.loadingSupervisors = false;
			},
			error: (error) => {
				console.error('Error loading supervisors:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load supervisors',
					life: 3000,
				});
				this.loadingSupervisors = false;
			},
		});
	}

	/**
	 * Load enumerators for this survey
	 */
	loadEnumerators() {
		this.loadingEnumerators = true;
		this.surveyEnumeratorService
			.getEnumeratorsBySurvey(this.surveyId)
			.subscribe({
				next: (data) => {
					this.enumerators = data;
					this.loadingEnumerators = false;
				},
				error: (error) => {
					console.error('Error loading enumerators:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load enumerators',
						life: 3000,
					});
					this.loadingEnumerators = false;
				},
			});
	}

	/**
	 * Get dzongkhag names for supervisor
	 */
	getDzongkhagNames(supervisor: any): string {
		if (!supervisor.dzongkhags || supervisor.dzongkhags.length === 0) {
			return 'N/A';
		}
		return supervisor.dzongkhags
			.map((d: any) => d.name || d)
			.join(', ');
	}

	/**
	 * Format date for display
	 */
	formatDate(date: string | Date | undefined): string {
		if (!date) return 'N/A';
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	/**
	 * Open upload dialog
	 */
	openUploadDialog() {
		this.showUploadDialog = true;
		this.selectedFile = null;
		this.parsedData = null;
		this.showPreview = false;
	}

	/**
	 * Handle file selection
	 */
	onFileSelect(event: any) {
		const file = event.files[0];
		if (file) {
			this.selectedFile = file;
			this.parseCSVFile(file);
		}
	}

	/**
	 * Parse CSV file
	 */
	async parseCSVFile(file: File) {
		this.parsing = true;
		try {
			const text = await file.text();
			const result = this.parseCSVText(text);
			this.parsedData = result;
			this.showPreview = true;

			if (result.invalid.length > 0) {
				this.messageService.add({
					severity: 'warn',
					summary: 'Validation Warnings',
					detail: `${result.invalid.length} row(s) have validation errors`,
					life: 5000,
				});
			} else {
				this.messageService.add({
					severity: 'success',
					summary: 'File Parsed',
					detail: `${result.valid.length} enumerator(s) ready to upload`,
					life: 3000,
				});
			}
		} catch (error) {
			console.error('Error parsing CSV:', error);
			this.messageService.add({
				severity: 'error',
				summary: 'Parse Error',
				detail: 'Failed to parse CSV file. Please check the format.',
			});
		} finally {
			this.parsing = false;
		}
	}

	/**
	 * Parse CSV text content
	 */
	parseCSVText(text: string): ParsedCSVResult {
		const lines = text.split('\n').filter((line) => line.trim());
		if (lines.length < 2) {
			throw new Error(
				'CSV file must have at least a header row and one data row'
			);
		}

		// Parse header
		const header = lines[0].split(',').map((h) => h.trim());
		const nameIndex = header.findIndex((h) => h.toLowerCase() === 'name');
		const cidIndex = header.findIndex((h) => h.toLowerCase() === 'cid');
		const emailIndex = header.findIndex(
			(h) => h.toLowerCase() === 'emailaddress' || h.toLowerCase() === 'email'
		);
		const phoneIndex = header.findIndex(
			(h) => h.toLowerCase() === 'phonenumber' || h.toLowerCase() === 'phone'
		);
		const passwordIndex = header.findIndex(
			(h) => h.toLowerCase() === 'password'
		);

		if (nameIndex === -1 || cidIndex === -1) {
			throw new Error('CSV must have "name" and "cid" columns');
		}

		const valid: EnumeratorCSVData[] = [];
		const invalid: Array<{ row: number; data: any; errors: string[] }> = [];

		// Parse data rows
		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const values = this.parseCSVLine(line);
			const errors: string[] = [];

			const name = values[nameIndex]?.trim() || '';
			const cid = values[cidIndex]?.trim() || '';
			const emailAddress = emailIndex !== -1 ? values[emailIndex]?.trim() : '';
			const phoneNumber = phoneIndex !== -1 ? values[phoneIndex]?.trim() : '';
			const password =
				passwordIndex !== -1 ? values[passwordIndex]?.trim() : '';

			// Validate required fields
			if (!name) {
				errors.push('Name is required');
			}
			if (!cid) {
				errors.push('CID is required');
			} else if (!/^\d{11}$/.test(cid)) {
				errors.push('CID must be 11 digits');
			}

			// Validate email format if provided
			if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) {
				errors.push('Invalid email format');
			}

			// Validate phone format if provided
			if (phoneNumber && !/^\d{8}$/.test(phoneNumber)) {
				errors.push('Phone number must be 8 digits');
			}

			if (errors.length > 0) {
				invalid.push({
					row: i + 1,
					data: { name, cid, emailAddress, phoneNumber },
					errors,
				});
			} else {
				const enumerator: EnumeratorCSVData = {
					name,
					cid,
				};
				if (emailAddress) enumerator.emailAddress = emailAddress;
				if (phoneNumber) enumerator.phoneNumber = phoneNumber;
				if (password) enumerator.password = password;

				valid.push(enumerator);
			}
		}

		return { valid, invalid };
	}

	/**
	 * Parse a single CSV line handling quoted values
	 */
	parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;

		for (let i = 0; i < line.length; i++) {
			const char = line[i];

			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				result.push(current);
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current);

		return result;
	}

	/**
	 * Clear file selection
	 */
	clearFile() {
		this.selectedFile = null;
		this.parsedData = null;
		this.showPreview = false;
	}

	/**
	 * Download CSV template
	 */
	downloadTemplate() {
		const template = `name,cid,emailAddress,phoneNumber,password
Tashi Dorji,11501002345,tashi.dorji@example.com,17123456,
Pema Wangmo,11602001234,,17654321,
Karma Tshering,11703005678,,,`;

		const blob = new Blob([template], { type: 'text/csv' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = 'enumerators_template.csv';
		link.click();
		window.URL.revokeObjectURL(url);

		this.messageService.add({
			severity: 'success',
			summary: 'Template Downloaded',
			detail: 'CSV template downloaded successfully',
		});
	}

	/**
	 * Upload enumerators via CSV
	 */
	uploadEnumerators() {
		if (!this.parsedData || this.parsedData.valid.length === 0) {
			this.messageService.add({
				severity: 'error',
				summary: 'No Valid Data',
				detail: 'Please upload a valid CSV file with enumerator data',
			});
			return;
		}

		this.uploading = true;
		const dto: BulkAssignCSVDto = {
			surveyId: this.surveyId,
			enumerators: this.parsedData.valid,
		};

		this.surveyEnumeratorService.bulkAssignEnumeratorsCSV(dto).subscribe({
			next: (response) => {
				this.messageService.add({
					severity: 'success',
					summary: 'Upload Successful',
					detail: `Successfully uploaded ${response.success} enumerator(s). Created: ${response.created}, Existing: ${response.existing}`,
					life: 5000,
				});

				if (response.failed > 0) {
					console.error('Failed assignments:', response.errors);
					this.messageService.add({
						severity: 'warn',
						summary: 'Partial Success',
						detail: `${response.failed} enumerator(s) failed to upload`,
						life: 5000,
					});
				}

				this.showUploadDialog = false;
				this.loadEnumerators();
				this.uploading = false;
			},
			error: (error) => {
				console.error('Error uploading enumerators:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Upload Failed',
					detail: 'Failed to upload enumerators',
					life: 3000,
				});
				this.uploading = false;
			},
		});
	}

	/**
	 * Delete selected enumerators
	 */
	deleteSelectedEnumerators() {
		if (this.selectedEnumerators.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select enumerators to delete',
				life: 3000,
			});
			return;
		}

		this.confirmationService.confirm({
			message: `Are you sure you want to remove ${this.selectedEnumerators.length} enumerator(s) from this survey?`,
			header: 'Confirm Deletion',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				const userIds = this.selectedEnumerators.map((e) => e.userId);
				this.surveyEnumeratorService
					.bulkRemoveEnumerators(this.surveyId, { userIds })
					.subscribe({
						next: (response) => {
							this.messageService.add({
								severity: 'success',
								summary: 'Deleted',
								detail: `Removed ${response.removedCount} enumerator(s)`,
								life: 3000,
							});
							this.selectedEnumerators = [];
							this.loadEnumerators();
						},
						error: (error) => {
							console.error('Error deleting enumerators:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: 'Failed to delete enumerators',
								life: 3000,
							});
						},
					});
			},
		});
	}

	/**
	 * Delete single enumerator
	 */
	deleteEnumerator(enumerator: SurveyEnumerator) {
		this.confirmationService.confirm({
			message: `Are you sure you want to remove ${enumerator.user?.name} from this survey?`,
			header: 'Confirm Deletion',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				this.surveyEnumeratorService
					.removeEnumerator(enumerator.userId, this.surveyId)
					.subscribe({
						next: () => {
							this.messageService.add({
								severity: 'success',
								summary: 'Deleted',
								detail: 'Enumerator removed successfully',
								life: 3000,
							});
							this.loadEnumerators();
						},
						error: (error) => {
							console.error('Error deleting enumerator:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: 'Failed to delete enumerator',
								life: 3000,
							});
						},
					});
			},
		});
	}
}

