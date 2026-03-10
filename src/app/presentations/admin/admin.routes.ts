import { Routes } from '@angular/router';
import { LayoutComponent } from '../../layout/layout.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/dataservice/auth/auth.interface';
import { AdminUserManagementComponent } from './user-mangement/admin-user-management/admin-user-management.component';
import { AdminMasterDzongkhagsComponent } from './admin-master-dzongkhags/admin-master-dzongkhags.component';
import { AdminEnumerationAreaDataViewerComponent } from './admin-enumeration-area-data-viewer/admin-enumeration-area-data-viewer.component';
import { EnumeratorHouseholdFormComponent } from '../enumerator/enumerator-household-form/enumerator-household-form.component';

export const adminRoutes: Routes = [

	{
		path: 'admin',
		component: LayoutComponent,
		canActivate: [AuthGuard, RoleGuard(UserRole.ADMIN)],
		canActivateChild: [AuthGuard, RoleGuard(UserRole.ADMIN)],
		children: [
			{ path: '', component: AdminMasterDzongkhagsComponent },
 			{ path: 'user-management', component: AdminUserManagementComponent },
			{
				path: 'data-view',
				children: [
					{ path: 'eazone/:id', component: AdminEnumerationAreaDataViewerComponent },
					{ path: 'eazone/:eaId/household/:householdId', component: EnumeratorHouseholdFormComponent },
				],
			},
			 
		],
	},
];
