import { Component, OnInit } from '@angular/core';
import { PackageService, Package } from './package.service';

@Component({
  selector: 'app-package',
	standalone: false,
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss']
})
export class PackageComponent implements OnInit {
  facilities: any[] = [];
  selectedFacilityId: number = 0;
  packages: Package[] = [];
  newPackage: Partial<Package> = {};

  constructor(private packageService: PackageService) {}

  ngOnInit(): void {
    this.loadFacilities();
  }

  loadFacilities(): void {
    this.packageService.getFacilities().subscribe({
      next: data => {
        this.facilities = data;
        if (this.facilities.length > 0) {
          this.selectedFacilityId = this.facilities[0].id;
          this.loadPackages();
        }
      },
      error: err => {
        console.error('Failed to load facilities', err);
      }
    });
  }

  onFacilityChange(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    if (!this.selectedFacilityId) return;
    this.packageService.getPackagesByFacility(this.selectedFacilityId).subscribe({
      next: data => {
        this.packages = data;
      },
      error: err => {
        console.error('Failed to load packages', err);
      }
    });
  }

  addPackage(): void {
    const { name, description, price } = this.newPackage;
    if (!name || !description || !price || !this.selectedFacilityId) return;

    const newPkg: Package = {
      id: 0,
      facilityId: this.selectedFacilityId,
      name,
      description,
      price
    };

    this.packageService.addPackage(newPkg).subscribe({
      next: () => {
        this.newPackage = {};
        this.loadPackages();
      },
      error: err => {
        console.error('Failed to add package', err);
      }
    });
  }

  deletePackage(id: number): void {
    this.packageService.deletePackage(id).subscribe({
      next: () => this.loadPackages(),
      error: err => console.error('Failed to delete package', err)
    });
  }
}
