import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DAMAGERESOLVERTYPE } from 'src/app/core/constants/enums';
import { DamageItemService } from 'src/app/core/dataservice/damage-item/damage-item.dataservice';
import { ResolveDamageItemDTO } from 'src/app/core/dataservice/damage-item/damage.item.dto';

@Component({
    selector: 'app-admin-lease-resolve-damage-item-modal',
    templateUrl: './admin-lease-resolve-damage-item-modal.component.html',
    styleUrls: ['./admin-lease-resolve-damage-item-modal.component.css'],
    standalone: true,
    imports: [
        DropdownModule,
        ReactiveFormsModule,
        InputTextModule,
        InputTextareaModule,
        ButtonModule,
        CommonModule,
    ],
})
export class AdminLeaseResolveDamageItemModalComponent implements OnInit {
    resolvedByOptions = Object.values(DAMAGERESOLVERTYPE);
    resolveForm: FormGroup;
    constructor(
        private fb: FormBuilder,
        private config: DynamicDialogConfig,
        private damageItemDataService: DamageItemService,
        private ref: DynamicDialogRef
    ) {
        this.resolveForm = this.fb.group({
            resolutionRemarks: ['', Validators.required],
            resolutionCharges: [null, Validators.required],
            resolvedBy: [null, Validators.required],
        });
    }

    ngOnInit() {}

    submitResolveForm() {
        if (this.resolveForm.valid) {
            const resolutionData: ResolveDamageItemDTO = {
                damageItemId: this.config.data.id,
                resolutionRemarks:
                    this.resolveForm.get('resolutionRemarks')?.value,
                resolutionCharges: Number(
                    this.resolveForm.get('resolutionCharges')?.value
                ),
                resolvedBy: this.resolveForm.get('resolvedBy')?.value,
            };
            console.log(resolutionData);
            this.damageItemDataService
                .ResolveDamageItem(resolutionData)
                .subscribe({
                    next: (res) => {
                        this.resolveForm.reset();
                        this.ref.close({ status: 200 });
                    },
                    error: (err) => {
                        console.log(err);
                    },
                });
        } else {
            this.resolveForm.markAllAsTouched();
        }
    }

    cancelResolve() {
        this.resolveForm.reset();
    }
}
