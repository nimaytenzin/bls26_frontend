import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'facility-layout',
  standalone: false,
  templateUrl: './facility-layout.component.html',
  styleUrls: ['../layout.component.scss']
})
export class FacilityLayoutComponent {
  isMobile = false;
  sidebarOpen = true;

  ngOnInit() {
    this.updateViewMode();
  }

  @HostListener('window:resize')
  onResize() {
    this.updateViewMode();
  }

  updateViewMode() {
    this.isMobile = window.innerWidth < 768;
    this.sidebarOpen = !this.isMobile; // Show sidebar on desktop, hide on mobile
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
}
