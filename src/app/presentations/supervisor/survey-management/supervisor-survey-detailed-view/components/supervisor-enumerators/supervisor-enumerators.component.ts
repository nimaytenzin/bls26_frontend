import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { forkJoin } from 'rxjs';
import { BulkAssignCSVDto, EnumeratorCSVData, SurveyEnumerator } from '../../../../../../core/dataservice/survey-enumerator/survey-enumerator.dto';
import {  UpdateEnumeratorDto, ResetPasswordDto, CreateSingleEnumeratorDto, CreateSingleEnumeratorResponse } from '../../../../../../core/dataservice/survey-enumerator/supervisor-survey-enumerator.dataservice';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { SurveyDataService } from '../../../../../../core/dataservice/survey/survey.dataservice';
import { SupervisorSurveyEnumeratorDataService } from '../../../../../../core/dataservice/survey-enumerator/supervisor-survey-enumerator.dataservice';
import { AuthService } from '../../../../../../core/dataservice/auth/auth.service';
import { SupervisorDzongkhagAssignment } from '../../../../../../core/dataservice/auth/auth.interface';

interface ParsedCSVResult {
	valid: EnumeratorCSVData[];
	invalid: Array<{ row: number; data: any; errors: string[] }>;
}

@Component({
	selector: 'app-supervisor-enumerators',
	templateUrl: './supervisor-enumerators.component.html',
	styleUrls: ['./supervisor-enumerators.component.scss'],
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class SupervisorEnumeratorsComponent implements OnInit {
	@Input() surveyId!: number;

	// Supervisors
	supervisors: any[] = [];
	loadingSupervisors = false;

	// Enumerators
	surveyEnumerators: SurveyEnumerator[] = [];
	groupedEnumerators: Map<number, SurveyEnumerator[]> = new Map();
	loadingEnumerators = false;
	selectedEnumerators: SurveyEnumerator[] = [];

	/**
	 * Get assignments for a specific enumerator
	 */
	getAssignmentsForEnumerator(userId: number): SurveyEnumerator[] {
		return this.groupedEnumerators.get(userId) || [];
	}

	// Upload dialog
	showUploadDialog = false;
	selectedFile: File | null = null;
	parsedData: ParsedCSVResult | null = null;
	showPreview = false;
	parsing = false;
	uploading = false;

	// Edit dialog
	showEditDialog = false;
	editForm!: FormGroup;
	editingEnumerator: SurveyEnumerator | null = null;
	saving = false;

	// Reset password dialog
	showResetPasswordDialog = false;
	resetPasswordForm!: FormGroup;
	resettingPasswordEnumerator: SurveyEnumerator | null = null;
	resettingPassword = false;

	// Create dialog
	showCreateDialog = false;
	createForm!: FormGroup;
	creating = false;
	availableDzongkhags: any[] = [];

	// Table columns
	enumeratorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.cid', header: 'CID' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'user.phoneNumber', header: 'Phone' },
		{ field: 'dzongkhags', header: 'Assigned Dzongkhags' },
		{ field: 'assignedAt', header: 'Assigned Date' },
	];

	supervisorColumns = [
		{ field: 'user.name', header: 'Name' },
		{ field: 'user.emailAddress', header: 'Email' },
		{ field: 'dzongkhags', header: 'Assigned Dzongkhags' },
	];

	constructor(
		private surveyService: SurveyDataService,
		private surveyEnumeratorService: SupervisorSurveyEnumeratorDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private fb: FormBuilder,
		private authService: AuthService
	) {}

	ngOnInit() {
		this.initializeForms();
		if (this.surveyId) {
			this.loadData();
		}
	}

	/**
	 * Initialize form groups
	 */
	initializeForms() {
		// Edit form
		this.editForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(3)]],
			cid: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
			emailAddress: ['', [Validators.required, Validators.email]],
			phoneNumber: ['', [Validators.pattern(/^$|^[17689]\d{7}$/)]],
			dzongkhagIds: [[]],
		});

		// Reset password form
		this.resetPasswordForm = this.fb.group({
			newPassword: [
				'',
				[
					Validators.required,
					Validators.minLength(8),
					this.passwordStrengthValidator,
				],
			],
			confirmPassword: ['', [Validators.required]],
		}, { validators: this.passwordMatchValidator });

		// Create form
		this.createForm = this.fb.group({
			name: ['', [Validators.required, Validators.minLength(3)]],
			cid: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
			emailAddress: ['', [Validators.email]],
			phoneNumber: ['', [Validators.pattern(/^$|^[17689]\d{7}$/)]],
			password: [''],
			dzongkhagIds: [[], [Validators.required, Validators.minLength(1)]],
		});
	}

	/**
	 * Password strength validator
	 */
	private passwordStrengthValidator(
		control: AbstractControl
	): ValidationErrors | null {
		const value = control.value;
		if (!value) {
			return null;
		}

		const hasUpperCase = /[A-Z]/.test(value);
		const hasLowerCase = /[a-z]/.test(value);
		const hasNumeric = /[0-9]/.test(value);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

		const strength =
			(hasUpperCase ? 1 : 0) +
			(hasLowerCase ? 1 : 0) +
			(hasNumeric ? 1 : 0) +
			(hasSpecialChar ? 1 : 0);

		if (strength < 3) {
			return { weakPassword: true };
		}

		return null;
	}

	/**
	 * Password match validator
	 */
	passwordMatchValidator(form: FormGroup) {
		const password = form.get('newPassword');
		const confirmPassword = form.get('confirmPassword');
		if (password && confirmPassword && password.value !== confirmPassword.value) {
			confirmPassword.setErrors({ passwordMismatch: true });
			return { passwordMismatch: true };
		}
		return null;
	}

	/**
	 * Load all data
	 */
	loadData() {
		this.loadSupervisors();
		this.loadEnumerators();
		// Note: loadScopedDzongkhags() is called from loadSupervisors() after supervisors are loaded
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
				// After supervisors are loaded, load scoped dzongkhags
				this.loadScopedDzongkhags();
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
	 * Load scoped dzongkhags for current supervisor
	 * This ensures only dzongkhags assigned to the current supervisor are available
	 */
	loadScopedDzongkhags() {
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) {
			console.warn('No current user found, cannot scope dzongkhags');
			this.availableDzongkhags = [];
			return;
		}

		this.authService.getMyDzongkhagAssignments().subscribe({
			next: (assignments: SupervisorDzongkhagAssignment[]) => {
				// Extract dzongkhags from assignments
				const scopedDzongkhagIds = new Set<number>();
				const scopedDzongkhags: any[] = [];

				assignments.forEach((assignment: any) => {
					// Handle different response shapes
					if (assignment.dzongkhagId) {
						scopedDzongkhagIds.add(assignment.dzongkhagId);
					}
					// If assignment includes dzongkhag object (checking for typo in interface)
					if (assignment.dzonkghags && Array.isArray(assignment.dzonkghags)) {
						assignment.dzonkghags.forEach((dz: any) => {
							if (dz && dz.id) {
								if (!scopedDzongkhagIds.has(dz.id)) {
									scopedDzongkhagIds.add(dz.id);
									scopedDzongkhags.push(dz);
								}
							}
						});
					}
					// Also check for correct spelling
					if (assignment.dzongkhags && Array.isArray(assignment.dzongkhags)) {
						assignment.dzongkhags.forEach((dz: any) => {
							if (dz && dz.id) {
								if (!scopedDzongkhagIds.has(dz.id)) {
									scopedDzongkhagIds.add(dz.id);
									scopedDzongkhags.push(dz);
								}
							}
						});
					}
					// If assignment has dzongkhag object directly
					if (assignment.dzongkhag && assignment.dzongkhag.id) {
						if (!scopedDzongkhagIds.has(assignment.dzongkhag.id)) {
							scopedDzongkhagIds.add(assignment.dzongkhag.id);
							scopedDzongkhags.push(assignment.dzongkhag);
						}
					}
				});

				// Set available dzongkhags to only the scoped ones
				if (scopedDzongkhags.length > 0) {
					// Use dzongkhag objects directly if available
					this.availableDzongkhags = scopedDzongkhags;
				} else if (scopedDzongkhagIds.size > 0) {
					// If we only have IDs, extract dzongkhag objects from supervisors data
					const dzongkhagMap = new Map<number, any>();
					// First, try to find current supervisor and use their dzongkhags
					const currentSupervisor = this.supervisors.find(s => s.id === currentUser.id);
					if (currentSupervisor && currentSupervisor.dzongkhags && Array.isArray(currentSupervisor.dzongkhags)) {
						currentSupervisor.dzongkhags.forEach((dz: any) => {
							if (dz && dz.id && scopedDzongkhagIds.has(dz.id) && !dzongkhagMap.has(dz.id)) {
								dzongkhagMap.set(dz.id, dz);
							}
						});
					}
					// If still empty, check all supervisors (fallback)
					if (dzongkhagMap.size === 0) {
						this.supervisors.forEach((supervisor) => {
							if (supervisor.dzongkhags && Array.isArray(supervisor.dzongkhags)) {
								supervisor.dzongkhags.forEach((dz: any) => {
									if (dz && dz.id && scopedDzongkhagIds.has(dz.id) && !dzongkhagMap.has(dz.id)) {
										dzongkhagMap.set(dz.id, dz);
									}
								});
							}
						});
					}
					this.availableDzongkhags = Array.from(dzongkhagMap.values());
				} else {
					// No assignments found - try fallback to current supervisor's dzongkhags from supervisors list
					const currentSupervisor = this.supervisors.find(s => s.id === currentUser.id);
					if (currentSupervisor && currentSupervisor.dzongkhags && Array.isArray(currentSupervisor.dzongkhags)) {
						this.availableDzongkhags = currentSupervisor.dzongkhags;
					} else {
						this.availableDzongkhags = [];
					}
				}
			},
			error: (error) => {
				console.error('Error loading scoped dzongkhags:', error);
				// Fallback: extract from supervisors but only for current user
				const currentSupervisor = this.supervisors.find(s => s.id === currentUser.id);
				if (currentSupervisor && currentSupervisor.dzongkhags && Array.isArray(currentSupervisor.dzongkhags)) {
					this.availableDzongkhags = currentSupervisor.dzongkhags;
				} else {
					this.availableDzongkhags = [];
				}
				this.messageService.add({
					severity: 'warn',
					summary: 'Warning',
					detail: 'Could not load supervisor dzongkhag assignments. Using fallback.',
					life: 3000,
				});
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
					this.surveyEnumerators = data;
					this.groupEnumeratorsByUser(data);
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
	 * Group enumerators by userId to handle multiple dzongkhag assignments
	 */
	groupEnumeratorsByUser(assignments: SurveyEnumerator[]) {
		this.groupedEnumerators.clear();
		assignments.forEach((assignment) => {
			const userId = assignment.userId;
			if (!this.groupedEnumerators.has(userId)) {
				this.groupedEnumerators.set(userId, []);
			}
			this.groupedEnumerators.get(userId)!.push(assignment);
		});
	}

	/**
	 * Get grouped enumerators as array for table display
	 */
	getGroupedEnumeratorsArray(): SurveyEnumerator[] {
		return Array.from(this.groupedEnumerators.values()).map(
			(assignments) => assignments[0] // Return first assignment as representative
		);
	}

	/**
	 * Get all dzongkhags for an enumerator
	 */
	getDzongkhagsForEnumerator(enumerator: SurveyEnumerator): string {
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		const dzongkhags = assignments
			.map((a) => a.dzongkhag?.name || `Dzongkhag ${a.dzongkhagId}`)
			.filter((name) => name);
		
		if (dzongkhags.length === 0) {
			return 'N/A';
		}
		return dzongkhags.join(', ');
	}

	/**
	 * Get all dzongkhag IDs for an enumerator
	 */
	getDzongkhagIdsForEnumerator(enumerator: SurveyEnumerator): number[] {
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		return assignments
			.map((a) => a.dzongkhagId)
			.filter((id): id is number => id !== null);
	}

	/**
	 * Check if enumerator is active (has at least one active assignment)
	 */
	isEnumeratorActive(enumerator: SurveyEnumerator): boolean {
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		if (assignments.length === 0) return false;
		// Consider active if at least one assignment is active
		// If isActive is undefined, treat as active (backward compatibility)
		return assignments.some(a => a.isActive !== false);
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
			(h) => h.toLowerCase() === 'emailaddress' || h.toLowerCase() === 'email' || h.toLowerCase().includes('email')
		);
		const phoneIndex = header.findIndex(
			(h) => h.toLowerCase() === 'phonenumber' || h.toLowerCase() === 'phone' || h.toLowerCase().includes('phone')
		);
		const passwordIndex = header.findIndex(
			(h) => h.toLowerCase() === 'password'
		);
		const dzongkhagCodeIndex = header.findIndex(
			(h) => h.toLowerCase().includes('dzongkhag') && 
				   h.toLowerCase().includes('code') &&
				   !h.toLowerCase().includes('codes')
		);
		const dzongkhagCodesIndex = header.findIndex(
			(h) => h.toLowerCase().includes('dzongkhag') && h.toLowerCase().includes('codes')
		);

		if (nameIndex === -1 || cidIndex === -1) {
			throw new Error('CSV must have "name" and "cid" columns');
		}
		if (dzongkhagCodeIndex === -1 && dzongkhagCodesIndex === -1) {
			throw new Error('CSV must have "Dzongkhag Code" or "Dzongkhag Codes" column');
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
			
			// Support both single code and multiple codes (comma-separated)
			const dzongkhagCodesRaw = dzongkhagCodesIndex !== -1 
				? values[dzongkhagCodesIndex]?.trim() || ''
				: dzongkhagCodeIndex !== -1 
					? values[dzongkhagCodeIndex]?.trim() || ''
					: '';
			
			const dzongkhagCodes = dzongkhagCodesRaw
				.split(',')
				.map((code) => code.trim())
				.filter((code) => code.length > 0);

			// Validate required fields
			if (!name) {
				errors.push('Name is required');
			}
			if (!cid) {
				errors.push('CID is required');
			} else if (!/^\d{11}$/.test(cid)) {
				errors.push('CID must be 11 digits');
			}
			if (dzongkhagCodes.length === 0) {
				errors.push('At least one Dzongkhag Code is required');
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
					data: { name, cid, emailAddress, phoneNumber, dzongkhagCodes: dzongkhagCodes.join(', ') },
					errors,
				});
			} else {
				// Create one entry per dzongkhag code for preview
				// The backend will parse the original CSV file with comma-separated codes
				dzongkhagCodes.forEach((code) => {
					const enumerator: EnumeratorCSVData = {
						name,
						cid,
						dzongkhagCode: this.normalizeDzongkhagCode(code),
					};
					if (emailAddress) enumerator.emailAddress = emailAddress;
					if (phoneNumber) enumerator.phoneNumber = phoneNumber;
					if (password) enumerator.password = password;

					valid.push(enumerator);
				});
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
		this.surveyEnumeratorService.downloadTemplate().subscribe({
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
			},
			error: (error) => {
				console.error('Error downloading template:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Download Failed',
					detail: 'Failed to download CSV template. Please try again.',
				});
			},
		});
	}

	/**
	 * Upload enumerators via CSV
	 */
	uploadEnumerators() {
		if (!this.selectedFile) {
			this.messageService.add({
				severity: 'error',
				summary: 'No File Selected',
				detail: 'Please select a CSV file to upload',
			});
			return;
		}

		this.uploading = true;
		// Supervisor API expects file upload directly
		this.surveyEnumeratorService.bulkUploadEnumerators(this.surveyId, this.selectedFile).subscribe({
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
				this.selectedFile = null;
				this.parsedData = null;
				this.showPreview = false;
				this.loadEnumerators();
				this.uploading = false;
			},
			error: (error) => {
				console.error('Error uploading enumerators:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Upload Failed',
					detail: error?.error?.message || 'Failed to upload enumerators',
					life: 3000,
				});
				this.uploading = false;
			},
		});
	}

	/**
	 * Delete selected enumerators
	 * Removes all assignments for selected enumerators (all dzongkhags)
	 */
	deleteSelectedEnumerators() {
		// Filter out inactive enumerators
		const activeEnumerators = this.selectedEnumerators.filter(e => this.isEnumeratorActive(e));
		
		if (activeEnumerators.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Selection',
				detail: 'Please select active enumerators to delete',
				life: 3000,
			});
			return;
		}

		const uniqueUserIds = [...new Set(activeEnumerators.map((e) => e.userId))];
		const totalAssignments = activeEnumerators.reduce((sum, e) => {
			const assignments = this.groupedEnumerators.get(e.userId) || [];
			return sum + assignments.length;
		}, 0);

		this.confirmationService.confirm({
			message: `Are you sure you want to remove ${uniqueUserIds.length} enumerator(s) with ${totalAssignments} total assignment(s) from this survey? This will remove all dzongkhag assignments for these enumerators.`,
			header: 'Confirm Deletion',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				// Soft delete all assignments for each enumerator
				const deleteObservables = uniqueUserIds.map(userId => 
					this.surveyEnumeratorService.softDeleteAllAssignments(userId, this.surveyId)
				);
				
				forkJoin(deleteObservables).subscribe({
					next: (responses) => {
						const totalDeleted = responses.reduce((sum, r) => sum + (r.deletedCount || 0), 0);
						this.messageService.add({
							severity: 'success',
							summary: 'Deleted',
							detail: `Removed ${uniqueUserIds.length} enumerator(s) with ${totalDeleted} assignment(s)`,
							life: 3000,
						});
						this.selectedEnumerators = [];
						this.loadEnumerators();
					},
					error: (error: any) => {
						console.error('Error deleting enumerators:', error);
						this.messageService.add({
							severity: 'error',
							summary: 'Error',
							detail: 'Failed to delete enumerators',
							life: 3000,
						});
					}
				});
			},
		});
	}

	/**
	 * Delete single enumerator
	 * Removes all assignments for this enumerator (all dzongkhags)
	 */
	deleteEnumerator(enumerator: SurveyEnumerator) {
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		const dzongkhagCount = assignments.length;
		const dzongkhagsText = dzongkhagCount > 1 
			? `all ${dzongkhagCount} dzongkhag assignments` 
			: 'this survey';

		this.confirmationService.confirm({
			message: `Are you sure you want to remove ${enumerator.user?.name} from ${dzongkhagsText}?`,
			header: 'Confirm Deletion',
			icon: 'pi pi-exclamation-triangle',
			accept: () => {
				this.surveyEnumeratorService
					.softDeleteAllAssignments(enumerator.userId, this.surveyId)
					.subscribe({
						next: (response) => {
							this.messageService.add({
								severity: 'success',
								summary: 'Deleted',
								detail: `Enumerator removed successfully (${response.deletedCount} assignment(s) removed)`,
								life: 3000,
							});
							this.loadEnumerators();
						},
						error: (error: any) => {
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

	/**
	 * Open edit dialog
	 */
	openEditDialog(enumerator: SurveyEnumerator) {
		this.editingEnumerator = enumerator;
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		const currentDzongkhagIds = assignments
			.map((a) => a.dzongkhagId)
			.filter((id): id is number => id !== null && id !== undefined);
		
		this.editForm.patchValue({
			name: enumerator.user?.name || '',
			cid: enumerator.user?.cid || '',
			emailAddress: enumerator.user?.emailAddress || '',
			phoneNumber: enumerator.user?.phoneNumber || '',
			dzongkhagIds: currentDzongkhagIds,
		});
		this.showEditDialog = true;
	}

	/**
	 * Close edit dialog
	 */
	closeEditDialog() {
		this.showEditDialog = false;
		this.editingEnumerator = null;
		this.editForm.reset();
	}

	/**
	 * Save enumerator changes
	 */
	saveEnumerator() {
		if (this.editForm.invalid || !this.editingEnumerator) {
			this.editForm.markAllAsTouched();
			return;
		}

		this.saving = true;
		const formValue = this.editForm.value;
		const updateData: UpdateEnumeratorDto = {
			name: formValue.name,
			cid: formValue.cid,
			emailAddress: formValue.emailAddress,
			phoneNumber: formValue.phoneNumber || null,
		};

		// Include dzongkhag assignments if dzongkhagIds are provided and not empty
		// If empty, assignments won't be updated (only user details will be updated)
		if (formValue.dzongkhagIds && Array.isArray(formValue.dzongkhagIds) && formValue.dzongkhagIds.length > 0) {
			updateData.surveyId = this.surveyId;
			updateData.dzongkhagIds = formValue.dzongkhagIds;
		}

		this.surveyEnumeratorService
			.updateEnumerator(this.editingEnumerator.userId, updateData)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: updateData.dzongkhagIds 
							? `Enumerator updated successfully (${updateData.dzongkhagIds.length} dzongkhag assignment(s) updated)`
							: 'Enumerator updated successfully',
						life: 3000,
					});
					this.closeEditDialog();
					this.loadEnumerators();
					this.saving = false;
				},
				error: (error: any) => {
					console.error('Error updating enumerator:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to update enumerator',
						life: 3000,
					});
					this.saving = false;
				},
			});
	}

	/**
	 * Check if form field has error
	 */
	hasFormError(form: FormGroup, field: string): boolean {
		const control = form.get(field);
		return !!(control && control.invalid && (control.dirty || control.touched));
	}

	/**
	 * Get form field error message
	 */
	getFormError(form: FormGroup, field: string): string {
		const control = form.get(field);
		if (!control) return '';

		if (control.hasError('required')) {
			return `${this.getFieldLabel(field)} is required`;
		}
		if (control.hasError('email')) {
			return 'Please enter a valid email address';
		}
		if (control.hasError('minlength')) {
			const minLength = control.errors?.['minlength'].requiredLength;
			return `${this.getFieldLabel(field)} must be at least ${minLength} characters`;
		}
		if (control.hasError('pattern')) {
			if (field === 'phoneNumber') {
				return 'Phone number must be 8 digits starting with 1, 7, 6, 8, or 9';
			}
			if (field === 'cid') {
				return 'CID must be exactly 11 digits';
			}
			return 'Invalid format';
		}
		if (control.hasError('passwordMismatch')) {
			return 'Passwords do not match';
		}
		if (control.hasError('weakPassword')) {
			return 'Password must contain at least 3 of: uppercase, lowercase, number, special character';
		}
		return '';
	}

	/**
	 * Get password mismatch error
	 */
	getPasswordMismatchError(): string {
		if (this.resetPasswordForm.errors?.['passwordMismatch']) {
			return 'Passwords do not match';
		}
		return '';
	}

	/**
	 * Get field label
	 */
		getFieldLabel(field: string): string {
		const labels: { [key: string]: string } = {
			name: 'Name',
			cid: 'CID',
			emailAddress: 'Email Address',
			phoneNumber: 'Phone Number',
			password: 'Password',
			dzongkhagIds: 'Dzongkhags',
			newPassword: 'New Password',
			confirmPassword: 'Confirm Password',
		};
		return labels[field] || field;
	}

	/**
	 * Open reset password dialog
	 */
		openResetPasswordDialog(enumerator: SurveyEnumerator) {
		this.resettingPasswordEnumerator = enumerator;
		this.resetPasswordForm.reset();
		this.showResetPasswordDialog = true;
	}

	/**
	 * Close reset password dialog
	 */
	closeResetPasswordDialog() {
		this.showResetPasswordDialog = false;
		this.resettingPasswordEnumerator = null;
		this.resetPasswordForm.reset();
	}

	/**
	 * Get password strength indicator
	 */
	getPasswordStrength(): string {
		const password = this.resetPasswordForm.get('newPassword')?.value;
		if (!password) {
			return '';
		}

		const hasUpperCase = /[A-Z]/.test(password);
		const hasLowerCase = /[a-z]/.test(password);
		const hasNumeric = /[0-9]/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		const strength =
			(hasUpperCase ? 1 : 0) +
			(hasLowerCase ? 1 : 0) +
			(hasNumeric ? 1 : 0) +
			(hasSpecialChar ? 1 : 0);

		if (strength === 4) {
			return 'strong';
		} else if (strength === 3) {
			return 'medium';
		} else if (strength >= 1) {
			return 'weak';
		}

		return '';
	}

	/**
	 * Get password strength color
	 */
	getPasswordStrengthColor(): string {
		const strength = this.getPasswordStrength();
		switch (strength) {
			case 'strong':
				return 'text-green-600';
			case 'medium':
				return 'text-yellow-600';
			case 'weak':
				return 'text-red-600';
			default:
				return 'text-gray-600';
		}
	}

	/**
	 * Reactivate enumerator (restore all inactive assignments)
	 */
	reactivateEnumerator(enumerator: SurveyEnumerator) {
		const assignments = this.groupedEnumerators.get(enumerator.userId) || [];
		const inactiveAssignments = assignments.filter(a => a.isActive === false);
		
		if (inactiveAssignments.length === 0) {
			this.messageService.add({
				severity: 'info',
				summary: 'No Action Needed',
				detail: 'This enumerator is already active',
				life: 3000,
			});
			return;
		}

		this.confirmationService.confirm({
			message: `Are you sure you want to reactivate ${enumerator.user?.name}? This will restore all inactive assignment(s).`,
			header: 'Confirm Reactivation',
			icon: 'pi pi-check-circle',
			accept: () => {
				// Restore all assignments for user-survey combination
				this.surveyEnumeratorService
					.restoreAllAssignments(enumerator.userId, this.surveyId)
					.subscribe({
						next: (response) => {
							this.messageService.add({
								severity: 'success',
								summary: 'Reactivated',
								detail: `Enumerator reactivated successfully (${response.restoredCount} assignment(s) restored)`,
								life: 3000,
							});
							this.loadEnumerators();
						},
						error: (error: any) => {
							console.error('Error reactivating enumerator:', error);
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail: error?.error?.message || 'Failed to reactivate enumerator',
								life: 3000,
							});
						}
					});
			},
		});
	}

	/**
	 * Reset enumerator password
	 */
	resetPassword() {
		if (this.resetPasswordForm.invalid || !this.resettingPasswordEnumerator) {
			Object.keys(this.resetPasswordForm.controls).forEach((key) => {
				this.resetPasswordForm.get(key)?.markAsTouched();
			});
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Please fix all form errors before submitting',
				life: 3000,
			});
			return;
		}

		this.resettingPassword = true;
		const resetData: ResetPasswordDto = {
			newPassword: this.resetPasswordForm.value.newPassword,
		};

		this.surveyEnumeratorService
			.resetEnumeratorPassword(this.resettingPasswordEnumerator.userId, resetData)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Password reset successfully',
						life: 3000,
					});
					this.closeResetPasswordDialog();
					this.resettingPassword = false;
				},
				error: (error: any) => {
					console.error('Error resetting password:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error?.error?.message || 'Failed to reset password',
						life: 3000,
					});
					this.resettingPassword = false;
				},
			});
	}

	/**
	 * Open create dialog
	 */
	openCreateDialog() {
		this.createForm.reset();
		this.createForm.patchValue({
			dzongkhagIds: [],
		});
		this.showCreateDialog = true;
	}

	/**
	 * Close create dialog
	 */
	closeCreateDialog() {
		this.showCreateDialog = false;
		this.createForm.reset();
	}

	/**
	 * Create enumerator
	 */
	createEnumerator() {
		if (this.createForm.invalid) {
			this.createForm.markAllAsTouched();
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Please fix all form errors before submitting',
				life: 3000,
			});
			return;
		}

		this.creating = true;
		const formValue = this.createForm.value;
		const createDto: CreateSingleEnumeratorDto = {
			name: formValue.name,
			cid: formValue.cid,
			surveyId: this.surveyId,
			dzongkhagIds: formValue.dzongkhagIds,
		};

		if (formValue.emailAddress) {
			createDto.emailAddress = formValue.emailAddress;
		}
		if (formValue.phoneNumber) {
			createDto.phoneNumber = formValue.phoneNumber;
		}
		if (formValue.password) {
			createDto.password = formValue.password;
		}

		this.surveyEnumeratorService.createSingleEnumerator(createDto).subscribe({
			next: (response: CreateSingleEnumeratorResponse) => {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: response.created 
						? `Enumerator ${response.user.name} created and assigned successfully (${response.assignments.length} assignment(s))`
						: `Enumerator ${response.user.name} assigned successfully (${response.assignments.length} assignment(s))`,
					life: 5000,
				});
				this.closeCreateDialog();
				this.loadEnumerators();
				this.creating = false;
			},
			error: (error: any) => {
				console.error('Error creating enumerator:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: error?.error?.message || 'Failed to create enumerator',
					life: 3000,
				});
				this.creating = false;
			},
		});
	}
}

