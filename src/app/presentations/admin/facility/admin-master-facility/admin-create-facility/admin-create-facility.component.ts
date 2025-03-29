import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { FacilityDTO } from 'src/app/core/dto/properties/building.dto';
import { FacilityDataService } from 'src/app/services/facility-data.service';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-admin-create-facility',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, InputNumberModule],
  templateUrl: './admin-create-facility.component.html',
  styleUrl: './admin-create-facility.component.scss'
})
export class AdminCreateFacilityComponent {
  facility: FacilityDTO;
  name: string;
  description: string;
  address: string;
  capacity: number;
  contact: string;
  ownerId: number;

  constructor(
    private facilityService: FacilityDataService,
    private ref: DynamicDialogRef,
  ) { }

  saveFacility(): void {
    // Populate the facility object with form input values
    this.facility = {
      name: this.name,
      description: this.description,
      address: this.address,
      ownerId: Number(localStorage.getItem('userId')),
      capacity: this.capacity,
      contact: this.contact
    };

    console.log('Facility data:', this.facility);

    if (!this.facility.name || this.facility.name.trim() === '') {
      console.error('Facility name is required');
      return;
    }

    if (!this.facility.address || this.facility.address.trim() === '') {
      console.error('Facility address is required');
      return;
    }

    const contactNumber = Number(this.facility.contact);
    if (isNaN(contactNumber) || contactNumber <= 0) {
      console.error('Facility contact must be a valid number greater than 0');
      return;
    }
    this.facility.contact = contactNumber.toString();

    const capacityNumber = Number(this.facility.capacity);
    if (isNaN(capacityNumber) || capacityNumber <= 0) {
      console.error('Facility capacity must be a valid number greater than 0');
      return;
    }
    this.facility.capacity = capacityNumber;

    this.facilityService.addFacility(this.facility).subscribe({
      next: (response) => {
        console.log('Facility saved successfully:', response);
        this.close(); // Close the modal after saving
      },
      error: (error) => {
        console.error('Error saving facility:', error);
      }
    });
  }

  close(): void {
    this.ref.close();
  }
}
