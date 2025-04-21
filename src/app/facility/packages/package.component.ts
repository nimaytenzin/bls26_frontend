import { Component, OnInit } from '@angular/core';
import { PackageService, Package } from './package.service';
import { FacilityContextService } from '../../layout/facility-layout/facility-context.service';

@Component({
  selector: 'app-package',
  standalone: false,
  templateUrl: './package.component.html',
  styleUrls: ['./package.component.scss']
})
export class PackageComponent implements OnInit {
  packages: Package[] = [];
  newPackage: Partial<Package> = {};

  constructor(
    private packageService: PackageService,
    private facilityContext: FacilityContextService
  ) {}

  ngOnInit(): void {
    const facilityId = this.facilityContext.getFacilityId();
    if (facilityId) {
      this.loadPackages(facilityId);
    }

    // Optionally watch for facility changes dynamically
    this.facilityContext.selectedFacilityId$.subscribe(id => {
      if (id) {
        this.loadPackages(id);
      }
    });
  }

  loadPackages(facilityId: number): void {
    this.packageService.getPackagesByFacility(facilityId).subscribe({
      next: data => {
        this.packages = data;
      },
      error: err => {
        console.error('Failed to load packages', err);
      }
    });
  }

  addPackage(): void {
    const facilityId = this.facilityContext.getFacilityId();
    const { name, description, price } = this.newPackage;
    if (!name || !description || !price || !facilityId) return;

    const newPkg: Package = {
      id: 0,
      facilityId,
      name,
      description,
      price
    };

    this.packageService.addPackage(newPkg).subscribe({
      next: () => {
        this.newPackage = {};
        this.loadPackages(facilityId);
      },
      error: err => {
        console.error('Failed to add package', err);
      }
    });
  }

  deletePackage(id: number): void {
    const facilityId = this.facilityContext.getFacilityId();
    this.packageService.deletePackage(id).subscribe({
      next: () => this.loadPackages(facilityId!),
      error: err => console.error('Failed to delete package', err)
    });
  }
}