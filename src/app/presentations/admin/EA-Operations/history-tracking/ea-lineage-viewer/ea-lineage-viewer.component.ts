import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PrimeNgModules } from '../../../../../primeng.modules';

import { EnumerationAreaDataService } from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dataservice';
import {
	EaLineageResponse,
	EaLineageNode,
	OperationType,
} from '../../../../../core/dataservice/location/enumeration-area/enumeration-area.dto';

@Component({
	selector: 'app-ea-lineage-viewer',
	templateUrl: './ea-lineage-viewer.component.html',
	styleUrls: ['./ea-lineage-viewer.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	providers: [MessageService],
})
export class EaLineageViewerComponent implements OnInit {
	eaId: number | null = null;
	lineageData: EaLineageResponse | null = null;
	loading = false;
	direction: 'ancestors' | 'descendants' | 'both' = 'both';
	
	directionOptions = [
		{ label: 'Both', value: 'both', icon: 'pi pi-sitemap' },
		{ label: 'Ancestors', value: 'ancestors', icon: 'pi pi-arrow-up' },
		{ label: 'Descendants', value: 'descendants', icon: 'pi pi-arrow-down' }
	];

	constructor(
		private route: ActivatedRoute,
		public router: Router,
		private enumerationAreaService: EnumerationAreaDataService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.route.params.subscribe((params) => {
			this.eaId = params['id'] ? +params['id'] : null;
			if (this.eaId) {
				this.loadLineage();
			}
		});

		this.route.queryParams.subscribe((queryParams) => {
			const directionParam = queryParams['direction'];
			if (
				directionParam === 'ancestors' ||
				directionParam === 'descendants' ||
				directionParam === 'both'
			) {
				this.direction = directionParam;
			}
		});
	}

	loadLineage() {
		if (!this.eaId) return;

		this.loading = true;
		this.enumerationAreaService
			.getEaLineage(this.eaId, this.direction)
			.subscribe({
				next: (data) => {
					this.lineageData = data;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading lineage:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to load EA lineage',
						life: 5000,
					});
					this.loading = false;
				},
			});
	}

	onDirectionChange() {
		this.loadLineage();
		// Update URL query params
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams: { direction: this.direction },
			queryParamsHandling: 'merge',
		});
	}

	getOperationTypeLabel(type: OperationType): string {
		return type === OperationType.SPLIT ? 'Split' : 'Merge';
	}

	getOperationTypeSeverity(type: OperationType): string {
		return type === OperationType.SPLIT ? 'info' : 'warning';
	}

	formatDate(date: Date | string): string {
		if (!date) return 'N/A';
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	}

	viewEaDetails(id: number) {
		this.router.navigate(['/admin/data-view/eazone', id]);
	}

	viewHistory(id: number) {
		this.router.navigate(['/admin/ea-operations/tracking/history', id]);
	}
}

