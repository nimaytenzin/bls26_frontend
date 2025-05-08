import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { facilityRoutes } from './facility/facility.routes';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';


export const routes: Routes = [
  { path: 'landing', component: LandingComponent },
  ...authRoutes,
	...facilityRoutes,
  //{ path: '**', redirectTo: '' },
];
