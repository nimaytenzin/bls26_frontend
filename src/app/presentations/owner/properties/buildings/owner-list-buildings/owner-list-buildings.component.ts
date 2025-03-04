import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { BuildingDataService } from 'src/app/core/dataservice/building/building.dataservice';
import { BuildingDTO } from 'src/app/core/dto/properties/building.dto';
import { PARSEBUILDINGFLOORS } from 'src/app/core/utility/helper.function';

@Component({
    selector: 'app-owner-list-buildings',
    templateUrl: './owner-list-buildings.component.html',
    styleUrls: ['./owner-list-buildings.component.scss'],
    standalone: true,
    imports: [CommonModule, ButtonModule, RouterModule],
})
export class OwnerListBuildingsComponent implements OnInit {
    buildings: BuildingDTO[] = [];
    getBuildingFloorConfiguration = PARSEBUILDINGFLOORS;
    buildingImages = [
        'https://www.waytobhutan.com/wp-content/uploads/2020/02/dscf26071-1024x768.jpg',
        'https://media.architecturaldigest.com/photos/5aa7f0882ed63a101d5619f3/master/w_1600%2Cc_limit/amankora-gangtey-bhutan-dining.jpg.jpg',
    ];

    constructor(
        private buildingDataService: BuildingDataService,
        private router: Router
    ) {}

    ngOnInit() {
        this.buildingDataService
            .GetBuildingsPaginatedByOwner(1)
            .subscribe((res) => {
                console.log(res);
                this.buildings = res;
            });
    }

    openViewBuildingDetails(buildingId: number) {
        this.router.navigate(['/owner/properties/building/', buildingId]);
    }
}
