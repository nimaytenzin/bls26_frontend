import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrimeNgModules } from '../../primeng.modules';
import { RoleBasedMenuService } from '../../layout/service/role-based-menu.service';
import { USERROLESENUM } from '../../layout/sidebarmenu';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/dataservice/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
	selector: 'app-role-switcher',
	template: `
		<div class="role-switcher">
			<p-dropdown
				[options]="roleOptions"
				[(ngModel)]="selectedRole"
				optionLabel="label"
				optionValue="value"
				placeholder="Switch Role"
				(onChange)="onRoleChange()"
				styleClass="role-dropdown"
			>
				<ng-template pTemplate="selectedItem">
					<div class="flex items-center gap-2" *ngIf="selectedRole">
						<i [class]="getRoleIcon(selectedRole)"></i>
						<span>{{ getRoleLabel(selectedRole) }}</span>
					</div>
				</ng-template>
				<ng-template pTemplate="item" let-role>
					<div class="flex items-center gap-2">
						<i [class]="getRoleIcon(role.value)"></i>
						<span>{{ role.label }}</span>
					</div>
				</ng-template>
			</p-dropdown>
		</div>
	`,
	styles: [
		`
			.role-switcher {
				.role-dropdown {
					min-width: 180px;

					.p-dropdown-label {
						display: flex;
						align-items: center;
						gap: 0.5rem;
					}
				}
			}
		`,
	],
	standalone: true,
	imports: [CommonModule, PrimeNgModules, FormsModule],
})
export class RoleSwitcherComponent implements OnInit, OnDestroy {
	selectedRole: USERROLESENUM = USERROLESENUM.ADMIN;
	private destroy$ = new Subject<void>();
	currentUserRole: USERROLESENUM | null = null;

	roleOptions = [
		{ label: 'Admin', value: USERROLESENUM.ADMIN },
		{ label: 'Theatre Manager', value: USERROLESENUM.THEATRE_MANAGER },
		{ label: 'Executive Producer', value: USERROLESENUM.EXECUTIVE_PRODUCER },
		{ label: 'Counter Staff', value: USERROLESENUM.COUNTER_STAFF },
	];

	constructor(
		private roleBasedMenuService: RoleBasedMenuService,
		private router: Router,
		private authService: AuthService
	) {}

	ngOnInit(): void {
		// Subscribe to role changes

		// Subscribe to auth state to get user role
		this.authService.authState$
			.pipe(takeUntil(this.destroy$))
			.subscribe((authState) => {
				if (authState.isAuthenticated && authState.user) {
					// Map auth role to menu role
					this.currentUserRole = this.mapUserRoleToMenuRole(
						authState.user.role
					);
				}
			});
	}

	ngOnDestroy(): void {
		this.destroy$.next();
		this.destroy$.complete();
	}

	private mapUserRoleToMenuRole(userRole: string): USERROLESENUM {
		switch (userRole) {
			case 'ADMIN':
				return USERROLESENUM.ADMIN;
			case 'MANAGER':
				return USERROLESENUM.THEATRE_MANAGER;
			case 'USER':
				return USERROLESENUM.COUNTER_STAFF;
			case 'CUSTOMER':
				return USERROLESENUM.CUSTOMER;
			default:
				return USERROLESENUM.ADMIN;
		}
	}

	onRoleChange(): void {
		if (this.selectedRole) {
			// Update the menu
			this.roleBasedMenuService.setMenuForRole(this.selectedRole);

			// Navigate to the appropriate dashboard
			const dashboardRoute = this.roleBasedMenuService.getDashboardRoute(
				this.selectedRole
			);
			this.router.navigate([dashboardRoute]);
		}
	}

	getRoleIcon(role: USERROLESENUM): string {
		switch (role) {
			case USERROLESENUM.ADMIN:
				return 'pi pi-cog text-red-500';
			case USERROLESENUM.THEATRE_MANAGER:
				return 'pi pi-building text-purple-500';
			case USERROLESENUM.EXECUTIVE_PRODUCER:
				return 'pi pi-briefcase text-green-500';
			case USERROLESENUM.COUNTER_STAFF:
				return 'pi pi-id-card text-blue-500';
			default:
				return 'pi pi-user';
		}
	}

	getRoleLabel(role: USERROLESENUM): string {
		return (
			this.roleOptions.find((option) => option.value === role)?.label ||
			'Unknown'
		);
	}
}
