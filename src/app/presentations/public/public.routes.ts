import { Routes } from '@angular/router';
import { PublicLayoutComponentComponent } from './layout/public-layout-component/public-layout-component.component';
import { PublicRouteGuard } from '../../core/guards/auth.guard';

export const publicRoutes: Routes = [
	{
		path: '',
		component: PublicLayoutComponentComponent,
		canActivate: [PublicRouteGuard],
		canActivateChild: [PublicRouteGuard],
		children: [
			{
				path: '',
				children: [
					{
						path: '',
						loadComponent: () =>
							import(
								'./data-viewer/public-national-data-viewer/public-national-data-viewer.component'
							).then((m) => m.PublicNationalDataViewerComponent),
					},
					{
						path: 'dzongkhag/:id',
						loadComponent: () =>
							import(
								'./data-viewer/public-dzongkhag-data-viewer/public-dzongkhag-data-viewer.component'
							).then((m) => m.PublicDzongkhagDataViewerComponent),
					},
					{
						path: 'administrative-zone/:dzongkhagId/:id',
						loadComponent: () =>
							import(
								'./data-viewer/public-administrative-zone-data-viewer/public-administrative-zone-data-viewer.component'
							).then((m) => m.PublicAdministrativeZoneDataViewerComponent),
					},
					{
						path: 'sub-administrative-zone/:administrativeZoneId/:id',
						loadComponent: () =>
							import(
								'./data-viewer/public-subadministrative-zone-data-viewer/public-subadministrative-zone-data-viewer.component'
							).then((m) => m.PublicSubadministrativeZoneDataViewerComponent),
					},
				],
			},
		
			{
				path: 'geographic-statistical-code',
				loadComponent: () =>
					import(
						'./public-geographic-statistical-code/public-geographic-statistical-code.component'
					).then(
						(m) => m.PublicGeographicStatisticalCodeComponent
					),
			},

			
		],
	},
];
