import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PackageDTO } from 'src/app/core/dto/ems';
import { PackageService } from 'src/app/services/package.service';
import { FacilityDTO } from 'src/app/core/dto/properties/building.dto';
import { FacilityDataService } from 'src/app/services/facility-data.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-admin-master-package',
  standalone: true,
  imports: [CommonModule, FormsModule, TableModule, DropdownModule, DialogModule, ButtonModule],
  templateUrl: './admin-master-package.component.html',
  styleUrls: ['./admin-master-package.component.scss']
})
export class AdminMasterPackageComponent {
  constructor(
    private packageService: PackageService,
    private facilityService: FacilityDataService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadFacilities();
  }

  billingCycles = [
    {
      name: "MONTHLY",
    },
    {
      name: "YEARLY",
    },
    {

      name: "QUARTERLY"
    }
  ]

  facilities: FacilityDTO[] = [];

  selectedFacility: FacilityDTO;
  packages: PackageDTO[] = [];

  currentPackage: PackageDTO= {
    facilityId: 0,
    description: '',
    name: '',
    billing_cycle: '',
    price: 0
  };
  showDialog = false;
  billingCycle: string;

  viewFacility(facility: FacilityDTO) {
    this.packageService.getAllPackagesByFacilityId(facility.id).subscribe((data: PackageDTO[]) => {
      this.packages = data;
    });
  }

  loadFacilities() {
    this.facilityService.getFacilityByOwnerId(Number(localStorage.getItem('userId'))).subscribe((data: FacilityDTO[]) => {
      this.facilities = data;
    });
  }

  openAddPackageDialog() {
    this.currentPackage = {
      facilityId: 0,
      description: '',
      name: '',
      billing_cycle: '',
      price: 0
    };
    this.showDialog = true;
  }

  savePackage() {
    this.currentPackage.facilityId = this.selectedFacility.id
    this.packageService.createPackage(this.currentPackage).subscribe((result)=>{
      if(result){
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Package saved successfully!' });
        this.showDialog = false;
        this.viewFacility(this.selectedFacility);
      }else{
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save package. Please try again.' });
      }
    })
  }
}
