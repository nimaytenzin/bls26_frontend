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
	selector: 'app-admin-user-general-list',
	standalone: true,
	imports: [AdminUserListTableComponent],
	template: `
		<app-admin-user-list-table
			variant="general"
			listTitle="General User List"
			icon="pi-user"
			[users]="users"
			[loading]="loading"
			[searchValue]="searchValue"
			(searchValueChange)="searchValueChange.emit($event)"
			[selectedUser]="selectedUser"
			(selectedUserChange)="selectedUserChange.emit($event)"
			[showAddButton]="true"
			addButtonLabel="Add General User"
			emptyMessage="No general users found"
			emptyButtonLabel="Create First General User"
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
export class AdminUserGeneralListComponent implements OnInit, OnDestroy {
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

	refresh(): void {
		this.load();
	}

	private load(): void {
		this.loading = true;
		this.loadingChange.emit(true);
		this.authService
			.getAllUsers(UserRole.GENERAL_USER)
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.loading = false;
					this.loadingChange.emit(false);
				})
			)
			.subscribe({
				next: (users) => {
					this.users = users;
					this.usersCountChange.emit(users.length);
				},
				error: (error) => {
					console.error('Error loading general users:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load general users',
					});
				},
			});
	}

	onDownloadCsv(): void {
		if (this.users.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No general users available to export',
				life: 3000,
			});
			return;
		}
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];
		this.users.forEach((user) => {
			const row = [
				'"General User"',
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
		link.download = `general_users_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `General users CSV downloaded successfully (${this.users.length} users)`,
			life: 3000,
		});
	}
}
