import { Component, OnInit } from '@angular/core';
import { FacilityService } from '../../core/services/facility.service';
import { AuthService } from '../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FacilityModalComponent } from '../facility-modal/facility-modal.component';

@Component({
  selector: 'app-facility-list',
  standalone: true,
  templateUrl: './facility-list.component.html',
  styleUrls: ['./facility-list.component.scss'],
	imports: [
		CommonModule,
		FacilityModalComponent,
	],
	providers: []
})
export class FacilityListComponent implements OnInit {
  facilities: any[] = [];
  showModal = false;
  selectedFacility: any = null;

  constructor(
    private facilityService: FacilityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    const existing = this.facilityService.getFacilitiesSnapshot();
    if (existing.length === 0) {
      this.facilityService.loadFacilitiesForOwner(user.id);
    }

    this.facilityService.facilities$.subscribe(data => {
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

    const facilityWithOwner = { ...facilityData, ownerId: user.id };

    const saveObservable = this.selectedFacility
      ? this.facilityService.updateFacility(this.selectedFacility.id, facilityWithOwner)
      : this.facilityService.addFacility(facilityWithOwner);

    saveObservable.subscribe({
      next: () => {
        this.showModal = false;
        this.facilityService.loadFacilitiesForOwner(user.id); // reload and propagate
      },
      error: err => console.error('Save failed:', err)
    });
  }
}
