import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observation } from '../../core/models/observation.model';
import { ObservationsService } from '../../core/services/observations.service';
import { ObservationModalComponent } from '../observation-modal/observation-modal.component';

@Component({
  selector: 'app-observations',
  standalone: true,
  templateUrl: './observations.component.html',
  styleUrls: ['./observations.component.scss'],
  imports: [CommonModule, ObservationModalComponent]
})
export class ObservationsComponent implements OnInit {
  observations: Observation[] = [];
  showModal = false;
  selectedObservation: Observation | null = null;

  constructor(private obsService: ObservationsService) {}

  ngOnInit(): void {
    this.obsService.observations$.subscribe(data => (this.observations = data));
    this.obsService.getObservations();
  }

  openAddObservation(): void {
    this.selectedObservation = null;
    this.showModal = true;
  }

  openEditObservation(obs: Observation): void {
    this.selectedObservation = obs;
    this.showModal = true;
  }

  handleSave(obsData: Observation): void {
    const save$ = this.selectedObservation
      ? this.obsService.updateObservation(this.selectedObservation.id!, obsData)
      : this.obsService.addObservation(obsData);

    save$.subscribe(() => {
      this.showModal = false;
      this.obsService.getObservations();
    });
  }
}
