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
			{
				path: '',
				component: ExecutiveProducerDashboardComponent,
			},
			//   {
			//     path: 'movie-performance',
			//     loadComponent: () => import('./movie-performance/executive-producer-movie-performance.component').then(m => m.ExecutiveProducerMoviePerformanceComponent),
			//   },
			//   {
			//     path: 'movies',
			//     loadComponent: () => import('./movies/executive-producer-movies.component').then(m => m.ExecutiveProducerMoviesComponent),
			//   },
			//   {
			//     path: 'submit-movie',
			//     loadComponent: () => import('./submit-movie/executive-producer-submit-movie.component').then(m => m.ExecutiveProducerSubmitMovieComponent),
			//   },
			//   {
			//     path: 'distribution',
			//     loadComponent: () => import('./distribution/executive-producer-distribution.component').then(m => m.ExecutiveProducerDistributionComponent),
			//   },
			//   {
			//     path: 'revenue',
			//     loadComponent: () => import('./revenue/executive-producer-revenue.component').then(m => m.ExecutiveProducerRevenueComponent),
			//   },
			//   {
			//     path: 'royalties',
			//     loadComponent: () => import('./royalties/executive-producer-royalties.component').then(m => m.ExecutiveProducerRoyaltiesComponent),
			//   },
			//   {
			//     path: 'contracts',
			//     loadComponent: () => import('./contracts/executive-producer-contracts.component').then(m => m.ExecutiveProducerContractsComponent),
			//   },
			//   {
			//     path: 'campaigns',
			//     loadComponent: () => import('./campaigns/executive-producer-campaigns.component').then(m => m.ExecutiveProducerCampaignsComponent),
			//   },
			//   {
			//     path: 'media',
			//     loadComponent: () => import('./media/executive-producer-media.component').then(m => m.ExecutiveProducerMediaComponent),
			//   },
			//   {
			//     path: 'profile',
			//     loadComponent: () => import('./profile/executive-producer-profile.component').then(m => m.ExecutiveProducerProfileComponent),
			//   },
		],
	},
];
