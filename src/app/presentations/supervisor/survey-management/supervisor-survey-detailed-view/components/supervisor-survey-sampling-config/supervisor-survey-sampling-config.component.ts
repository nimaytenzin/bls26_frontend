import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PrimeNgModules } from '../../../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import { SamplingDataService } from '../../../../../../core/dataservice/sampling/sampling.dataservice';
import {
	SurveySamplingConfigDto,
	UpdateSurveySamplingConfigDto,
} from '../../../../../../core/dataservice/sampling/sampling.dto';

@Component({
	selector: 'app-supervisor-survey-sampling-config',
	standalone: true,
	imports: [CommonModule, FormsModule, ReactiveFormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './supervisor-survey-sampling-config.component.html',
	styleUrls: ['./supervisor-survey-sampling-config.component.scss'],
})
export class SupervisorSurveySamplingConfigComponent implements OnInit, OnChanges {
	@Input() surveyId!: number;

	configForm: FormGroup;
	configDialogVisible = false;
	configLoading = false;
	configSaving = false;
	samplingConfig: SurveySamplingConfigDto | null = null;

	constructor(
		private fb: FormBuilder,
		private samplingService: SamplingDataService,
		private messageService: MessageService
	) {
		// Initialize config form
		this.configForm = this.fb.group({
			defaultMethod: ['CSS', Validators.required],
			defaultSampleSize: [12, [Validators.min(1)]],
			urbanSampleSize: [12, [Validators.min(1)]],
			ruralSampleSize: [16, [Validators.min(1)]],
		});
	}

	ngOnInit(): void {
		if (this.surveyId) {
			this.loadSurveyConfig();
		}
	}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['surveyId'] && !changes['surveyId'].firstChange) {
			if (this.surveyId) {
				this.loadSurveyConfig();
			}
		}
	}

	/**
	 * Load survey sampling configuration
	 */
	loadSurveyConfig(): void {
		if (!this.surveyId) {
			this.configLoading = false;
			this.samplingConfig = null;
			return;
		}

		this.configLoading = true;
		this.samplingService.getSurveyConfig(this.surveyId).subscribe({
			next: (config) => {
				if (config) {
					this.samplingConfig = config;
					this.configForm.patchValue({
						defaultMethod: config.defaultMethod,
						defaultSampleSize: config.defaultSampleSize ?? 12,
						urbanSampleSize: config.urbanSampleSize ?? config.defaultSampleSize ?? 12,
						ruralSampleSize: config.ruralSampleSize ?? config.defaultSampleSize ?? 16,
					}, { emitEvent: false });
					this.configForm.markAsPristine();
				} else {
					this.samplingConfig = null;
					this.configForm.reset({
						defaultMethod: 'CSS',
						defaultSampleSize: 12,
						urbanSampleSize: 12,
						ruralSampleSize: 16,
					}, { emitEvent: false });
					this.configForm.markAsPristine();
				}
				this.configLoading = false;
			},
			error: (error) => {
				this.configLoading = false;
				if (error?.status === 404) {
					// No config exists - this is normal, use defaults
					this.samplingConfig = null;
					this.configForm.reset({
						defaultMethod: 'CSS',
						defaultSampleSize: 12,
						urbanSampleSize: 12,
						ruralSampleSize: 16,
					}, { emitEvent: false });
					this.configForm.markAsPristine();
					return;
				}
				console.error('Error loading sampling config:', error);
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load sampling configuration',
				});
			},
		});
	}

	/**
	 * Open config dialog
	 */
	openConfigDialog(): void {
		if (this.surveyId && !this.configLoading) {
			// Load config if not already loaded or if we need to refresh
			if (!this.samplingConfig) {
				this.loadSurveyConfig();
			}
		}
		this.configDialogVisible = true;
	}

	/**
	 * Save survey sampling configuration
	 */
	saveSurveyConfig(): void {
		if (!this.surveyId) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'Survey ID is required',
			});
			return;
		}

		if (this.configForm.invalid) {
			this.configForm.markAllAsTouched();
			this.messageService.add({
				severity: 'warn',
				summary: 'Validation Error',
				detail: 'Please fix the form errors before saving',
			});
			return;
		}

		// Allow saving if form is dirty OR if no config exists (creating new config)
		if (!this.configForm.dirty && this.samplingConfig) {
			this.messageService.add({
				severity: 'info',
				summary: 'No Changes',
				detail: 'No changes were made to the configuration',
			});
			return;
		}

		const payload: UpdateSurveySamplingConfigDto = {
			defaultMethod: this.configForm.value.defaultMethod,
			defaultSampleSize: this.configForm.value.defaultSampleSize,
			urbanSampleSize: this.configForm.value.urbanSampleSize,
			ruralSampleSize: this.configForm.value.ruralSampleSize,
		};

		this.configSaving = true;
		this.samplingService.saveSurveyConfig(this.surveyId, payload).subscribe({
			next: (config) => {
				this.samplingConfig = config;
				this.configForm.markAsPristine();
				this.configDialogVisible = false;
				this.configSaving = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Sampling configuration saved successfully',
					life: 3000,
				});
			},
			error: (error) => {
				this.configSaving = false;
				console.error('Error saving sampling config:', error);
				const errorMessage = error?.error?.message 
					|| error?.error?.error 
					|| error?.message 
					|| 'Failed to save sampling configuration. Please try again.';
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: errorMessage,
					life: 5000,
				});
			},
		});
	}
}

