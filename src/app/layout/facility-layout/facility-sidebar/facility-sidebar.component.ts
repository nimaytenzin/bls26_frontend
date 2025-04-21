import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-facility-sidebar',
  standalone: false,
  templateUrl: './facility-sidebar.component.html',
  styleUrls: ['../../sidebar.component.scss']
})
export class FacilitySidebarComponent {
  @Input() facilities: any[] = []; // ✅ Add this line to fix the error
  @Input() selectedFacilityId!: number;
  @Output() closeSidebar = new EventEmitter<void>();

  onNavClick() {
    this.closeSidebar.emit();
  }
}