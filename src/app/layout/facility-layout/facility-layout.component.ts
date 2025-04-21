import { Component, OnInit } from '@angular/core';
import { FacilityContextService } from './facility-context.service';
import { HttpClient } from '@angular/common/http';

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

  constructor(
    private facilityContext: FacilityContextService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.detectMobile();
    this.loadFacilities();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  loadFacilities(): void {
    this.http.get<any[]>('http://localhost:3000/facilities').subscribe(data => {
      this.facilities = data;
      if (data.length > 0) {
        const firstId = data[0].id;
        this.selectedFacilityId = firstId;
        this.facilityContext.setFacility(firstId);
      }
    });
  }

  onFacilitySelect(id: string): void {
    const facilityId = +id;
    this.selectedFacilityId = facilityId;
    this.facilityContext.setFacility(facilityId);
  }

  private detectMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 768;
    });
  }
}
