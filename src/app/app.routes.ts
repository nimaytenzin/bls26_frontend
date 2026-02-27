import { Routes } from '@angular/router';
import { adminRoutes } from './presentations/admin/admin.routes';
import { authRoutes } from './presentations/auth/auth.routes';
import { enumeratorRoutes } from './presentations/enumerator/enumerator.route';

export const routes: Routes = [
	...authRoutes,
	...adminRoutes,
	...enumeratorRoutes,
];
