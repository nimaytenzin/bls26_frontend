import { Routes } from '@angular/router';
import { publicRoutes } from './presentations/public/public.routes';
import { adminRoutes } from './presentations/admin/admin.routes';
import { authRoutes } from './presentations/auth/auth.routes';
import { supervisorRoutes } from './presentations/supervisor/supervisor.routes';
import { enumeratorRoutes } from './presentations/enumerator/enumerator.route';

export const routes: Routes = [
	...publicRoutes,
	...authRoutes,
	...adminRoutes,
	...supervisorRoutes,
	...enumeratorRoutes,
];
