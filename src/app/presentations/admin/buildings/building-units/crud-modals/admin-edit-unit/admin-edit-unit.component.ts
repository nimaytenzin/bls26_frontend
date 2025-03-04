import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { MessageService, Message } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import {
    DynamicDialogRef,
    DialogService,
    DynamicDialogComponent,
} from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessagesModule } from 'primeng/messages';
import { UNITNUMBERS } from 'src/app/core/constants/enums';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { CreateUnitDTO, UnitDTO } from 'src/app/core/dto/units/unit.dto';

@Component({
    selector: 'app-admin-edit-unit',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        DropdownModule,
        InputTextModule,
        InputNumberModule,
        InputTextareaModule,
        MessagesModule,
        CommonModule,
        InputTextareaModule,
    ],
    providers: [MessageService],
    templateUrl: './admin-edit-unit.component.html',
    styleUrl: './admin-edit-unit.component.scss',
})
export class AdminEditUnitComponent {
    constructor(
        private fb: FormBuilder,
        private unitDataService: UnitDataService,
        public ref: DynamicDialogRef,
        private dialogService: DialogService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
        this.unit = this.instance.data;
    }
    instance: DynamicDialogComponent | undefined;
    buildingId: number;
    unit: UnitDTO;
    messages: Message[] | undefined;

    updateUnitForm!: FormGroup;

    floorLevels = [
        'B',
        '2B',
        'S',
        'G',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        'A',
        'J',
    ];
    unitNumbers = Object.values(UNITNUMBERS);

    ngOnInit(): void {
        this.updateUnitForm = this.fb.group({
            buildingId: [null, Validators.required],
            floorLevel: [null, Validators.required],
            unitNumber: [null, Validators.required],
            remarks: [],
            bedroomCount: [1, [Validators.required]],
            toiletCount: [1, [Validators.required]],
            balconyCount: [0, [Validators.required]],
            floorArea: [null, [Validators.required]],
            powerConsumerId: [null, Validators.required],
            zhicharUnitId: [null, Validators.required],
            zhicharQrUuid: [null, Validators.required],
        });
        this.buildingId = this.instance.data.buildingId;
        this.updateUnitForm.patchValue({
            ...this.unit,
        });
        console.log('EDIT UNIT CRUD MODAL', this.unit);
    }

    updateUnit() {
        const updatedUnit: CreateUnitDTO = {
            buildingId: this.buildingId,
            zhicharUnitId: Number(
                this.updateUnitForm.controls['zhicharUnitId'].value
            ),
            zhicharQrUuid: this.updateUnitForm.controls['zhicharQrUuid'].value,
            floorLevel: this.updateUnitForm.controls['floorLevel'].value,
            unitNumber: this.updateUnitForm.controls['unitNumber'].value,
            bedroomCount: this.updateUnitForm.controls['bedroomCount'].value,
            toiletCount: this.updateUnitForm.controls['toiletCount'].value,
            balconyCount: this.updateUnitForm.controls['balconyCount'].value,
            remarks: this.updateUnitForm.controls['remarks'].value,
            powerConsumerId:
                this.updateUnitForm.controls['powerConsumerId'].value,
            floorArea: Number(this.updateUnitForm.controls['floorArea'].value),
        };
        this.unitDataService.UpdateUnit(updatedUnit, this.unit.id).subscribe({
            next: (res) => {
                this.messages = [
                    {
                        severity: 'success',
                        summary: '200',
                        detail: 'Unit Updated',
                    },
                ];
                this.ref.close({
                    status: 200,
                });
            },
            error: (err) => {
                this.messages = [
                    {
                        severity: 'error',
                        summary: 'Error: ' + err.error.statusCode,
                        detail: err.error.message,
                    },
                ];
            },
        });
    }
}
