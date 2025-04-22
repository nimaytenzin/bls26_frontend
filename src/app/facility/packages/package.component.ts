import { Component, OnInit } from '@angular/core';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { PackageService, Package } from '../../core/services/package.service';
import { FacilityService } from '../../core/services/facility.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-package',
  standalone: false,
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss']
})
export class PackageComponent implements OnInit {
  packages: Package[] = [];
  showModal = false;
  editingPackage: Package | null = null;

  constructor(
    private packageService: PackageService,
    private facilityService: FacilityService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.facilityService.selectedFacilityId$
      .pipe(
        filter((id): id is string => typeof id === 'string' && id.trim() !== ''), // Filter valid strings
        distinctUntilChanged()
      )
      .subscribe(id => {
        if (id) {
          this.loadPackages(id); // Convert string to number
        } else {
          console.warn('No facility selected');
        }
      });
  }

  loadPackages(facilityId: string): void {
    this.packageService.getPackagesByFacility(facilityId).subscribe({
      next: data => (this.packages = data),
      error: err => {
        console.error('Failed to load packages', err);
        alert('Failed to load packages. Please try again later.');
      }
    });
  }

  openAddModal(): void {
    this.editingPackage = null;
    this.showModal = true;
  }

  openEditModal(pkg: Package): void {
    this.editingPackage = { ...pkg };
    this.showModal = true;
  }

  handleSave(pkgData: Partial<Package>): void {
    const facilityId = this.facilityService.getFacilityId();
    const user = this.authService.getCurrentUser();
  
    if (!facilityId || isNaN(+facilityId) || !user || !pkgData.name || !pkgData.description || pkgData.price == null) {
      alert('Invalid data. Please check your inputs.');
      return;
    }
  
    const request = this.editingPackage
      ? this.packageService.updatePackage({
          id: this.editingPackage.id!,
          facilityId: +facilityId, // Ensure number
          ownerId: user.id,
          name: pkgData.name!,
          description: pkgData.description!,
          price: pkgData.price
        })
      : this.packageService.addPackage({
          facilityId: +facilityId, // Ensure number
          ownerId: user.id,
          name: pkgData.name!,
          description: pkgData.description!,
          price: pkgData.price
        });
  
    request.subscribe({
      next: () => {
        this.showModal = false;
        this.loadPackages(facilityId);
      },
      error: err => {
        console.error('Save failed', err);
        alert('Failed to save package. Please try again later.');
      }
    });
  }

  deletePackage(id: number | string): void {
    const facilityId = this.facilityService.getFacilityId();
    if (!facilityId || isNaN(+facilityId)) {
      alert('Invalid facility ID.');
      return;
    }
  
    this.packageService.deletePackage(+id).subscribe({
      next: () => this.loadPackages(facilityId),
      error: err => {
        console.error('Failed to delete package', err);
        alert('Failed to delete package. Please try again later.');
      }
    });
  }
}
