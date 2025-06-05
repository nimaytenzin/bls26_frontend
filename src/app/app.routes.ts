import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { publicRoutes } from './public/public.routes';

export const routes: Routes = [...publicRoutes, ...authRoutes];
