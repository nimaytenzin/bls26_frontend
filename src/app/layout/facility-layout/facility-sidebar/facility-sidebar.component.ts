import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-facility-sidebar',
  standalone: false,
  templateUrl: './facility-sidebar.component.html',
  styleUrl: '../../sidebar.component.scss'
})
export class FacilitySidebarComponent {
  @Output() closeSidebar = new EventEmitter<void>();

  onNavClick() {
    this.closeSidebar.emit();
  }
}
