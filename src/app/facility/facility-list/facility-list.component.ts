import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-facility-list',
	standalone: false,
  templateUrl: './facility-list.component.html',
  styleUrls: ['./facility-list.component.scss']
})
export class FacilityListComponent implements OnInit {
  facilities: any[] = [];
  showModal = false;
  selectedFacility: any = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.warn('No user found. Cannot load facilities.');
      return;
    }

    this.http.get<any[]>(`http://localhost:3000/facilities?ownerId=${user.id}`).subscribe({
      next: data => this.facilities = data,
      error: err => console.error('Failed to load facilities:', err)
    });
  }

  openAddFacilityDialog(): void {
    this.selectedFacility = null;
    this.showModal = true;
  }

  openEditFacilityDialog(facility: any): void {
    this.selectedFacility = facility;
    this.showModal = true;
  }

  handleSave(facilityData: any): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.warn('No user found. Cannot save facility.');
      return;
    }

    const facilityWithOwner = { ...facilityData, ownerId: user.id };

    if (this.selectedFacility) {
      this.http.patch(`http://localhost:3000/facilities/${this.selectedFacility.id}`, facilityWithOwner).subscribe({
        next: () => {
          this.loadFacilities();
          this.showModal = false;
        },
        error: err => console.error('Failed to update facility:', err)
      });
    } else {
      this.http.post('http://localhost:3000/facilities', facilityWithOwner).subscribe({
        next: () => {
          this.loadFacilities();
          this.showModal = false;
        },
        error: err => console.error('Failed to create facility:', err)
      });
    }
  }
}
