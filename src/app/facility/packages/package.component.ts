import { Component, OnInit } from '@angular/core';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { PackageService, Package } from '../../core/services/package.service';
import { FacilityService } from '../../core/services/facility.service';
import { AuthService } from '../../auth/auth.service';
import { PackageModalComponent } from '../package-modal/package-modal.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-package',
  standalone: true,
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss'],
	imports: [
		CommonModule,
		PackageModalComponent,
	]
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
				filter((id): id is string => typeof id === 'string' && id.trim() !== ''), // Ensure valid strings
				distinctUntilChanged() // Only react to changes
			)
			.subscribe(id => {
				this.loadPackages(id); // Load packages for the new facility
			});
	}

	loadPackages(facilityId: string | null): void {
		if (!facilityId || facilityId.trim() === '') {
		  console.error('Invalid facility ID:', facilityId);
		  alert('Invalid facility ID. Please select a valid facility.');
		  return;
		}

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

		if (!facilityId || !user || !pkgData.name || !pkgData.description || pkgData.price == null) {
			alert('Invalid data. Please check your inputs.');
			return;
		}

		const request = this.editingPackage
			? this.packageService.updatePackage({
					id: this.editingPackage.id!,
					facilityId: facilityId, // Use facilityId as a string
					ownerId: user.id,
					name: pkgData.name!,
					description: pkgData.description!,
					price: pkgData.price
				})
			: this.packageService.addPackage({
					facilityId: facilityId, // Use facilityId as a string
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

	deletePackage(id: string): void {
		const facilityId = this.facilityService.getFacilityId();
		if (!facilityId || typeof facilityId !== 'string' || facilityId.trim() === '') {
			alert('Invalid facility ID.');
			return;
		}

		this.packageService.deletePackage(id).subscribe({
			next: () => this.loadPackages(facilityId),
			error: err => {
				console.error('Failed to delete package', err);
				alert('Failed to delete package. Please try again later.');
			}
		});
	}
}
