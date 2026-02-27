import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { EnumeratorLayoutComponent } from './layout/enumerator-layout.component';
import { EnumeratorDashboardComponent } from './enumerator-dashboard/enumerator-dashboard.component';
import { EnumeratorEaMapViewComponent } from './enumerator-ea-map-view/enumerator-ea-map-view.component';
import { EnumeratorHouseholdListComponent } from './enumerator-household-list/enumerator-household-list.component';
import { EnumeratorHouseholdFormComponent } from './enumerator-household-form/enumerator-household-form.component';

export const enumeratorRoutes: Routes = [
	{
		path: 'enumerator',
		component: EnumeratorLayoutComponent,
		canActivate: [AuthGuard],
		canActivateChild: [AuthGuard],
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
