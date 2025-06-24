import { Routes } from '@angular/router';
import { TheatreManagerDashboardComponent } from './dashboard/theatre-manager-dashboard.component';
import { LayoutComponent } from '../../layout/layout.component';

export const theatreManagerRoutes: Routes = [
	{
		path: 'theatre-manager',
		component: LayoutComponent,
		// canActivate: [AuthGuard],
		// data: { roles: ['THEATRE_MANAGER'] },
		children: [
			{
				path: '',
				component: TheatreManagerDashboardComponent,
			},
			//   {
			//     path: 'analytics',
			//     loadComponent: () => import('./analytics/theatre-manager-analytics.component').then(m => m.TheatreManagerAnalyticsComponent),
			//   },
			//   {
			//     path: 'theatres',
			//     loadComponent: () => import('./theatres/theatre-manager-theatres.component').then(m => m.TheatreManagerTheatresComponent),
			//   },
			//   {
			//     path: 'halls',
			//     loadComponent: () => import('./halls/theatre-manager-halls.component').then(m => m.TheatreManagerHallsComponent),
			//   },
			//   {
			//     path: 'screenings',
			//     loadComponent: () => import('./screenings/theatre-manager-screenings.component').then(m => m.TheatreManagerScreeningsComponent),
			//   },
			//   {
			//     path: 'bookings',
			//     loadComponent: () => import('./bookings/theatre-manager-bookings.component').then(m => m.TheatreManagerBookingsComponent),
			//   },
			//   {
			//     path: 'walk-in-sales',
			//     loadComponent: () => import('./walk-in-sales/theatre-manager-walk-in-sales.component').then(m => m.TheatreManagerWalkInSalesComponent),
			//   },
			//   {
			//     path: 'reports',
			//     loadComponent: () => import('./reports/theatre-manager-reports.component').then(m => m.TheatreManagerReportsComponent),
			//   },
			//   {
			//     path: 'counter-staff',
			//     loadComponent: () => import('./counter-staff/theatre-manager-counter-staff.component').then(m => m.TheatreManagerCounterStaffComponent),
			//   },
			//   {
			//     path: 'staff-schedules',
			//     loadComponent: () => import('./staff-schedules/theatre-manager-staff-schedules.component').then(m => m.TheatreManagerStaffSchedulesComponent),
			//   },
			//   {
			//     path: 'profile',
			//     loadComponent: () => import('./profile/theatre-manager-profile.component').then(m => m.TheatreManagerProfileComponent),
			//   },
		],
	},
];
