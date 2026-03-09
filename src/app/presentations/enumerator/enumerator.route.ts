import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { RoleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../core/dataservice/auth/auth.interface';
import { EnumeratorLayoutComponent } from './layout/enumerator-layout.component';
import { EnumeratorDashboardComponent } from './enumerator-dashboard/enumerator-dashboard.component';
import { EnumeratorEaMapViewComponent } from './enumerator-ea-map-view/enumerator-ea-map-view.component';
import { EnumeratorHouseholdListComponent } from './enumerator-household-list/enumerator-household-list.component';
import { EnumeratorHouseholdFormComponent } from './enumerator-household-form/enumerator-household-form.component';

export const enumeratorRoutes: Routes = [
	{
		path: 'enumerator',
		component: EnumeratorLayoutComponent,
		canActivate: [AuthGuard, RoleGuard(UserRole.ENUMERATOR)],
		canActivateChild: [AuthGuard, RoleGuard(UserRole.ENUMERATOR)],
		children: [
			{ path: '', component: EnumeratorDashboardComponent },
			{ path: 'ea/:eaId/map', component: EnumeratorEaMapViewComponent },
			{ path: 'ea/:eaId/households', component: EnumeratorHouseholdListComponent },
			{ path: 'ea/:eaId/household/new', component: EnumeratorHouseholdFormComponent },
			{ path: 'ea/:eaId/household/new/:structureId', component: EnumeratorHouseholdFormComponent },
			{ path: 'ea/:eaId/household/:householdId', component: EnumeratorHouseholdFormComponent },
		],
	},
];
