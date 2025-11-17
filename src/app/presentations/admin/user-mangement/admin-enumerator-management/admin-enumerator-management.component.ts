import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';
import {
	User,
	UpdateUserDto,
} from '../../../../core/dataservice/auth/auth.interface';
import { PrimeNgModules } from '../../../../primeng.modules';
import { MessageService } from 'primeng/api';

@Component({
	selector: 'app-admin-enumerator-management',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
	templateUrl: './admin-enumerator-management.component.html',
	styleUrls: ['./admin-enumerator-management.component.css'],
})
export class AdminEnumeratorManagementComponent implements OnInit {
	enumerators: User[] = [];
	loading = true;
	errorMessage: string | null = null;

	// Edit dialog
	editDialogVisible = false;
	selectedEnumerator: User | null = null;
	editForm: UpdateUserDto = {
		name: '',
		emailAddress: '',
		phoneNumber: '',
	};

	constructor(
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit() {
		this.loadEnumerators();
	}

	/**
	 * Load all enumerators
	 */
	loadEnumerators(): void {
		this.loading = true;
		this.errorMessage = null;

		this.authService.getAllEnumerators().subscribe({
			next: (data: User[]) => {
				this.enumerators = data;
				this.loading = false;
			},
			error: (error: any) => {
				console.error('Error loading enumerators:', error);
				this.errorMessage = 'Failed to load enumerators';
				this.loading = false;
				this.messageService.add({
					severity: 'error',
					summary: 'Error',
					detail: 'Failed to load enumerators',
				});
			},
		});
	}

	/**
	 * Open edit dialog
	 */
	openEditDialog(enumerator: User): void {
		this.selectedEnumerator = enumerator;
		this.editForm = {
			name: enumerator.name,
			emailAddress: enumerator.emailAddress || '',
			phoneNumber: enumerator.phoneNumber || '',
		};
		this.editDialogVisible = true;
	}

	/**
	 * Close edit dialog
	 */
	closeEditDialog(): void {
		this.editDialogVisible = false;
		this.selectedEnumerator = null;
		this.editForm = {
			name: '',
			emailAddress: '',
			phoneNumber: '',
		};
	}

	/**
	 * Update enumerator
	 */
	updateEnumerator(): void {
		if (!this.selectedEnumerator) return;

		this.authService
			.updateUser(this.selectedEnumerator.id, this.editForm)
			.subscribe({
				next: (updatedUser: User) => {
					// Update in list
					const index = this.enumerators.findIndex(
						(e) => e.id === updatedUser.id
					);
					if (index !== -1) {
						this.enumerators[index] = updatedUser;
					}

					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'Enumerator updated successfully',
					});

					this.closeEditDialog();
				},
				error: (error: any) => {
					console.error('Error updating enumerator:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to update enumerator',
					});
				},
			});
	}
}
