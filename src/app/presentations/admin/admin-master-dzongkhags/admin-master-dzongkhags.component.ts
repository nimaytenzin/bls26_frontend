import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { DzongkhagService, Dzongkhag } from '../../../core/dataservice/dzongkhag/dzongkhag.service';
import { PrimeNgModules } from '../../../primeng.modules';


interface EaSummary {
	eaId: number;
	eaName: string;
	eaCode: string;
	fullEaCode?: string;
	eaStatus?: string;
	structureCount: number;
	householdCount: number;
	hasGeom: boolean;
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

interface EaRow extends EaSummary {
	dzongkhagId: number;
	dzongkhagName: string;
	dzongkhagCode: string;
	townName: string;
	townCode: string;
	lapName: string;
	lapCode: string;
}

interface GlobalStats {
	totalDzongkhags: number;
	totalTowns: number;
	totalLaps: number;
	totalEas: number;
	totalStructures: number;
	totalHouseholds: number;
}

interface SelectionStats {
	totalEas: number;
	completedEas: number;
	inProgressEas: number;
	notStartedEas: number;
	completionPercent: number;
}

type StatusFilter = 'all' | 'completed' | 'in_progress' | 'not_started';

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
	eaRows: EaRow[] = [];
	loading = false;
	selectedDzongkhagId: number | null = null;
	private readonly STORAGE_KEY_SELECTED_DZONGKHAG = 'admin-master-dzongkhag-selected-id';

	globalStats: GlobalStats = {
		totalDzongkhags: 0,
		totalTowns: 0,
		totalLaps: 0,
		totalEas: 0,
		totalStructures: 0,
		totalHouseholds: 0,
	};

	selectionStats: SelectionStats = {
		totalEas: 0,
		completedEas: 0,
		inProgressEas: 0,
		notStartedEas: 0,
		completionPercent: 0,
	};

	statusFilter: StatusFilter = 'all';
	statusFilterOptions = [
		{ label: 'All statuses', value: 'all' as StatusFilter },
		{ label: 'Completed', value: 'completed' as StatusFilter },
		{ label: 'In progress', value: 'in_progress' as StatusFilter },
		{ label: 'Not started', value: 'not_started' as StatusFilter },
	];

	constructor(private dzongkhagService: DzongkhagService) {}

	ngOnInit(): void {
		this.restoreSelectedDzongkhag();
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
					this.eaRows = this.buildEaRows(list);
					this.calculateGlobalStats(list);
					this.updateSelectionStats();
				},
				error: (err) => {
					console.error('Failed to load Dzongkhags', err);
					this.dzongkhags = [];
					this.eaRows = [];
					this.globalStats = {
						totalDzongkhags: 0,
						totalTowns: 0,
						totalLaps: 0,
						totalEas: 0,
						totalStructures: 0,
						totalHouseholds: 0,
					};
					this.selectionStats = {
						totalEas: 0,
						completedEas: 0,
						inProgressEas: 0,
						notStartedEas: 0,
						completionPercent: 0,
					};
				},
			});
	}

	onDzongkhagChange(id: number | null): void {
		this.selectedDzongkhagId = id;
		try {
			if (id == null) {
				localStorage.removeItem(this.STORAGE_KEY_SELECTED_DZONGKHAG);
			} else {
				localStorage.setItem(this.STORAGE_KEY_SELECTED_DZONGKHAG, String(id));
			}
		} catch (err) {
			console.warn('Unable to persist selected Dzongkhag', err);
		}
		this.updateSelectionStats();
	}

	private buildSummaries(list: Dzongkhag[]): DzongkhagSummary[] {
		return list.map((d) => {
			let totalStructures = 0;
			let totalHouseholds = 0;
			const eaSummaries: EaSummary[] = [];

			for (const town of d.towns ?? []) {
				for (const lap of town.laps ?? []) {
					for (const ea of lap.enumerationAreas ?? []) {
						const structures = (ea as any).structures ?? [];
						const structureCount = structures.length;
						const householdCount = structures.reduce(
							(sum: number, s: any) => sum + ((s.householdListings ?? []).length as number),
							0
						);
						totalStructures += structureCount;
						totalHouseholds += householdCount;
						eaSummaries.push({
							eaId: ea.id,
							eaName: ea.name,
							eaCode: ea.areaCode,
							fullEaCode: ea.fullEaCode,
							eaStatus: ea.status,
							structureCount,
							householdCount,
							hasGeom: !!(ea as any).geom,
						});
					}
				}
			}

			return {
				dzongkhagId: d.id,
				dzongkhagName: d.name,
				dzongkhagCode: d.areaCode,
				totalEas: eaSummaries.length,
				totalStructures,
				totalHouseholds,
				eas: eaSummaries,
			};
		});
	}

	private buildEaRows(list: Dzongkhag[]): EaRow[] {
		const rows: EaRow[] = [];
		for (const d of list) {
			for (const town of d.towns ?? []) {
				for (const lap of town.laps ?? []) {
					for (const ea of lap.enumerationAreas ?? []) {
						const structures = (ea as any).structures ?? [];
						const structureCount = structures.length;
						const householdCount = structures.reduce(
							(sum: number, s: any) => sum + ((s.householdListings ?? []).length as number),
							0
						);
						rows.push({
							dzongkhagId: d.id,
							dzongkhagName: d.name,
							dzongkhagCode: d.areaCode,
							townName: town.name,
							townCode: town.areaCode,
							lapName: lap.name,
							lapCode: lap.areaCode,
							eaId: ea.id,
							eaName: ea.name,
							eaCode: ea.areaCode,
							fullEaCode: ea.fullEaCode,
							eaStatus: ea.status,
							structureCount,
							householdCount,
							hasGeom: !!(ea as any).geom,
						});
					}
				}
			}
		}
		return rows;
	}

	private calculateGlobalStats(list: Dzongkhag[]): void {
		const townSet = new Set<number>();
		const lapSet = new Set<number>();
		let totalEas = 0;
		let totalStructures = 0;
		let totalHouseholds = 0;

		for (const d of list) {
			for (const town of d.towns ?? []) {
				townSet.add(town.id);
				for (const lap of town.laps ?? []) {
					lapSet.add(lap.id);
					for (const ea of lap.enumerationAreas ?? []) {
						totalEas++;
						const structures = (ea as any).structures ?? [];
						totalStructures += structures.length;
						totalHouseholds += structures.reduce(
							(sum: number, s: any) => sum + ((s.householdListings ?? []).length as number),
							0
						);
					}
				}
			}
		}

		this.globalStats = {
			totalDzongkhags: list.length,
			totalTowns: townSet.size,
			totalLaps: lapSet.size,
			totalEas,
			totalStructures,
			totalHouseholds,
		};
	}

	private updateSelectionStats(): void {
		const eas: EaSummary[] = [];
		if (this.selectedDzongkhagId == null) {
			for (const dz of this.dzongkhags) {
				eas.push(...dz.eas);
			}
		} else {
			const dz = this.dzongkhags.find((d) => d.dzongkhagId === this.selectedDzongkhagId);
			if (dz) {
				eas.push(...dz.eas);
			}
		}

		const totalEas = eas.length;
		let completedEas = 0;
		let inProgressEas = 0;
		let notStartedEas = 0;

		for (const ea of eas) {
			if (ea.eaStatus === 'completed') {
				completedEas++;
			} else if (ea.eaStatus === 'in_progress') {
				inProgressEas++;
			} else {
				notStartedEas++;
			}
		}

		const completionPercent = totalEas ? Math.round((completedEas / totalEas) * 100) : 0;

		this.selectionStats = {
			totalEas,
			completedEas,
			inProgressEas,
			notStartedEas,
			completionPercent,
		};
	}

	private restoreSelectedDzongkhag(): void {
		try {
			const stored = localStorage.getItem(this.STORAGE_KEY_SELECTED_DZONGKHAG);
			if (stored !== null) {
				const parsed = Number(stored);
				if (!Number.isNaN(parsed)) {
					this.selectedDzongkhagId = parsed;
				}
			}
		} catch (err) {
			console.warn('Unable to restore selected Dzongkhag from storage', err);
		}
	}

	get filteredEaRows(): EaRow[] {
		let rows = this.eaRows;

		if (this.selectedDzongkhagId != null) {
			rows = rows.filter((row) => row.dzongkhagId === this.selectedDzongkhagId);
		}

		if (this.statusFilter === 'all') {
			return rows;
		}

		return rows.filter((row) => {
			if (this.statusFilter === 'completed') {
				return row.eaStatus === 'completed';
			}
			if (this.statusFilter === 'in_progress') {
				return row.eaStatus === 'in_progress';
			}
			// not_started: anything else
			return row.eaStatus !== 'completed' && row.eaStatus !== 'in_progress';
		});
	}

	get selectionLabel(): string {
		if (this.selectedDzongkhagId == null) {
			return 'All dzongkhags';
		}
		const dz = this.dzongkhags.find((d) => d.dzongkhagId === this.selectedDzongkhagId);
		return dz ? dz.dzongkhagName : 'Selected dzongkhag';
	}

	get displayedStats(): GlobalStats {
		// No Dzongkhag filter: show global totals
		if (this.selectedDzongkhagId == null) {
			return this.globalStats;
		}

		const rows = this.eaRows.filter((row) => row.dzongkhagId === this.selectedDzongkhagId);
		if (!rows.length) {
			return {
				totalDzongkhags: 0,
				totalTowns: 0,
				totalLaps: 0,
				totalEas: 0,
				totalStructures: 0,
				totalHouseholds: 0,
			};
		}

		const townSet = new Set<string>();
		const lapSet = new Set<string>();
		let totalStructures = 0;
		let totalHouseholds = 0;

		for (const row of rows) {
			townSet.add(`${row.townCode}|${row.townName}`);
			lapSet.add(`${row.lapCode}|${row.lapName}`);
			totalStructures += row.structureCount;
			totalHouseholds += row.householdCount;
		}

		return {
			totalDzongkhags: 1,
			totalTowns: townSet.size,
			totalLaps: lapSet.size,
			totalEas: rows.length,
			totalStructures,
			totalHouseholds,
		};
	}
}
