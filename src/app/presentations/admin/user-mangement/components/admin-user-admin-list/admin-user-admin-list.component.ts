import {
	Component,
	Input,
	Output,
	EventEmitter,
	OnInit,
	OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AdminUserListTableComponent } from '../admin-user-list-table/admin-user-list-table.component';
import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import { MessageService } from 'primeng/api';
import { User, Supervisor, UserRole } from '../../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-admin-list',
	standalone: true,
	imports: [AdminUserListTableComponent],
	template: `
		<app-admin-user-list-table
			variant="admin"
			listTitle="Admin List"
			icon="pi-users"
			[users]="users"
			[loading]="loading"
			[searchValue]="searchValue"
			(searchValueChange)="searchValueChange.emit($event)"
			[selectedUser]="selectedUser"
			(selectedUserChange)="selectedUserChange.emit($event)"
			[showAddButton]="true"
			addButtonLabel="Add Admin"
			emptyMessage="No admins found"
			emptyButtonLabel="Create First Admin"
			[showAssignDzongkhag]="false"
			[showDeleteButton]="false"
			(add)="add.emit()"
			(viewProfile)="viewProfile.emit($event)"
			(edit)="edit.emit($event)"
			(resetPassword)="resetPassword.emit($event)"
			(deactivate)="deactivate.emit($event)"
			(activate)="activate.emit($event)"
			(downloadCsv)="onDownloadCsv()"
		></app-admin-user-list-table>
	`,
})
export class AdminUserAdminListComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	users: User[] = [];
	loading = false;

	@Input() searchValue = '';
	@Input() selectedUser: User | Supervisor | null = null;

	@Output() searchValueChange = new EventEmitter<string>();
	@Output() selectedUserChange = new EventEmitter<User | Supervisor | null>();
	@Output() loadingChange = new EventEmitter<boolean>();
	@Output() usersCountChange = new EventEmitter<number>();
	@Output() add = new EventEmitter<void>();
	@Output() viewProfile = new EventEmitter<User>();
	@Output() edit = new EventEmitter<User>();
	@Output() resetPassword = new EventEmitter<User>();
	@Output() deactivate = new EventEmitter<{ user: User; event: Event }>();
	@Output() activate = new EventEmitter<{ user: User; event: Event }>();

	constructor(
		private authService: AuthService,
		private messageService: MessageService
	) {}

	ngOnInit(): void {
		this.load();
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	/**
	 * Load admins (call on init and when parent requests refresh)
	 */
	refresh(): void {
		this.load();
	}

	private load(): void {
		this.loading = true;
		this.loadingChange.emit(true);
		this.authService
			.getAllUsers(UserRole.ADMIN)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.loading = false;
					this.loadingChange.emit(false);
				})
			)
			.subscribe({
				next: (admins) => {
					this.users = admins;
					this.usersCountChange.emit(admins.length);
				},
				error: (error) => {
					console.error('Error loading admins:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load admins',
					});
				},
			});
	}

	onDownloadCsv(): void {
		if (this.users.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No admins available to export',
				life: 3000,
			});
			return;
		}
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];
		this.users.forEach((user) => {
			const row = [
				'"Admin"',
				`"${(user.name || '').replace(/"/g, '""')}"`,
				`"${(user.cid || '').replace(/"/g, '""')}"`,
				`"${(user.emailAddress || '').replace(/"/g, '""')}"`,
				`"${(user.phoneNumber || '').replace(/"/g, '""')}"`,
			];
			csvRows.push(row.join(','));
		});
		const csvContent = csvRows.join('\n');
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		const dateStr = new Date().toISOString().split('T')[0];
		link.download = `admins_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `Admins CSV downloaded successfully (${this.users.length} admins)`,
			life: 3000,
		});
	}
}
