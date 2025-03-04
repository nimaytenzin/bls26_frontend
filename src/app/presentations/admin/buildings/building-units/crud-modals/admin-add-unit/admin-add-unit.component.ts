import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { Message, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import {
    DialogService,
    DynamicDialogComponent,
    DynamicDialogRef,
} from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { MessagesModule } from 'primeng/messages';
import { UNITNUMBERS } from 'src/app/core/constants/enums';
import { UnitDataService } from 'src/app/core/dataservice/units/unit.dataservice';
import { CreateUnitDTO } from 'src/app/core/dto/units/unit.dto';

@Component({
    selector: 'app-admin-add-unit',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        ButtonModule,
        CommonModule,
        DropdownModule,
        InputTextModule,
        InputNumberModule,
        InputTextareaModule,
        MessagesModule,
        InputTextareaModule,
    ],
    providers: [],
    templateUrl: './admin-add-unit.component.html',
    styleUrl: './admin-add-unit.component.scss',
})
export class AdminAddUnitComponent implements OnInit {
    constructor(
        private fb: FormBuilder,
        private unitDataService: UnitDataService,
        public ref: DynamicDialogRef,
        private dialogService: DialogService,
        private messageService: MessageService
    ) {
        this.instance = this.dialogService.getInstance(this.ref);
    }
    isSubmitting: boolean = false;
    instance: DynamicDialogComponent | undefined;
    buildingId: number;

    createUnitForm!: FormGroup;

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
        this.createUnitForm = this.fb.group({
            floorLevel: [null, Validators.required],
            unitNumber: [null, Validators.required],
            bedroomCount: [null, [Validators.required]],
            toiletCount: [null, [Validators.required]],
            balconyCount: [null, [Validators.required]],
            remarks: [null],
            floorArea: [null],
            powerConsumerId: [null],
            zhicharUnitId: [null],
            zhicharQrUuid: [null],
        });
        this.buildingId = this.instance.data.buildingId;
    }

    createUnit() {
        if (this.createUnitForm.invalid) {
            this.messageService.add({
                severity: 'error',
                summary: 'Missing Fields',
                detail: 'Please add all required fields',
            });
            return;
        }
        if (this.isSubmitting) {
            return;
        }
        if (this.createUnitForm.valid) {
            this.isSubmitting = true;
            const newUnit: CreateUnitDTO = {
                buildingId: this.buildingId,
                zhicharUnitId: Number(
                    this.createUnitForm.controls['zhicharUnitId'].value
                ),
                remarks: this.createUnitForm.controls['remarks'].value,
                zhicharQrUuid:
                    this.createUnitForm.controls['zhicharQrUuid'].value,
                floorLevel: this.createUnitForm.controls['floorLevel'].value,
                unitNumber: this.createUnitForm.controls['unitNumber'].value,
                bedroomCount:
                    this.createUnitForm.controls['bedroomCount'].value,
                toiletCount: this.createUnitForm.controls['toiletCount'].value,
                balconyCount:
                    this.createUnitForm.controls['balconyCount'].value,
                powerConsumerId:
                    this.createUnitForm.controls['powerConsumerId'].value,
                floorArea: Number(
                    this.createUnitForm.controls['floorArea'].value
                ),
            };
            this.unitDataService.CreateUnit(newUnit).subscribe({
                next: (res) => {
                    this.isSubmitting = false;

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Added',
                        detail: 'Unit added',
                    });
                    this.ref.close({
                        status: 201,
                    });
                },
                error: (err) => {
                    console.log(err);
                    this.isSubmitting = false;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: err.error.message,
                    });
                },
            });
        }
    }

    close() {
        this.ref.close();
    }
}
