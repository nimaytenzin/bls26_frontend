import { Component, OnInit } from '@angular/core';
import { Facilitator, FacilitatorService } from '../../core/services/facilitator.service';
import { CommonModule } from '@angular/common';
import { FacilitatorModalComponent } from '../facilitator-modal/facilitator-modal.component';

@Component({
  selector: 'app-facilitator',
  standalone: true,
  templateUrl: './facilitator.component.html',
  styleUrls: ['./facilitator.component.scss'],
	imports: [
		CommonModule,
		FacilitatorModalComponent
	],
	providers: []
})
export class FacilitatorComponent implements OnInit {
  facilitators: Facilitator[] = [];
  showModal = false;
  editingFacilitator: Partial<Facilitator> = {};

  constructor(private facilitatorService: FacilitatorService) {}

  ngOnInit(): void {
    this.loadFacilitators();
  }

  loadFacilitators(): void {
    this.facilitatorService.getFacilitators().subscribe((data) => {
      this.facilitators = data.filter((f) => !f.archived); // Exclude archived facilitators
    });
  }

  openAddModal(): void {
    this.editingFacilitator = {};
    this.showModal = true;
  }

  openEditModal(facilitator: Facilitator): void {
    this.editingFacilitator = { ...facilitator };
    this.showModal = true;
  }

  handleSave(data: Partial<Facilitator>): void {
    if (this.editingFacilitator.id) {
      const updatedFacilitator: Facilitator = { ...this.editingFacilitator, ...data } as Facilitator;
      this.facilitatorService.updateFacilitator(updatedFacilitator).subscribe(() => {
        this.loadFacilitators();
        this.showModal = false;
      });
    } else {
      const newFacilitator: Facilitator = { ...data, archived: false } as Facilitator;
      this.facilitatorService.addFacilitator(newFacilitator).subscribe(() => {
        this.loadFacilitators();
        this.showModal = false;
      });
    }
  }

  archiveFacilitator(id: string): void { // Changed id to string
    this.facilitatorService.archiveFacilitator(id).subscribe(() => {
      this.loadFacilitators();
    });
  }
}
