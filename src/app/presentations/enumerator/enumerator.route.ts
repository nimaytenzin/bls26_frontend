import { Routes } from '@angular/router';
import { UserRole } from '../../core/dataservice/auth/auth.interface';
import { AuthGuard } from '../../core/guards/auth.guard';
import { EnumeratorDashboardComponent } from './enumerator-dashboard/enumerator-dashboard.component';
import { EnumeratorLayoutComponent } from './layout/enumerator-layout.component';
import { PastSurveysComponent } from './past-surveys/past-surveys.component';
import { EnumeratorProfileComponent } from './profile/profile.component';
import { SurveyDetailComponent } from './survey-detail/survey-detail.component';
import { HouseholdListingFormComponent } from './enumerator-household-listing-form/household-listing-form.component';
import { EnumerationAreaMapViewComponent } from './enumeration-area-map-view/enumeration-area-map-view.component';
import { HouseholdListingsTableComponent } from './household-listings-table/household-listings-table.component';

export const enumeratorRoutes: Routes = [
	{
		path: 'enumerator',
		component: EnumeratorLayoutComponent,
		canActivate: [AuthGuard],
		canActivateChild: [AuthGuard],
		data: { roles: [UserRole.ENUMERATOR] },
		children: [
			{
				path: '',
				component: EnumeratorDashboardComponent,
			},
			{
				path: 'survey/:surveyId',
				component: SurveyDetailComponent,
			},
			
			{
				path: 'survey-enumeration-area/:surveyEnumerationAreaId/map',
				component: EnumerationAreaMapViewComponent,
			},
			{
				path: 'survey-enumeration-area/:surveyEnumerationAreaId/household-listings',
				component: HouseholdListingsTableComponent,
			},
			{
				path: 'household-listing-form/:surveyEnumerationAreaId',
				component: HouseholdListingFormComponent,
			},
			{
				path: 'household-listing-form/:surveyEnumerationAreaId/:householdId',
				component: HouseholdListingFormComponent,
			},
			{
				path: 'past-surveys',
				component: PastSurveysComponent,
			},
			{
				path: 'profile',
				component: EnumeratorProfileComponent,
			},
		],
	},
];
