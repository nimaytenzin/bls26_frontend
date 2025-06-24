import { CommonModule } from '@angular/common';
import {
	Component,
	EventEmitter,
	OnInit,
	OnDestroy,
	Output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../../../core/dataservice/auth/auth.service';
import {
	AdminSignupDto,
	UserRole,
} from '../../../../../core/dataservice/auth/auth.interface';
import { PrimeNgModules } from '../../../../../primeng.modules';

@Component({
	selector: 'app-admin-create-user',
	templateUrl: './admin-create-user.component.html',
	styleUrls: ['./admin-create-user.component.css'],
	imports: [CommonModule, FormsModule, PrimeNgModules],
	providers: [MessageService],
})
export class AdminCreateUserComponent implements OnInit, OnDestroy {
	private destroy$ = new Subject<void>();

	@Output() userCreated = new EventEmitter<void>();

	userForm: AdminSignupDto = {
		firstName: '',
		lastName: '',
		email: '',
		phoneNumber: '',
		password: '',
		role: UserRole.COUNTER_STAFF,
		isVerified: true,
		hasLoginAccess: true,
	};

	loading = false;

	// Options
	userRoleOptions = [
		{ label: 'Admin', value: UserRole.ADMIN },
		{ label: 'Theatre Manager', value: UserRole.THEATRE_MANAGER },
		{ label: 'Executive Producer', value: UserRole.EXECUTIVE_PRODUCER },
		{ label: 'Counter Staff', value: UserRole.COUNTER_STAFF },
	];

	constructor(
		private authService: AuthService,
		private messageService: MessageService,
		private ref?: DynamicDialogRef,
		private config?: DynamicDialogConfig
	) {}

	ngOnInit() {
		// Component initialization
	}

	ngOnDestroy() {
		this.destroy$.next();
		this.destroy$.complete();
	}

	createUser() {
		if (!this.isValidForm()) {
			this.messageService.add({
				severity: 'error',
				summary: 'Validation Error',
				detail: 'Please fill in all required fields',
			});
			return;
		}

		this.loading = true;

		this.authService
			.adminSignup(this.userForm)
			.pipe(takeUntil(this.destroy$))
			.subscribe({
				next: (response) => {
					this.loading = false;
					this.messageService.add({
						severity: 'success',
						summary: 'Success',
						detail: 'User created successfully',
					});
					this.userCreated.emit();
					this.resetForm();
					this.onClose();
				},
				error: (error) => {
					this.loading = false;
					this.messageService.add({
						severity: 'error',
						summary: 'Error',
						detail: error.error?.message || 'Failed to create user',
					});
				},
			});
	}

	onClose() {
		if (this.ref) {
			this.ref.close();
		}
	}

	onCancel() {
		this.resetForm();
		this.onClose();
	}

	resetForm() {
		this.userForm = {
			firstName: '',
			lastName: '',
			email: '',
			phoneNumber: '',
			password: '',
			role: UserRole.COUNTER_STAFF,
			isVerified: true,
			hasLoginAccess: true,
		};
	}

	isValidForm(): boolean {
		return !!(
			this.userForm.firstName &&
			this.userForm.lastName &&
			this.userForm.email &&
			this.userForm.phoneNumber &&
			this.userForm.password &&
			this.userForm.role
		);
	}
}
