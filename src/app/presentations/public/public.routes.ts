import { Routes } from '@angular/router';
import { PublicHomeComponent } from './public-home/public-home.component';
import { PublicLayoutComponentComponent } from './layout/public-layout-component/public-layout-component.component';
import { PublicAdministrativezoneViewerComponent } from './public-administrativezone-viewer/public-administrativezone-viewer.component';
import { PublicSubadministrativezoneViewerComponent } from './public-subadministrativezone-viewer/public-subadministrativezone-viewer.component';

export const publicRoutes: Routes = [
	{
		path: '',
		component: PublicLayoutComponentComponent,
		children: [
			{ path: '', component: PublicHomeComponent },
			{
				path: 'dzongkhag-viewer/:id',
				loadComponent: () =>
					import(
						'./public-dzongkhag-viewer/public-dzongkhag-viewer.component'
					).then((m) => m.PublicDzongkhagViewerComponent),
			},
			{
				path: 'adminzone-viewer/:dzongkhagId/:id',
				component: PublicAdministrativezoneViewerComponent,
			},
			{
				path: 'subadminzone-viewer/:administrativeZoneId/:id',
				component: PublicSubadministrativezoneViewerComponent,
			},

			// Legacy routes for backward compatibility
			{
				path: 'movie/schedule/:movieId',
				redirectTo: 'select-schedule/:movieId',
			},
			{
				path: 'movie/select-seat/:movieId',
				redirectTo: 'select-seats/:movieId',
			},
		],
	},
];
