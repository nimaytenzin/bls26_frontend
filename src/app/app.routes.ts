import { Routes } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { publicRoutes } from './public/public.routes';
import { adminRoutes } from './admin/admin.routes';

export const routes: Routes = [...publicRoutes, ...authRoutes, ...adminRoutes];
