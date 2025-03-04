import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router,
} from '@angular/router';
import { AuthService } from '../dataservice/users-and-auth/auth.service';
import { MessageService } from 'primeng/api';
import { AuthenticatedUserDTO } from '../dataservice/users-and-auth/dto/auth.dto';

@Injectable({
    providedIn: 'root',
})
export class RoleGuard implements CanActivate {
    constructor(
        private authService: AuthService,
        private router: Router,
        private messageService: MessageService
    ) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        const user: AuthenticatedUserDTO =
            this.authService.GetAuthenticatedUser();

        if (user && user.role && this.hasRole(user, next.data['roles'])) {
            return true;
        } else {
            this.messageService.add({
                severity: 'warn',
                summary: 'Forbidden',
                detail: 'You don’t have enough permission to view the requested resource',
            });
            return false;
        }
    }

    private hasRole(
        user: AuthenticatedUserDTO,
        allowedRoles: string[]
    ): boolean {
        const userRolesArray = this.parseRolesString(user.role);

        return userRolesArray.some((role) => allowedRoles.includes(role));
    }

    private parseRolesString(roles: string): string[] {
        return roles
            .replace(/[\[\]']/g, '')
            .split(',')
            .map((role) => role.trim());
    }
}
