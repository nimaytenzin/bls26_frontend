import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { FacilityService } from '../core/services/facility.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private facilityService: FacilityService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Check if the user is logged in
    if (this.authService.isLoggedIn()) {
      const selectedFacilityId = this.facilityService.getFacilityId();

      // Check if a facility is selected
      if (selectedFacilityId) {
        return true; // Allow access to the route
      } else {
        // Redirect to the "Switch Facility" page if no facility is selected
        this.router.navigate(['/facilities']);
        return false;
      }
    } else {
      // Redirect to login if the user is not logged in
      this.router.navigate(['/login']);
      return false;
    }
  }
}
