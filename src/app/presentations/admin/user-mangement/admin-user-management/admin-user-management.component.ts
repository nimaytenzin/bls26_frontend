import {
	Component,
	OnInit,
	OnDestroy,
	ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MessageService, ConfirmationService } from 'primeng/api';
import { PrimeNgModules } from '../../../../primeng.modules';
import { AuthService } from '../../../../core/dataservice/auth/auth.service';
import type { User } from '../../../../core/dataservice/auth/auth.interface';
import { UserRole } from '../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-management',
	templateUrl: './admin-user-management.component.html',
	styleUrls: ['./admin-user-management.component.css'],
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService, ConfirmationService],
})
export class AdminUserManagementComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	admins: User[] = [];
	enumerators: User[] = [];
	loadingAdmins = false;
	loadingEnumerators = false;
	activeTabIndex = 0;

	showCreateDialog = false;
	showEditDialog = false;
	showResetPasswordDialog = false;
	createRole: UserRole = UserRole.ENUMERATOR;
	formCreate = {
		name: '',
		cid: '',
		phoneNumber: '' as string | undefined,
		password: '',
	};
	formEdit = {
		name: '',
		phoneNumber: '' as string | undefined,
	};
	formResetPassword = {
		newPassword: '',
	};
	selectedUser: User | null = null;
	submitting = false;

	showBulkDialog = false;
	bulkCsvText = '';
	bulkUploadFile: File | null = null;
	bulkSubmitting = false;
	bulkResult: { created: number; failed: number; errors: Array<{ row?: number; message: string }> } | null = null;

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private confirmationService: ConfirmationService,
		private cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.loadAdmins();
		this.loadEnumerators();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	loadAdmins(): void {
		this.loadingAdmins = true;
		this.authService
			.getAdmins()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.loadingAdmins = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: (list) => (this.admins = list),
				error: () => {
					this.admins = [];
					this.messageService.add({
						severity: 'error',
						summary: 'Failed to load admins',
						life: 3000,
					});
				},
			});
	}

	loadEnumerators(): void {
		this.loadingEnumerators = true;
		this.authService
			.getEnumerators()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.loadingEnumerators = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: (list) => (this.enumerators = list),
				error: () => {
					this.enumerators = [];
					this.messageService.add({
						severity: 'error',
						summary: 'Failed to load enumerators',
						life: 3000,
					});
				},
			});
	}

	openCreate(role: UserRole): void {
		this.createRole = role;
		this.formCreate = { name: '', cid: '', phoneNumber: '', password: '' };
		this.showCreateDialog = true;
	}

	closeCreate(): void {
		this.showCreateDialog = false;
	}

	submitCreate(): void {
		const { name, cid, phoneNumber, password } = this.formCreate;
		if (!name?.trim() || !cid?.trim() || !password?.trim()) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Name, CID and password are required',
				life: 3000,
			});
			return;
		}
		if (password.length < 6) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Password must be at least 6 characters',
				life: 3000,
			});
			return;
		}
		this.submitting = true;
		const dto = {
			name: name.trim(),
			cid: cid.trim(),
			phoneNumber: phoneNumber?.trim() || undefined,
			password,
			role: this.createRole,
		};
		const req =
			this.createRole === UserRole.ADMIN
				? this.authService.createAdmin(dto)
				: this.authService.createEnumerator(dto);
		req
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.submitting = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'User created',
						life: 3000,
					});
					this.closeCreate();
					if (this.createRole === UserRole.ADMIN) this.loadAdmins();
					else this.loadEnumerators();
				},
				error: (err) =>
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Create failed',
						life: 5000,
					}),
			});
	}

	openEdit(user: User): void {
		this.selectedUser = user;
		this.formEdit = {
			name: user.name,
			phoneNumber: user.phoneNumber ?? '',
		};
		this.showEditDialog = true;
	}

	closeEdit(): void {
		this.showEditDialog = false;
		this.selectedUser = null;
	}

	submitEdit(): void {
		if (!this.selectedUser) return;
		const { name, phoneNumber } = this.formEdit;
		this.submitting = true;
		this.authService
			.updateUser(this.selectedUser.id, {
				name: name?.trim(),
				phoneNumber: phoneNumber?.trim() || undefined,
			})
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.submitting = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: (updated) => {
					this.messageService.add({
						severity: 'success',
						summary: 'User updated',
						life: 3000,
					});
					this.closeEdit();
					if (this.selectedUser?.role === UserRole.ADMIN) {
						this.admins = this.admins.map((u) =>
							u.id === updated.id ? updated : u
						);
					} else {
						this.enumerators = this.enumerators.map((u) =>
							u.id === updated.id ? updated : u
						);
					}
					this.selectedUser = null;
				},
				error: (err) =>
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Update failed',
						life: 5000,
					}),
			});
	}

	openResetPassword(user: User): void {
		this.selectedUser = user;
		this.formResetPassword = { newPassword: '' };
		this.showResetPasswordDialog = true;
	}

	closeResetPassword(): void {
		this.showResetPasswordDialog = false;
		this.selectedUser = null;
	}

	submitResetPassword(): void {
		if (!this.selectedUser) return;
		const pwd = this.formResetPassword.newPassword?.trim();
		if (!pwd || pwd.length < 6) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Password must be at least 6 characters',
				life: 3000,
			});
			return;
		}
		this.submitting = true;
		this.authService
			.adminResetPassword(this.selectedUser.id, { newPassword: pwd })
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.submitting = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: () => {
					this.messageService.add({
						severity: 'success',
						summary: 'Password reset',
						life: 3000,
					});
					this.closeResetPassword();
				},
				error: (err) =>
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Reset failed',
						life: 5000,
					}),
			});
	}

	toggleActive(user: User): void {
		const action = user.isActive ? 'Deactivate' : 'Activate';
		this.confirmationService.confirm({
			message: `${action} user "${user.name}"?`,
			header: 'Confirm',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: user.isActive ? 'p-button-warn' : 'p-button-success',
			accept: () => {
				const req = user.isActive
					? this.authService.deactivateUser(user.id)
					: this.authService.activateUser(user.id);
				req.pipe(takeUntil(this.destroy$)).subscribe({
					next: (res) => {
						const u = res.user;
						if (user.role === UserRole.ADMIN) {
							this.admins = this.admins.map((x) =>
								x.id === u.id ? u : x
							);
						} else {
							this.enumerators = this.enumerators.map((x) =>
								x.id === u.id ? u : x
							);
						}
						this.messageService.add({
							severity: 'success',
							summary: `${action}d`,
							life: 3000,
						});
						this.cdr.markForCheck();
					},
					error: (err) =>
						this.messageService.add({
							severity: 'error',
							summary: err.error?.message || 'Failed',
							life: 5000,
						}),
				});
			},
		});
	}

	deleteUser(user: User): void {
		this.confirmationService.confirm({
			message: `Delete user "${user.name}" (${user.cid})? This cannot be undone.`,
			header: 'Delete user',
			icon: 'pi pi-exclamation-triangle',
			acceptButtonStyleClass: 'p-button-danger',
			accept: () => {
				this.authService
					.deleteUser(user.id)
					.pipe(takeUntil(this.destroy$))
					.subscribe({
						next: () => {
							if (user.role === UserRole.ADMIN) {
								this.admins = this.admins.filter((u) => u.id !== user.id);
							} else {
								this.enumerators = this.enumerators.filter(
									(u) => u.id !== user.id
								);
							}
							this.messageService.add({
								severity: 'success',
								summary: 'User deleted',
								life: 3000,
							});
							this.cdr.markForCheck();
						},
						error: (err) =>
							this.messageService.add({
								severity: 'error',
								summary: err.error?.message || 'Delete failed',
								life: 5000,
							}),
					});
			},
		});
	}

	openBulkCreate(): void {
		this.bulkCsvText = '';
		this.bulkResult = null;
		this.bulkUploadFile = null;
		this.showBulkDialog = true;
	}

	/** Download CSV template with headers: name,cid,phoneNumber,password */
	downloadBulkTemplate(): void {
		this.authService
			.getBulkEnumeratorsTemplate()
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (blob) => {
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'enumerators-bulk-template.csv';
					a.click();
					URL.revokeObjectURL(url);
					this.messageService.add({
						severity: 'success',
						summary: 'Template downloaded',
						life: 2000,
					});
				},
				error: (err) =>
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Download failed',
						life: 5000,
					}),
			});
	}

	onBulkFileSelect(event: Event): void {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (!file.name.toLowerCase().endsWith('.csv')) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Please select a CSV file',
				life: 3000,
			});
			input.value = '';
			return;
		}
		this.bulkUploadFile = file;
		this.bulkResult = null;
		this.cdr.markForCheck();
	}

	submitBulkUpload(): void {
		if (!this.bulkUploadFile) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Select a CSV file first',
				life: 3000,
			});
			return;
		}
		this.bulkSubmitting = true;
		this.bulkResult = null;
		this.authService
			.uploadBulkEnumeratorsCsv(this.bulkUploadFile)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.bulkSubmitting = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: (res) => {
					this.bulkResult = {
						created: res.created,
						failed: res.failed ?? 0,
						errors: (res.errors ?? []).map((e) => ({
							row: e.row,
							message: e.message,
						})),
					};
					this.messageService.add({
						severity: res.failed === 0 ? 'success' : 'info',
						summary: `Created ${res.created}, failed ${res.failed ?? 0}`,
						life: 5000,
					});
					if (res.created > 0) {
						this.loadEnumerators();
						this.bulkUploadFile = null;
					}
				},
				error: (err) => {
					this.bulkResult = {
						created: 0,
						failed: 1,
						errors: [{ message: err.error?.message || 'Upload failed' }],
					};
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Upload failed',
						life: 5000,
					});
				},
			});
	}

	closeBulk(): void {
		this.showBulkDialog = false;
		this.loadEnumerators();
	}

	submitBulk(): void {
		const lines = this.bulkCsvText
			.trim()
			.split(/\n/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (lines.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'Enter at least one line (name,cid,phone,password)',
				life: 3000,
			});
			return;
		}
		const enumerators: Array<{
			name: string;
			cid: string;
			phoneNumber?: string;
			password: string;
		}> = [];
		for (let i = 0; i < lines.length; i++) {
			const parts = lines[i].split(',').map((p) => p.trim());
			if (parts.length < 3) {
				this.bulkResult = {
					created: 0,
					failed: lines.length,
					errors: [{ row: i + 1, message: 'Need at least name,cid,password (or name,cid,phone,password)' }],
				};
				return;
			}
			// name, cid, password OR name, cid, phone, password
			const hasPhone = parts.length >= 4;
			enumerators.push({
				name: parts[0],
				cid: parts[1],
				phoneNumber: hasPhone ? parts[2] || undefined : undefined,
				password: hasPhone ? parts[3] : parts[2],
			});
		}
		this.bulkSubmitting = true;
		this.bulkResult = null;
		this.authService
			.bulkCreateEnumerators({ enumerators })
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.bulkSubmitting = false;
					this.cdr.markForCheck();
				})
			)
			.subscribe({
				next: (res) => {
					this.bulkResult = {
						created: res.created,
						failed: res.failed,
						errors: res.errors || [],
					};
					this.messageService.add({
						severity: res.failed === 0 ? 'success' : 'info',
						summary: `Created ${res.created}, failed ${res.failed}`,
						life: 5000,
					});
					if (res.created > 0) this.loadEnumerators();
				},
				error: (err) => {
					this.bulkResult = {
						created: 0,
						failed: enumerators.length,
						errors: [{ message: err.error?.message || 'Bulk create failed' }],
					};
					this.messageService.add({
						severity: 'error',
						summary: err.error?.message || 'Bulk create failed',
						life: 5000,
					});
				},
			});
	}

	exportEnumeratorsCsv(): void {
		const headers = ['Name', 'CID', 'Phone', 'Role', 'Active'];
		const rows = this.enumerators.map((u) =>
			[u.name, u.cid, u.phoneNumber ?? '', u.role, u.isActive ? 'Yes' : 'No']
		);
		const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `enumerators-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
		this.messageService.add({ severity: 'success', summary: 'CSV downloaded', life: 2000 });
	}

	readonly UserRole = UserRole;
}
