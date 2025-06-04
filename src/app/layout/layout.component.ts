import { Component, HostListener, OnInit } from '@angular/core';
import { FacilityService } from '../core/services/facility.service';
import { AuthService } from '../auth/auth.service';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NavbarComponent } from './navbar/navbar.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
	imports: [
		SidebarComponent,
		NavbarComponent,
		CommonModule,
		RouterModule,
	],
})
export class LayoutComponent implements OnInit {
  isMobile = false;
  sidebarOpen = false;
	dropdownOpen = false;
  facilities: { id: number; name: string; [key: string]: any }[] = [];
  selectedFacilityId: number | null = null;

  facilitiesReady = false;
  facilitiesLoading = true;
  private facilitiesChecked = false;
  private skipFirstEmptyEmit = true;

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
      this.facilities = facilities.map(f => ({ ...f, id: Number(f.id) }));

      const savedTab = localStorage.getItem('activeTab') || '';
      const currentPath = this.router.url;


      // ⏳ Wait for actual facilities (skip first empty emit)
      if (this.skipFirstEmptyEmit && facilities.length === 0) {
        console.log('⏳ Waiting for facilities to load...');
        return;
      }

      this.skipFirstEmptyEmit = false;
      this.facilitiesLoading = false; // ✅ Mark as data received

      // 🚨 No facilities even after load
      if (!this.facilitiesChecked && facilities.length === 0) {
        this.facilitiesChecked = true;
        console.log('🔁 No facilities found, redirecting to /facilities');
        this.router.navigate(['/facilities']);
        this.facilitiesReady = true;
        return;
      }

      this.facilitiesChecked = true;

      const currentId = this.facilityService.getFacilityId();
      const isValid = facilities.some(f => Number(f.id) === Number(currentId));

      if (!currentId || !isValid) {
        // Auto select first available facility
        this.facilityService.setSelectedFacilityId(facilities[0].id);

        // Handle routing only if needed
        if (
          !savedTab ||
          currentPath === '/' ||
          (savedTab === '/dashboard' && currentPath !== '/dashboard')
        ) {
          if (currentPath !== '/dashboard') {
            console.log('🔁 Redirecting to /dashboard');
            this.router.navigate(['/dashboard']);
          } else {
            console.log('✅ Already on /dashboard, no redirect needed');
          }
        } else {
          console.log('✅ Already on saved tab:', currentPath);
        }
      }

      // ✅ Facilities are ready and layout can render
      this.facilitiesReady = true;
    });

    this.facilityService.selectedFacilityId$.subscribe(id => {
      this.selectedFacilityId = typeof id === 'string' ? Number(id) : id;
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

  onFacilityChange(newFacilityId: number): void {
    this.facilityService.setSelectedFacilityId(newFacilityId);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  onSidebarClose() {
    if (this.isMobile) {
      this.toggleSidebar();
    }
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    localStorage.clear(); // Or selectively remove app keys
    sessionStorage.clear(); // Optional if you store things there
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setUserInfo(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.user.name = user.name;
    }
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  @HostListener('window:resize')
  onResize() {
    this.detectMobile();
  }
}
