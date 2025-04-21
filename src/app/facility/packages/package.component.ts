import { Component, OnInit } from '@angular/core';
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
    const facilityId = this.facilityService.getFacilityId();
    if (facilityId) {
      this.loadPackages(facilityId);
    }

    this.facilityService.selectedFacilityId$.subscribe(id => {
      if (id) {
        this.loadPackages(id);
      }
    });
  }

  loadPackages(facilityId: number): void {
    this.packageService.getPackagesByFacility(facilityId).subscribe({
      next: data => (this.packages = data),
      error: err => console.error('Failed to load packages', err)
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
    if (!facilityId || !pkgData.name || !pkgData.description || pkgData.price == null) return;

		const user = this.authService.getCurrentUser(); // assuming you're injecting AuthService
		if (!user) return;

		const finalPackage: Package = {
			id: this.editingPackage?.id || 0,
			facilityId,
			ownerId: user.id,
			name: pkgData.name,
			description: pkgData.description,
			price: pkgData.price,
			...(this.editingPackage?.id && { id: this.editingPackage.id })
		};

    const request = this.editingPackage
      ? this.packageService.updatePackage(finalPackage)
      : this.packageService.addPackage(finalPackage);

    request.subscribe({
      next: () => {
        this.showModal = false;
        this.loadPackages(facilityId);
      },
      error: err => console.error('Save failed', err)
    });
  }

	deletePackage(id: number): void {
		const facilityId = this.facilityService.getFacilityId();
		if (!facilityId) return;

		this.packageService.deletePackage(id).subscribe({
			next: () => {
				this.loadPackages(facilityId); // Refresh package list after deletion
			},
			error: err => {
				console.error('Failed to delete package', err);
			}
		});
	}
}
