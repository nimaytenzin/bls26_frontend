import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PrimeNgModules } from '../../../primeng.modules';
import { DzongkhagService } from '../../../core/dataservice/dzongkhag/dzongkhag.service';
import { EnumerationAreaService } from '../../../core/dataservice/enumeration-area/enumeration-area.service';
import type { Dzongkhag } from '../../../core/dataservice/dzongkhag/dzongkhag.service';
import type { EnumerationArea } from '../../../core/dataservice/enumeration-area/enumeration-area.service';

@Component({
	selector: 'app-enumerator-dashboard',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './enumerator-dashboard.component.html',
	styleUrls: ['./enumerator-dashboard.component.scss'],
})
export class EnumeratorDashboardComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	dzongkhags: Dzongkhag[] = [];
	enumerationAreas: EnumerationArea[] = [];
	selectedDzongkhagId: number | null = null;
	selectedEaId: number | null = null;
	loadingDzongkhags = false;
	loadingEas = false;

	constructor(
		private dzongkhagService: DzongkhagService,
		private eaService: EnumerationAreaService,
		private router: Router
	) {}

	ngOnInit(): void {
		this.loadDzongkhags();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadDzongkhags(): void {
		this.loadingDzongkhags = true;
		this.dzongkhagService
			.getAll()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loadingDzongkhags = false))
			)
			.subscribe({
				next: (list) => (this.dzongkhags = list),
				error: () => (this.dzongkhags = []),
			});
	}

	onDzongkhagChange(): void {
		this.selectedEaId = null;
		this.enumerationAreas = [];
		if (this.selectedDzongkhagId != null) {
			this.loadingEas = true;
			this.eaService
				.getAll({ dzongkhagId: this.selectedDzongkhagId })
				.pipe(
					takeUntil(this.destroy$),
					finalize(() => (this.loadingEas = false))
				)
				.subscribe({
					next: (list) => (this.enumerationAreas = list),
					error: () => (this.enumerationAreas = []),
				});
		}
	}

	openMap(): void {
		if (!this.selectedEaId) return;
		this.router.navigate(['/enumerator/ea', this.selectedEaId, 'map']);
	}

	canOpenMap(): boolean {
		return this.selectedEaId != null;
	}
}
