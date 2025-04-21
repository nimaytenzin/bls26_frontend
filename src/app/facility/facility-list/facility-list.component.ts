import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service'; // Adjust path as necessary

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
    if (!user) return;

    this.http.get<any[]>(`http://localhost:3000/facilities?ownerId=${user.id}`).subscribe(data => {
      this.facilities = data;
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
    if (!user) return;

    const ownerId = user.id;

    if (this.selectedFacility) {
      this.http.patch(`http://localhost:3000/facilities/${this.selectedFacility.id}`, facilityData).subscribe(() => {
        this.loadFacilities();
        this.showModal = false;
      });
    } else {
      const facilityWithOwner = { ...facilityData, ownerId };
      this.http.post('http://localhost:3000/facilities', facilityWithOwner).subscribe(() => {
        this.loadFacilities();
        this.showModal = false;
      });
    }
  }
}