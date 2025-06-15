import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
	DynamicDialogRef,
	DynamicDialogConfig,
	DialogService,
} from 'primeng/dynamicdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { takeUntil } from 'rxjs';
import { Subject } from 'rxjs';

import { PrimeNgModules } from '../../../../../primeng.modules';
import { HallDataService } from '../../../../../core/dataservice/hall/hall.dataservice';
import { Hall } from '../../../../../core/dataservice/hall/hall.interface';
import { Theatre } from '../../../../../core/dataservice/theatre/theatre.interface';
import { AdminHallAddComponent } from '../admin-hall-add/admin-hall-add.component';
import { AdminHallEditComponent } from '../admin-hall-edit/admin-hall-edit.component';
import { AdminSeatCategoryAddComponent } from '../admin-seat-category-add/admin-seat-category-add.component';
import { SeatCategory } from '../../../../../core/dataservice/seat-category/seat-category.interface';
import { AdminSeatCategoryEditComponent } from '../admin-seat-category-edit/admin-seat-category-edit.component';

@Component({
	selector: 'app-admin-hall-list',
	templateUrl: './admin-hall-list.component.html',
	styleUrls: ['./admin-hall-list.component.css'],
	standalone: true,
	imports: [CommonModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService, DialogService],
})
export class AdminHallListComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	theatre: Theatre;
	halls: Hall[] = [];
	loading = false;
	hallDialogRef: DynamicDialogRef | undefined;

	constructor(
		private ref: DynamicDialogRef,
		private config: DynamicDialogConfig,
		private hallService: HallDataService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private dialogService: DialogService
	) {
		this.theatre = this.config.data?.theatre;
	}

	ngOnInit(): void {
		if (!this.theatre) {
			this.messageService.add({
				severity: 'error',
				summary: 'Error',
				detail: 'No theatre selected. Please try again.',
			});
			this.onClose();
			return;
		}

		this.loadHalls();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
		if (this.hallDialogRef) {
			this.hallDialogRef.close();
		}
	}

	private loadHalls(): void {
		this.loading = true;

		// Convert string ID to number if needed
		const theatreId =
			typeof this.theatre.id === 'string'
				? parseInt(this.theatre.id)
				: this.theatre.id;

		this.hallService
			.findHallsByTheatreId(theatreId)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (halls) => {
					this.halls = halls;
					this.loading = false;
				},
				error: (error) => {
					console.error('Error loading halls:', error);
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load halls. Please try again.',
					});
				},
			});
	}

	onAddHall(): void {
		this.hallDialogRef = this.dialogService.open(AdminHallAddComponent, {
			header: `Add Hall to ${this.theatre.name}`,

			closable: true,
			dismissableMask: true,
			maximizable: true,
			data: { theatre: this.theatre },
		});

		this.hallDialogRef.onClose.subscribe((result: any) => {
			if (result?.success) {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Hall added successfully!',
				});
				this.loadHalls(); // Refresh the halls list
			}
		});
	}

	onEditHall(hall: Hall): void {
		this.hallDialogRef = this.dialogService.open(AdminHallEditComponent, {
			header: `Edit Hall: ${hall.name}`,

			closable: true,
			dismissableMask: true,
			maximizable: true,
			data: { hall },
		});

		this.hallDialogRef.onClose.subscribe((result: any) => {
			if (result?.success) {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Hall updated successfully!',
				});
				this.loadHalls(); // Refresh the halls list
			}
		});
	}

	onDeleteHall(hall: Hall, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Are you sure you want to delete "${hall.name}"? This action cannot be undone.`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.loading = true;
				this.hallService
					.deleteHall(hall.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: () => {
							this.messageService.add({
								severity: 'success',
								summary: 'Success',
								detail: `Hall "${hall.name}" has been deleted successfully!`,
							});
							this.loadHalls(); // Refresh the halls list
						},
						error: (error) => {
							console.error('Error deleting hall:', error);
							this.loading = false;
							this.messageService.add({
								severity: 'error',
								summary: 'Error',
								detail:
									error.error?.message ||
									'Failed to delete hall. Please try again.',
							});
						},
					});
			},
		});
	}

	openAddSeatCategoryDialog(hall: Hall): void {
		this.hallDialogRef = this.dialogService.open(
			AdminSeatCategoryAddComponent,
			{
				header: `Add Seat Category to ${hall.name}`,
				data: { hall },
				closable: true,
				dismissableMask: true,
			}
		);

		this.hallDialogRef.onClose.subscribe((result: any) => {
			if (result?.success) {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Seat category added successfully!',
				});
				this.loadHalls(); // Refresh the halls list
			}
		});
	}

	openEditSeatCategoryDialog(seatCategory: SeatCategory): void {
		this.hallDialogRef = this.dialogService.open(
			AdminSeatCategoryEditComponent,
			{
				header: `Edit Seat Category: ${seatCategory.name}`,
				data: { seatCategory },
				closable: true,
				dismissableMask: true,
			}
		);

		this.hallDialogRef.onClose.subscribe((result: any) => {
			if (result?.success) {
				this.messageService.add({
					severity: 'success',
					summary: 'Success',
					detail: 'Seat category updated successfully!',
				});
				this.loadHalls(); // Refresh the halls list
			}
		});
	}

	deleteSeatCategory(seatCategory: SeatCategory, event: Event): void {
		this.confirmationService.confirm({
			target: event.target as EventTarget,
			message: `Are you sure you want to delete the seat category "${seatCategory.name}"? This action cannot be undone.`,
			header: 'Confirm Delete',
			icon: 'pi pi-exclamation-triangle',
			acceptIcon: 'none',
			rejectIcon: 'none',
			rejectButtonStyleClass: 'p-button-text',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				// For now, we'll implement a delete method in the seat category service
				// this.seatCategoryService.deleteSeatCategory(seatCategory.id)
				// 	.pipe(takeUntil(this.destroy$))
				// 	.subscribe({
				// 		next: () => {
				// 			this.messageService.add({
				// 				severity: 'success',
				// 				summary: 'Success',
				// 				detail: `Seat category "${seatCategory.name}" has been deleted successfully!`,
				// 			});
				// 			this.loadHalls(); // Refresh the halls list
				// 		},
				// 		error: (error) => {
				// 			console.error('Error deleting seat category:', error);
				// 			this.messageService.add({
				// 				severity: 'error',
				// 				summary: 'Error',
				// 				detail:
				// 					error.error?.message ||
				// 					'Failed to delete seat category. Please try again.',
				// 			});
				// 		},
				// 	});

				// Temporary implementation - show message
				this.messageService.add({
					severity: 'info',
					summary: 'Info',
					detail:
						'Delete functionality will be implemented when the backend API is available.',
				});
			},
		});
	}

	getHallStatusSeverity(capacity: number): string {
		if (capacity > 300) return 'success';
		if (capacity > 150) return 'info';
		if (capacity > 50) return 'warning';
		return 'secondary';
	}

	getTotalCapacity(): number {
		return this.halls.reduce((total, hall) => total + hall.capacity, 0);
	}

	onClose(): void {
		this.ref.close();
	}

	// Helper methods for template
	Array = Array;
	Math = Math;
	String = String;

	trackByHallId(index: number, hall: Hall): number {
		return hall.id;
	}

	getSeatClass(rowIndex: number, colIndex: number, hall: Hall): string {
		return 'bg-gray-400 dark:bg-gray-500 cursor-not-allowed';
	}

	getSeatTitle(rowIndex: number, colIndex: number, hall: Hall): string {
		const rowLabel = String.fromCharCode(65 + rowIndex);
		const seatNumber = colIndex + 1;
		const column = colIndex + 1;

		if (
			column >= hall.screenStart &&
			column < hall.screenStart + hall.screenSpan
		) {
			return `${rowLabel}${seatNumber} - Behind Screen (Not Available)`;
		}

		return `${rowLabel}${seatNumber} - Available Seat`;
	}

	isInScreenArea(index: number, hall: Hall): boolean {
		const columns = Math.min(hall.columns, 10); // Limit for preview
		const column = (index % columns) + 1;

		// Adjust screen position for preview
		const screenStart = Math.min(hall.screenStart, columns);
		const screenSpan = Math.min(hall.screenSpan, columns - screenStart + 1);

		return column >= screenStart && column < screenStart + screenSpan;
	}
}
