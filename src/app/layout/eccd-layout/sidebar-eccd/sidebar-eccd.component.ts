import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'sidebar-eccd',
  standalone: false,
  templateUrl: './sidebar-eccd.component.html',
  styleUrl: '../../sidebar.component.scss'
})
export class SidebarEccdComponent {
  @Output() closeSidebar = new EventEmitter<void>();

  onNavClick() {
    this.closeSidebar.emit();
  }
}
