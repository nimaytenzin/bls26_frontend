import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-facility-navbar',
	standalone: true,
  templateUrl: './facility-navbar.component.html',
  styleUrls: ['./facility-navbar.component.scss'],
	imports: [
		CommonModule
	]
})
export class FacilityNavbarComponent {
  @Input() isMobile = false;
  @Input() hasMultipleFacilities = false;
	@Input() facilities: any[] = [];
  @Input() user: { name: string; avatarUrl: string } = { name: '', avatarUrl: '/images/default-avatar.jpg' };
  @Output() facilityChange = new EventEmitter<string>();
  @Output() logoutClick = new EventEmitter<void>();
	@Output() toggleSidebar = new EventEmitter<void>();


  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  onFacilityChange(newFacilityId: string) {
    this.facilityChange.emit(newFacilityId);
  }

  logout() {
    this.logoutClick.emit();
  }
}
