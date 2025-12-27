import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { EnumeratorCSVData } from '../../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';
import { SurveyEnumeratorDataService } from '../../../../../core/dataservice/survey-enumerator/survey-enumerator.dataservice';

interface ParsedCSVResult {
	valid: EnumeratorCSVData[];
	invalid: Array<{ row: number; data: any; errors: string[] }>;
}

@Component({
	selector: 'app-admin-survey-creator-enumerators',
	templateUrl: './admin-survey-creator-enumerators.component.html',
	styleUrls: ['./admin-survey-creator-enumerators.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminSurveyCreatorEnumeratorsComponent {
	@Input() submitting = false;
	@Output() completed = new EventEmitter<EnumeratorCSVData[]>();
	@Output() back = new EventEmitter<void>();

	selectedFile: File | null = null;
	parsedData: ParsedCSVResult | null = null;
	showPreview = false;
	parsing = false;
	downloadingTemplate = false;

	// Table columns for preview
	previewColumns = [
		{ field: 'name', header: 'Name' },
		{ field: 'cid', header: 'CID' },
		{ field: 'emailAddress', header: 'Email' },
		{ field: 'phoneNumber', header: 'Phone' },
		{ field: 'dzongkhagCode', header: 'Dzongkhag Code' },
	];

	constructor(
		private messageService: MessageService,
		private surveyEnumeratorService: SurveyEnumeratorDataService
	) {}

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
			(h) => h.toLowerCase() === 'emailaddress' || h.toLowerCase() === 'email' || h.toLowerCase().includes('email')
		);
		const phoneIndex = header.findIndex(
			(h) => h.toLowerCase() === 'phonenumber' || h.toLowerCase() === 'phone' || h.toLowerCase().includes('phone')
		);
		const passwordIndex = header.findIndex(
			(h) => h.toLowerCase() === 'password'
		);
		const dzongkhagCodeIndex = header.findIndex(
			(h) => h.toLowerCase().includes('dzongkhag') && h.toLowerCase().includes('code')
		);

		if (nameIndex === -1 || cidIndex === -1) {
			throw new Error('CSV must have "name" and "cid" columns');
		}
		if (dzongkhagCodeIndex === -1) {
			throw new Error('CSV must have "Dzongkhag Code" column');
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
			const dzongkhagCode = values[dzongkhagCodeIndex]?.trim() || '';

			// Validate required fields
			if (!name) {
				errors.push('Name is required');
			}
			if (!cid) {
				errors.push('CID is required');
			} else if (!/^\d{11}$/.test(cid)) {
				errors.push('CID must be 11 digits');
			}
			if (!dzongkhagCode) {
				errors.push('Dzongkhag Code is required');
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
					data: { name, cid, emailAddress, phoneNumber, dzongkhagCode },
					errors,
				});
			} else {
				const enumerator: EnumeratorCSVData = {
					name,
					cid,
					dzongkhagCode: this.normalizeDzongkhagCode(dzongkhagCode),
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
	 * Normalize dzongkhag code (pad single digits with leading zero)
	 */
	private normalizeDzongkhagCode(code: string): string {
		// If it's a numeric string, pad with leading zero if single digit
		if (/^\d+$/.test(code)) {
			return code.length === 1 ? `0${code}` : code;
		}
		return code;
	}

	/**
	 * Download CSV template from API
	 */
	downloadTemplate() {
		this.downloadingTemplate = true;
		this.surveyEnumeratorService.downloadTemplateCSV().subscribe({
			next: (blob: Blob) => {
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
				this.downloadingTemplate = false;
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download CSV template. Please try again.',
				});
				this.downloadingTemplate = false;
			},
		});
	}

	/**
	 * Submit with parsed enumerators
	 */
	onSubmit() {
		if (this.parsedData && this.parsedData.valid.length > 0) {
			this.completed.emit(this.parsedData.valid);
		} else {
			this.messageService.add({
				severity: 'error',
				summary: 'No Valid Data',
				detail: 'Please upload a valid CSV file with enumerator data',
			});
		}
	}

	/**
	 * Skip enumerator upload
	 */
	onSkip() {
		this.completed.emit([]);
	}

	/**
	 * Go back to previous step
	 */
	onBack() {
		this.back.emit();
	}
}
