import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { facilityRoutes } from './facility/facility.routes';
import { LandingComponent } from './landing/landing.component';


export const routes: Routes = [
  ...authRoutes,
	...facilityRoutes,
  { path: '**', redirectTo: '' },
	{ path: 'landing', component: LandingComponent },
];
