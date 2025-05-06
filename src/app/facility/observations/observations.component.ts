import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observation } from '../../core/models/observation.model';
import { ObservationsService } from '../../core/services/observations.service';
import { ObservationModalComponent } from '../observation-modal/observation-modal.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-observations',
  standalone: true,
  imports: [CommonModule, ObservationModalComponent],
  templateUrl: './observations.component.html',
  styleUrls: ['./observations.component.scss']
})
export class ObservationsComponent implements OnInit {
  observations: Observation[] = [];
  children: { id: string; name: string; avatarUrl: string }[] = [];
  selectedObservation: Observation | null = null;
  showModal = false;

  constructor(
    private obsService: ObservationsService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.obsService.observations$.subscribe(data => (this.observations = data));
    this.obsService.getObservations();

    this.http.get<any[]>('http://localhost:3000/children').subscribe({
      next: (res) => {
        this.children = res;
      },
      error: (err) => {
        console.error('Failed to load children:', err);
      }
    });
  }

  loadObservations(): void {
    this.obsService.observations$.subscribe(obs => (this.observations = obs));
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

  handleSave(data: Observation): void {
    const save$ = this.selectedObservation
      ? this.obsService.updateObservation(this.selectedObservation.id!, data)
      : this.obsService.addObservation(data);

    save$.subscribe(() => {
      this.showModal = false;
      this.loadObservations();
    });
  }
}
