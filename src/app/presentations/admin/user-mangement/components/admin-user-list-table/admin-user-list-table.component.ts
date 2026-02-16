import { Component, Input, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../../../../primeng.modules';
import { Table } from 'primeng/table';
import { User, Supervisor } from '../../../../../core/dataservice/auth/auth.interface';

export type UserListVariant = 'admin' | 'supervisor' | 'enumerator' | 'general';

@Component({
	selector: 'app-admin-user-list-table',
	standalone: true,
	imports: [CommonModule, FormsModule, PrimeNgModules],
	templateUrl: './admin-user-list-table.component.html',
	styleUrls: ['./admin-user-list-table.component.css'],
})
export class AdminUserListTableComponent implements OnChanges {
	@ViewChild('table') table!: Table;

	@Input() variant: UserListVariant = 'admin';
	@Input() listTitle = '';
	@Input() icon = 'pi-users';
	@Input() users: (User | Supervisor)[] = [];
	@Input() loading = false;
	@Input() searchValue = '';
	@Input() selectedUser: User | Supervisor | null = null;
	@Input() showAddButton = true;
	@Input() addButtonLabel = 'Add';
	@Input() emptyMessage = 'No users found';
	@Input() emptyButtonLabel = 'Create First';
	@Input() showAssignDzongkhag = false;
	@Input() showDeleteButton = false;
	@Input() extraEmptyNote = '';

	@Output() selectedUserChange = new EventEmitter<User | Supervisor | null>();
	@Output() searchValueChange = new EventEmitter<string>();
	@Output() add = new EventEmitter<void>();
	@Output() viewProfile = new EventEmitter<User | Supervisor>();
	@Output() edit = new EventEmitter<User | Supervisor>();
	@Output() resetPassword = new EventEmitter<User | Supervisor>();
	@Output() deactivate = new EventEmitter<{ user: User | Supervisor; event: Event }>();
	@Output() activate = new EventEmitter<{ user: User | Supervisor; event: Event }>();
	@Output() assignDzongkhag = new EventEmitter<Supervisor>();
	@Output() deleteUser = new EventEmitter<{ user: User | Supervisor; event: Event }>();
	@Output() downloadCsv = new EventEmitter<void>();

	readonly globalFilterFields = ['name', 'cid', 'emailAddress', 'phoneNumber'];

	ngOnChanges(changes: SimpleChanges): void {
		if (changes['searchValue'] && this.table) {
			this.table.filterGlobal(this.searchValue, 'contains');
		}
	}

	onSelectionChange(value: User | Supervisor | null): void {
		this.selectedUser = value;
		this.selectedUserChange.emit(value);
	}

	onSearchInput(event: Event): void {
		const value = (event.target as HTMLInputElement).value;
		this.searchValueChange.emit(value);
		if (this.table) {
			this.table.filterGlobal(value, 'contains');
		}
	}

	clearSearch(): void {
		this.searchValueChange.emit('');
		if (this.table) {
			this.table.filterGlobal('', 'contains');
		}
	}

	formatDate(date: Date | string | undefined): string {
		if (!date) return 'N/A';
		const d = new Date(date);
		return d.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	}

	getAvatarInitial(name: string | undefined): string {
		if (!name) return 'U';
		return name.charAt(0).toUpperCase();
	}

	getDzongkhagNames(supervisor: Supervisor): string {
		if (!supervisor.dzongkhags || supervisor.dzongkhags.length === 0) {
			return 'None';
		}
		return supervisor.dzongkhags.map((dz) => dz.name).join(', ');
	}

	isSupervisor(user: User | Supervisor): user is Supervisor {
		return 'dzongkhags' in user && Array.isArray((user as Supervisor).dzongkhags);
	}
}
