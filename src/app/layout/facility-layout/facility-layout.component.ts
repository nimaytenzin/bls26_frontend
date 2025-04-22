// facility-layout.component.ts
import { Component, OnInit } from '@angular/core';
import { FacilityService } from '../../core/services/facility.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-facility-layout',
  standalone: false,
  templateUrl: './facility-layout.component.html',
  styleUrls: ['../layout.component.scss'],
})
export class FacilityLayoutComponent implements OnInit {
  isMobile = false;
  sidebarOpen = false;
  facilities: any[] = [];
  selectedFacilityId: string | null = null;
  dropdownOpen = false;

  user = {
    name: '',
    avatarUrl: '/images/default-avatar.jpg'
  };

  constructor(
    private facilityService: FacilityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.detectMobile();
    this.setUserInfo();
    this.loadFacilities();

    this.facilityService.facilities$.subscribe(facilities => {
      this.facilities = facilities;

      const currentId = this.facilityService.getFacilityId();
      const isValid = facilities.some(f => f.id === currentId);

      if (!currentId || !isValid) {
        if (facilities.length > 0) {
          this.facilityService.setFacility(facilities[0].id);
        } else {
          this.router.navigate(['/facilities']);
        }
      }
    });

    this.facilityService.selectedFacilityId$.subscribe(id => {
      this.selectedFacilityId = id;
    });
  }

  get hasMultipleFacilities(): boolean {
    return this.facilities.length > 1;
  }

  loadFacilities(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.facilityService.loadFacilitiesForOwner(user.id);
    }
  }

  onFacilitySelect(facilityId: string): void {
    this.selectedFacilityId = facilityId; // Keep it as a string
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private setUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.user.name = user.name;
    }
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }
}
