import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../dataservice/auth/auth.service';
import { UserRole } from '../dataservice/auth/auth.interface';

export function RoleGuard(...allowedRoles: UserRole[]): CanActivateFn {
	return () => {
		const auth = inject(AuthService);
		const router = inject(Router);

		if (!auth.isAuthenticated()) {
			router.navigate(['/auth/login']);
			return false;
		}

		const user = auth.getCurrentUser();
		if (user && allowedRoles.includes(user.role)) {
			return true;
		}

		// Redirect to appropriate dashboard based on actual role
		if (user) {
			if (user.role === UserRole.ADMIN) {
				router.navigate(['/admin']);
			} else if (user.role === UserRole.ENUMERATOR) {
				router.navigate(['/enumerator']);
			} else {
				router.navigate(['/auth/login']);
			}
		} else {
			router.navigate(['/auth/login']);
		}

		return false;
	};
}
