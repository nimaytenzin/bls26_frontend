import { Component, Input, OnInit } from '@angular/core';
import { UnitDTO } from 'src/app/core/dto/units/unit.dto';

@Component({
    selector: 'app-admin-unit-details-card',
    standalone: true,
    imports: [],
    templateUrl: './admin-unit-details-card.component.html',
    styleUrl: './admin-unit-details-card.component.scss',
})
export class AdminUnitDetailsCardComponent implements OnInit {
    @Input({
        required: true,
    })
    unitId: number;

    @Input({
        required: true,
    })
    unit: UnitDTO;

    ngOnInit(): void {
        console.log(this.unit);
    }
}
