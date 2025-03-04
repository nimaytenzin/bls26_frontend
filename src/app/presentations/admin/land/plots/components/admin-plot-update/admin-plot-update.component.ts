import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import {
    PLOTCATEGORYENUM,
    LANDAREAUNITS,
    PlotOwnershipENUM,
} from 'src/app/core/constants/enums';
import { UpdatePlotDTO } from 'src/app/core/dataservice/land/dto/plot.dto';
import { PlotDataService } from 'src/app/core/dataservice/land/plot.dataservice';
import { OwnerDTO } from 'src/app/core/dataservice/owners/dto/owner.dto';
import { AdministrativeZoneDTO } from 'src/app/core/dto/locations/administrative-zone.dto';
import { DzongkhagDTO } from 'src/app/core/dto/locations/dzongkhag.dto';
import { SubAdministrativeZoneDTO } from 'src/app/core/dto/locations/sub-administrative-zone.dto';

@Component({
    selector: 'app-admin-plot-update',
    templateUrl: './admin-plot-update.component.html',
    styleUrls: ['./admin-plot-update.component.css'],
    standalone: true,
    imports: [
        ReactiveFormsModule,
        InputTextModule,
        InputNumberModule,
        InputTextareaModule,
        ButtonModule,
        DropdownModule,
        DividerModule,
        CommonModule,
    ],
})
export class AdminPlotUpdateComponent implements OnInit {
    isSubmitting: boolean = false;

    updatePlotForm: FormGroup;

    owners: OwnerDTO[];
    plotCategories = Object.values(PLOTCATEGORYENUM);

    landAreaUnits = Object.values(LANDAREAUNITS);

    ownerTypes = Object.values(PlotOwnershipENUM);

    constructor(
        private fb: FormBuilder,
        private config: DynamicDialogConfig,
        private ref: DynamicDialogRef,
        private plotDataService: PlotDataService,
        private messageService: MessageService
    ) {
        this.updatePlotForm = this.fb.group({
            plotId: ['', [Validators.required]],
            plotCategory: ['', Validators.required],
            netArea: ['', [Validators.required, Validators.min(1)]],
            areaUnit: [LANDAREAUNITS.SQFT, Validators.required],
            lapName: [''],
            lapCode: [''],
            precinctName: [''],
            precinctCode: [''],
            remarks: [''],
        });
        this.updatePlotForm.patchValue({ ...this.config.data });
    }

    ngOnInit() {}
    updatePlot() {
        this.isSubmitting = true;
        if (this.updatePlotForm.invalid) {
            this.isSubmitting = false;
            this.ref.close();
        }

        const data: UpdatePlotDTO = {
            plotId: this.updatePlotForm.controls['plotId'].value,
            plotCategory: this.updatePlotForm.controls['plotCategory'].value,
            netArea: this.updatePlotForm.controls['netArea'].value,
            areaUnit: this.updatePlotForm.controls['areaUnit'].value,
            lapName: this.updatePlotForm.controls['lapName'].value,
            lapCode: this.updatePlotForm.controls['lapCode'].value,
            precinctName: this.updatePlotForm.controls['precinctName'].value,
            precinctCode: this.updatePlotForm.controls['precinctCode'].value,
            remarks: this.updatePlotForm.controls['remarks'].value,
        };
        this.plotDataService.UpdatePlot(data, this.config.data.id).subscribe({
            next: (res) => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Updated',
                    detail: 'Plot Updated Successfully',
                });
                this.ref.close({ status: 200 });
                this.isSubmitting = false;
            },
            error: (err) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: err.error.message,
                });
                this.isSubmitting = false;
                this.ref.close();
            },
        });
    }
    close() {
        this.ref.close();
    }
}
