import { Routes } from '@angular/router';
import { CounterStaffDashboardComponent } from './dashboard/counter-staff-dashboard.component';
import { LayoutComponent } from '../../layout/layout.component';
import { AuthGuard } from '../../core/guards/auth.guard';
import { CounterStaffSellTicketsComponent } from './ticket-operations/counter-staff-sell-tickets/counter-staff-sell-tickets.component';
import { CounterStaffCheckBookingsComponent } from './ticket-operations/counter-staff-check-bookings/counter-staff-check-bookings.component';
import { CounterStaffScanTicketComponent } from './ticket-operations/counter-staff-scan-ticket/counter-staff-scan-ticket.component';

export const counterStaffRoutes: Routes = [
	{
		path: 'counter-staff',
		component: LayoutComponent,
		// canActivate: [AuthGuard],
		// data: { roles: ['COUNTER_STAFF'] },
		children: [
			// {
			// 	path: '',
			// 	component: CounterStaffDashboardComponent,
			// },
			{
				path: '',

				redirectTo: 'sell-tickets',
				pathMatch: 'full',
			},
			{
				path: 'sell-tickets',
				loadComponent: () => CounterStaffSellTicketsComponent,
			},
			{
				path: 'check-bookings',
				loadComponent: () => CounterStaffCheckBookingsComponent,
			},
			{
				path: 'scan-ticket',
				loadComponent: () => CounterStaffScanTicketComponent,
			},

			//   {
			//     path: 'check-bookings',
			//     loadComponent: () => import('./check-bookings/counter-staff-check-bookings.component').then(m => m.CounterStaffCheckBookingsComponent),
			//   },
			//   {
			//     path: 'print-tickets',
			//     loadComponent: () => import('./print-tickets/counter-staff-print-tickets.component').then(m => m.CounterStaffPrintTicketsComponent),
			//   },
			//   {
			//     path: 'refunds',
			//     loadComponent: () => import('./refunds/counter-staff-refunds.component').then(m => m.CounterStaffRefundsComponent),
			//   },
			//   {
			//     path: 'support',
			//     loadComponent: () => import('./support/counter-staff-support.component').then(m => m.CounterStaffSupportComponent),
			//   },
			//   {
			//     path: 'current-shows',
			//     loadComponent: () => import('./current-shows/counter-staff-current-shows.component').then(m => m.CounterStaffCurrentShowsComponent),
			//   },
			//   {
			//     path: 'cash-register',
			//     loadComponent: () => import('./cash-register/counter-staff-cash-register.component').then(m => m.CounterStaffCashRegisterComponent),
			//   },
			//   {
			//     path: 'profile',
			//     loadComponent: () => import('./profile/counter-staff-profile.component').then(m => m.CounterStaffProfileComponent),
			//   },
		],
	},
];
