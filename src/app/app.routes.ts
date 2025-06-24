import { Routes } from '@angular/router';
import { publicRoutes } from './presentations/public/public.routes';
import { adminRoutes } from './presentations/admin/admin.routes';
import { theatreManagerRoutes } from './presentations/theatre-manager/theatre-manager.routes';
import { executiveProducerRoutes } from './presentations/executive-producer/executive-producer.routes';
import { counterStaffRoutes } from './presentations/counter-staff/counter-staff.routes';
import { authRoutes } from './presentations/auth/auth.routes';

export const routes: Routes = [
	...publicRoutes,
	...authRoutes,
	...adminRoutes,
	...theatreManagerRoutes,
	...executiveProducerRoutes,
	...counterStaffRoutes,
];
