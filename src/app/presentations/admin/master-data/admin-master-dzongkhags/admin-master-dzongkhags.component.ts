import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { PrimeNgModules } from '../../../../primeng.modules';
import { DzongkhagService, Dzongkhag } from '../../../../core/dataservice/dzongkhag/dzongkhag.service';

interface EaSummary {
	eaId: number;
	eaName: string;
	eaCode: string;
	eaStatus?: string;
	structureCount: number;
	householdCount: number;
}

interface DzongkhagSummary {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
	totalEas: number;
	totalStructures: number;
	totalHouseholds: number;
	eas: EaSummary[];
}

interface DzongkhagEaRow extends EaSummary {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
}

interface GlobalStats {
	totalDzongkhags: number;
	totalEas: number;
	totalStructures: number;
	totalHouseholds: number;
}

@Component({
	selector: 'app-admin-master-dzongkhags',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule, PrimeNgModules],
	templateUrl: './admin-master-dzongkhags.component.html',
	styleUrls: ['./admin-master-dzongkhags.component.css'],
})
export class AdminMasterDzongkhagsComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	dzongkhags: DzongkhagSummary[] = [];
	eaRows: DzongkhagEaRow[] = [];
	loading = false;
	selectedDzongkhagId: number | null = null;

	globalStats: GlobalStats = {
		totalDzongkhags: 0,
		totalEas: 0,
		totalStructures: 0,
		totalHouseholds: 0,
	};

	constructor(private dzongkhagService: DzongkhagService) {}

	ngOnInit(): void {
		this.load();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	load(): void {
		this.loading = true;
		this.dzongkhagService
			.getAll()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => (this.loading = false))
			)
			.subscribe({
				next: (list) => {
					this.dzongkhags = this.buildSummaries(list);
					this.eaRows = this.buildEaRows(this.dzongkhags);
					this.calculateGlobalStats();
				},
				error: (err) => {
					console.error('Failed to load Dzongkhags', err);
					this.dzongkhags = [];
					this.eaRows = [];
					this.globalStats = {
						totalDzongkhags: 0,
						totalEas: 0,
						totalStructures: 0,
						totalHouseholds: 0,
					};
				},
			});
	}

	private buildSummaries(list: Dzongkhag[]): DzongkhagSummary[] {
		return list.map((d) => {
			const eas = (d.enumerationAreas ?? []) as any[];
			let dzongkhagStructures = 0;
			let dzongkhagHouseholds = 0;

			const eaSummaries: EaSummary[] = eas.map((ea: any) => {
				const structures = ea.structures ?? [];
				const structureCount = structures.length;
				const householdCount = structures.reduce(
					(sum: number, s: any) => sum + ((s.householdListings ?? []).length as number),
					0
				);

				dzongkhagStructures += structureCount;
				dzongkhagHouseholds += householdCount;

				return {
					eaId: ea.id,
					eaName: ea.name,
					eaCode: ea.areaCode,
					eaStatus: ea.status,
					structureCount,
					householdCount,
				};
			});

			return {
				dzongkhagId: d.id,
				dzongkhagName: d.name,
				dzongkhagCode: d.areaCode,
				totalEas: eaSummaries.length,
				totalStructures: dzongkhagStructures,
				totalHouseholds: dzongkhagHouseholds,
				eas: eaSummaries,
			};
		});
	}

	private buildEaRows(dzongkhags: DzongkhagSummary[]): DzongkhagEaRow[] {
		const rows: DzongkhagEaRow[] = [];
		dzongkhags.forEach((dz) => {
			dz.eas.forEach((ea) => {
				rows.push({
					dzongkhagId: dz.dzongkhagId,
					dzongkhagName: dz.dzongkhagName,
					dzongkhagCode: dz.dzongkhagCode,
					...ea,
				});
			});
		});
		return rows;
	}

	private calculateGlobalStats(): void {
		this.globalStats = this.dzongkhags.reduce(
			(acc, dz) => ({
				totalDzongkhags: acc.totalDzongkhags + 1,
				totalEas: acc.totalEas + dz.totalEas,
				totalStructures: acc.totalStructures + dz.totalStructures,
				totalHouseholds: acc.totalHouseholds + dz.totalHouseholds,
			}),
			{ totalDzongkhags: 0, totalEas: 0, totalStructures: 0, totalHouseholds: 0 }
		);
	}

	get filteredEaRows(): DzongkhagEaRow[] {
		if (!this.selectedDzongkhagId) return this.eaRows;
		return this.eaRows.filter((row) => row.dzongkhagId === this.selectedDzongkhagId);
	}
}