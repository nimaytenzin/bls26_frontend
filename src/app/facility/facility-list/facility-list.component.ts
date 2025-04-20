import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    this.http.get<any[]>('http://localhost:3000/facilities').subscribe(data => {
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
    if (this.selectedFacility) {
      // Update
      this.http.patch(`http://localhost:3000/facilities/${this.selectedFacility.id}`, facilityData).subscribe(() => {
        this.loadFacilities();
        this.showModal = false;
      });
    } else {
      // Create
      this.http.post('http://localhost:3000/facilities', facilityData).subscribe(() => {
        this.loadFacilities();
        this.showModal = false;
      });
    }
  }
}
