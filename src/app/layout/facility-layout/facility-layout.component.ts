import { Component, OnInit } from '@angular/core';
import { FacilityService } from '../../core/services/facility.service';
import { HttpClient } from '@angular/common/http';
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
  selectedFacilityId: number | null = null;
  dropdownOpen = false;

  user = {
    name: '',
    avatarUrl: '/images/default-avatar.jpg'
  };

  constructor(
    private facilityContext: FacilityService,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.detectMobile();
    this.loadFacilities();
    this.setUserInfo();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

	get hasMultipleFacilities(): boolean {
		return this.facilities.length > 1;
	}

	loadFacilities(): void {
		const currentUser = this.authService.getCurrentUser();
		if (!currentUser) return;

		this.http.get<any[]>(`http://localhost:3000/facilities?ownerId=${currentUser.id}`).subscribe(data => {
			this.facilities = data;

			if (data.length > 0) {
				const firstId = data[0].id;
				this.selectedFacilityId = firstId;
				this.facilityContext.setFacility(firstId);
			} else {
				// Redirect to Add Facility screen if no facilities found
				this.router.navigate(['/facilities/new']);
			}
		});
  }

  onFacilitySelect(id: string): void {
    const facilityId = +id;
    this.selectedFacilityId = facilityId;
    this.facilityContext.setFacility(facilityId);
  }

  detectMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private setUserInfo(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user.name = currentUser.name;
    }
  }
}
