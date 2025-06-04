import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ICONS } from '../../shared/constants/icon.constants';

@Component({
  selector: 'app-navbar',
	standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
	imports: [
		CommonModule,
    FontAwesomeModule
	]
})
export class NavbarComponent {
  @Input() isMobile = false;
  //@Input() hasMultipleFacilities = false;
	//@Input() facilities: any[] = [];
  @Input() user: { name: string; avatarUrl: string } = { name: '', avatarUrl: '/images/default-avatar.jpg' };
  //@Output() facilityChange = new EventEmitter<string>();
  @Output() logoutClick = new EventEmitter<void>();
	@Output() toggleSidebar = new EventEmitter<void>();

  icons = ICONS;
  dropdownOpen = false;

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /*onFacilityChange(newFacilityId: string) {
    this.facilityChange.emit(newFacilityId);
  }*/

  logout() {
    this.logoutClick.emit();
  }
}
