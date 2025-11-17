import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { MessageService } from 'primeng/api';

interface EnumeratorData {
	name: string;
	cid: string;
	emailAddress?: string;
	phoneNumber?: string;
	password?: string;
}

interface ParsedCSVResult {
	valid: EnumeratorData[];
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
	@Output() completed = new EventEmitter<EnumeratorData[]>();
	@Output() back = new EventEmitter<void>();

	selectedFile: File | null = null;
	parsedData: ParsedCSVResult | null = null;
	showPreview = false;
	parsing = false;

	// Table columns for preview
	previewColumns = [
		{ field: 'name', header: 'Name' },
		{ field: 'cid', header: 'CID' },
		{ field: 'emailAddress', header: 'Email' },
		{ field: 'phoneNumber', header: 'Phone' },
	];

	constructor(private messageService: MessageService) {}

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

		const valid: EnumeratorData[] = [];
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
				const enumerator: EnumeratorData = {
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
