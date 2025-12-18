import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';
import {
	GeographicStatisticalCodeDataService,
	GeographicStatisticalCodeResponse,
	DzongkhagReportData,
} from '../../../../core/dataservice/reports/geographic-statistical-code.dataservice';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-geographic-statistical-code',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './geographic-statistical-code.component.html',
	styleUrls: ['./geographic-statistical-code.component.scss'],
	providers: [MessageService],
})
export class GeographicStatisticalCodeComponent implements OnInit, OnDestroy {
	reportData: GeographicStatisticalCodeResponse | null = null;
	loading = false;
	error: string | null = null;
	exportingPDF = false;
	exportingExcel = false;

	private subscriptions = new Subscription();

	constructor(
		private reportService: GeographicStatisticalCodeDataService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.loadReportData();
	}

	ngOnDestroy(): void {
		this.subscriptions.unsubscribe();
	}

	loadReportData(): void {
		this.loading = true;
		this.error = null;

		const sub = this.reportService.getReportData().subscribe({
			next: (data) => {
				this.reportData = data;
				this.loading = false;
			},
			error: (error) => {
				console.error('Error loading report data:', error);
				this.error =
					error?.error?.message ||
					'Failed to load report data. Please try again.';
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: this.error || undefined,
					life: 5000,
				});
			},
		});

		this.subscriptions.add(sub);
	}

	downloadPDF(): void {
		this.exportingPDF = true;

		const sub = this.reportService.downloadPDF().subscribe({
			next: (blob) => {
				this.handleFileDownload(
					blob,
					'geographic-statistical-code-report.pdf',
					'application/pdf'
				);
				this.exportingPDF = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'PDF report downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading PDF:', error);
				this.exportingPDF = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail:
						error?.error?.message ||
						'Failed to download PDF report. Please try again.',
					life: 5000,
				});
			},
		});

		this.subscriptions.add(sub);
	}

	downloadExcel(): void {
		this.exportingExcel = true;

		const sub = this.reportService.downloadExcel().subscribe({
			next: (blob) => {
				this.handleFileDownload(
					blob,
					'geographic-statistical-code-report.xlsx',
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
				);
				this.exportingExcel = false;
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Excel report downloaded successfully',
					life: 3000,
				});
			},
			error: (error) => {
				console.error('Error downloading Excel:', error);
				this.exportingExcel = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail:
						error?.error?.message ||
						'Failed to download Excel report. Please try again.',
					life: 5000,
				});
			},
		});

		this.subscriptions.add(sub);
	}

	private handleFileDownload(blob: Blob, filename: string, contentType: string): void {
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.URL.revokeObjectURL(url);
	}

	retry(): void {
		this.loadReportData();
	}
}

