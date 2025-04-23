import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Facilitator } from '../../core/services/facilitator.service';

@Component({
  selector: 'app-facilitator-modal',
  standalone: false,
  templateUrl: './facilitator-modal.component.html',
  styleUrls: ['./facilitator-modal.component.scss'],
})
export class FacilitatorModalComponent {
  @Input() show: boolean = false; // Add the `show` property
  @Input() facilitator: Partial<Facilitator> = {}; // Ensure `facilitator` is defined
  @Output() save = new EventEmitter<Partial<Facilitator>>();
  @Output() close = new EventEmitter<void>();

  onSave(): void {
    this.save.emit(this.facilitator);
  }

  onCancel(): void {
    this.close.emit();
  }
}