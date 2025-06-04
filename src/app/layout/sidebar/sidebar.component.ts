import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrimeNgModules } from '../../shared/primeng/primeng.modules';
import { AuthService } from '../../auth/auth.service';
import { SidebarMenuService } from '../../core/services/sidebar-menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [CommonModule, FormsModule, PrimeNgModules],
})
export class SidebarComponent implements OnInit {
  @Input() facilities: { id: number; name: string }[] = [];
  @Input() selectedFacilityId!: number | null;
  @Input() hasMultipleFacilities = false;
  @Input() isMobile = false;
  @Output() facilityChange = new EventEmitter<number>();
  @Output() closeSidebar = new EventEmitter<void>();

  panelMenuItems: MenuItem[] = [];
  role: string = 'parent';

  constructor(
    private router: Router,
    private authService: AuthService,
    private sidebarMenuService: SidebarMenuService
  ) {}

  ngOnInit(): void {
    //this.role = this.authService.getCurrentUserRole();
		this.role = 'parent';
    this.panelMenuItems = this.sidebarMenuService.getMenuItems(this.role);
  }

  onFacilityChange(facilityId: number) {
    this.facilityChange.emit(facilityId);
  }

  onNavClick(event: any): void {
    const menuItem = event.item;
    if (menuItem?.routerLink) {
      localStorage.setItem('activeTab', menuItem.routerLink.toString());
      this.closeSidebar.emit();
      this.router.navigateByUrl(menuItem.routerLink.toString());
    }
  }
}
