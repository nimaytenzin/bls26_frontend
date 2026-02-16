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
import { User, Supervisor } from '../../../../../core/dataservice/auth/auth.interface';

@Component({
	selector: 'app-admin-user-supervisor-list',
	standalone: true,
	imports: [AdminUserListTableComponent],
	template: `
		<app-admin-user-list-table
			variant="supervisor"
			listTitle="Supervisor List"
			icon="pi-user-edit"
			[users]="users"
			[loading]="loading"
			[searchValue]="searchValue"
			(searchValueChange)="searchValueChange.emit($event)"
			[selectedUser]="selectedUser"
			(selectedUserChange)="selectedUserChange.emit($event)"
			[showAddButton]="true"
			addButtonLabel="Add Supervisor"
			emptyMessage="No supervisors found"
			emptyButtonLabel="Create First Supervisor"
			[showAssignDzongkhag]="true"
			[showDeleteButton]="true"
			(add)="add.emit()"
			(viewProfile)="viewProfile.emit($event)"
			(edit)="edit.emit($event)"
			(resetPassword)="resetPassword.emit($event)"
			(deactivate)="deactivate.emit($event)"
			(activate)="activate.emit($event)"
			(assignDzongkhag)="assignDzongkhag.emit($event)"
			(deleteUser)="deleteUser.emit($event)"
			(downloadCsv)="onDownloadCsv()"
		></app-admin-user-list-table>
	`,
})
export class AdminUserSupervisorListComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	users: Supervisor[] = [];
	loading = false;

	@Input() searchValue = '';
	@Input() selectedUser: User | Supervisor | null = null;

	@Output() searchValueChange = new EventEmitter<string>();
	@Output() selectedUserChange = new EventEmitter<User | Supervisor | null>();
	@Output() loadingChange = new EventEmitter<boolean>();
	@Output() usersCountChange = new EventEmitter<number>();
	@Output() add = new EventEmitter<void>();
	@Output() viewProfile = new EventEmitter<Supervisor>();
	@Output() edit = new EventEmitter<Supervisor>();
	@Output() resetPassword = new EventEmitter<Supervisor>();
	@Output() deactivate = new EventEmitter<{ user: Supervisor; event: Event }>();
	@Output() activate = new EventEmitter<{ user: Supervisor; event: Event }>();
	@Output() assignDzongkhag = new EventEmitter<Supervisor>();
	@Output() deleteUser = new EventEmitter<{ user: Supervisor; event: Event }>();

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
			.getAllSupervisorsWithDzongkhags()
			.pipe(
				takeUntil(this.destroy$),
				finalize(() => {
					this.loading = false;
					this.loadingChange.emit(false);
				})
			)
			.subscribe({
				next: (supervisors) => {
					this.users = supervisors;
					this.usersCountChange.emit(supervisors.length);
				},
				error: (error) => {
					console.error('Error loading supervisors:', error);
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: 'Failed to load supervisors',
					});
				},
			});
	}

	onDownloadCsv(): void {
		if (this.users.length === 0) {
			this.messageService.add({
				severity: 'warn',
				summary: 'No Data',
				detail: 'No supervisors available to export',
				life: 3000,
			});
			return;
		}
		const headers = ['Role', 'Name', 'CID', 'Email', 'Phone Number'];
		const csvRows = [headers.join(',')];
		this.users.forEach((user) => {
			const row = [
				'"Supervisor"',
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
		link.download = `supervisors_export_${dateStr}.csv`;
		link.click();
		window.URL.revokeObjectURL(url);
		this.messageService.add({
			severity: 'success',
			summary: 'Download Complete',
			detail: `Supervisors CSV downloaded successfully (${this.users.length} supervisors)`,
			life: 3000,
		});
	}
}
