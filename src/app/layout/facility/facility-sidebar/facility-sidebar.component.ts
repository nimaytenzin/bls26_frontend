import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ICONS } from '../../../shared/constants/icon.constants';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-facility-sidebar',
  standalone: true,
  templateUrl: './facility-sidebar.component.html',
  styleUrls: ['../../sidebar.component.scss'],
	imports: [
    CommonModule,
		RouterModule,
		FontAwesomeModule,
	],
})
export class FacilitySidebarComponent {

	icons = ICONS;
  @Input() isMobile = false;
	@Input() facilities: any[] = [];
  @Input() selectedFacilityId!: string | null;
  @Output() closeSidebar = new EventEmitter<void>();

	@Input() hasMultipleFacilities = false;
	@Output() facilityChange = new EventEmitter<string>();

  constructor(private router: Router) {}

	onFacilityChange(newFacilityId: string) {
    this.facilityChange.emit(newFacilityId);
  }

  setActiveTab(route: string): void {
    console.log('Saving active tab:', route); // Debugging log
    localStorage.setItem('activeTab', route); // Save the active tab in localStorage
  }
  // If you want the active tab to persist only for the current session (and not across browser restarts)
  // sessionStorage.setItem('activeTab', route);
  // const savedTab = sessionStorage.getItem('activeTab');

  getActiveTab(): string {
    const activeTab = localStorage.getItem('activeTab') || '';
    console.log('Retrieved active tab:', activeTab); // Debugging log
    return activeTab; // Retrieve the active tab from localStorage
  }

  onNavClick(route: string): void {
    this.setActiveTab(route); // Save to localStorage
    this.closeSidebar.emit(); // If using mobile view or toggle
  }

}
