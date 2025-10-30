import { Routes } from '@angular/router';
import { ExecutiveProducerDashboardComponent } from './dashboard/executive-producer-dashboard.component';
import { LayoutComponent } from '../../layout/layout.component';

export const executiveProducerRoutes: Routes = [
	{
		path: 'executive-producer',
		component: LayoutComponent,
		// canActivate: [AuthGuard],
		// data: { roles: ['EXECUTIVE_PRODUCER'] },
		children: [
			// ==================== Dashboard Routes ====================
			{
				path: '',
				component: ExecutiveProducerDashboardComponent,
			},
			{
				path: 'dashboard',
				component: ExecutiveProducerDashboardComponent,
			},
			{
				path: 'dashboard/:id',
				component: ExecutiveProducerDashboardComponent,
			},

			// ==================== Movies Management Routes ====================
			{
				path: 'movies',
				loadComponent: () =>
					import('./movies/executive-producer-movies.component').then(
						(m) => m.ExecutiveProducerMoviesComponent
					),
			},

			// ==================== Revenue Routes ====================
			{
				path: 'revenue',
				loadComponent: () =>
					import('./revenue/executive-producer-revenue.component').then(
						(m) => m.ExecutiveProducerRevenueComponent
					),
			},
			{
				path: 'revenue/:id',
				loadComponent: () =>
					import('./revenue/executive-producer-revenue.component').then(
						(m) => m.ExecutiveProducerRevenueComponent
					),
			},
			{
				path: 'revenue/:id/details',
				loadComponent: () =>
					import('./revenue/executive-producer-revenue.component').then(
						(m) => m.ExecutiveProducerRevenueComponent
					),
			},

			// ==================== Booking Routes ====================
			{
				path: 'bookings',
				loadComponent: () =>
					import('./bookings/executive-producer-bookings.component').then(
						(m) => m.ExecutiveProducerBookingsComponent
					),
			},
			{
				path: 'bookings/:id',
				loadComponent: () =>
					import('./bookings/executive-producer-bookings.component').then(
						(m) => m.ExecutiveProducerBookingsComponent
					),
			},
			{
				path: 'bookings/:id/analytics',
				loadComponent: () =>
					import('./bookings/executive-producer-bookings.component').then(
						(m) => m.ExecutiveProducerBookingsComponent
					),
			},

			// ==================== Screening Routes ====================
			{
				path: 'screenings',
				loadComponent: () =>
					import('./screenings/executive-producer-screenings.component').then(
						(m) => m.ExecutiveProducerScreeningsComponent
					),
			},
			{
				path: 'screenings/:id',
				loadComponent: () =>
					import('./screenings/executive-producer-screenings.component').then(
						(m) => m.ExecutiveProducerScreeningsComponent
					),
			},
			{
				path: 'screenings/:id/performance',
				loadComponent: () =>
					import('./screenings/executive-producer-screenings.component').then(
						(m) => m.ExecutiveProducerScreeningsComponent
					),
			},

			// ==================== Placeholder Routes for Future Components ====================
			// These routes will redirect to existing components until the actual components are created

			// Analytics routes (currently redirect to revenue)
			{
				path: 'analytics',
				redirectTo: 'revenue',
			},
			{
				path: 'analytics/:id',
				redirectTo: 'revenue/:id',
			},

			// Performance routes (currently redirect to revenue)
			{
				path: 'performance',
				redirectTo: 'revenue',
			},
			{
				path: 'performance/:id',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'performance/:id/metrics',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'performance/comparison',
				redirectTo: 'revenue',
			},

			// Reports routes (currently redirect to revenue)
			{
				path: 'reports',
				redirectTo: 'revenue',
			},
			{
				path: 'reports/:id',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'reports/:id/financial',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'reports/:id/performance',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'reports/:id/audience',
				redirectTo: 'bookings/:id',
			},
			{
				path: 'reports/custom',
				redirectTo: 'revenue',
			},

			// Future feature routes (redirects to dashboard)
			{
				path: 'submit-movie',
				redirectTo: 'dashboard',
			},
			{
				path: 'distribution',
				redirectTo: 'dashboard',
			},
			{
				path: 'distribution/:id',
				redirectTo: 'movies/:id',
			},
			{
				path: 'contracts',
				redirectTo: 'dashboard',
			},
			{
				path: 'contracts/:id',
				redirectTo: 'movies/:id',
			},
			{
				path: 'royalties',
				redirectTo: 'revenue',
			},
			{
				path: 'royalties/:id',
				redirectTo: 'revenue/:id',
			},
			{
				path: 'campaigns',
				redirectTo: 'dashboard',
			},
			{
				path: 'campaigns/:id',
				redirectTo: 'movies/:id',
			},
			{
				path: 'media',
				redirectTo: 'dashboard',
			},
			{
				path: 'media/:id',
				redirectTo: 'movies/:id',
			},
			{
				path: 'profile',
				redirectTo: 'dashboard',
			},

			// ==================== Redirect Routes ====================
			{
				path: '**',
				redirectTo: '',
			},
		],
	},
];
